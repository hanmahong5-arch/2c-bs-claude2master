#!/usr/bin/env python3
"""cosyvoice_server.py — 常驻 HTTP 服务, 把 CosyVoice2-0.5B 模型热加载在 GPU 显存里。

跑在 WSL (Ubuntu, RTX 4070); Windows 侧 bun 脚本经 localhost:8123 直达 (WSL2 端口透传)。
情感播报靠 inference_instruct2 的自然语言指令 —— edge-tts 免费端点的中文情感被微软永久屏蔽。

启动 (在 conda env `cosyvoice` 内, 需先 `pip install fastapi uvicorn`):
    COSY_HOME=/root/CosyVoice \\
    python scripts/radar/cosyvoice_server.py            # 默认 0.0.0.0:8123
    # 经 newapi / Cloudflare Tunnel 对外暴露时, 额外设 COSY_API_KEY=<随机串> 开 Bearer 鉴权。

接口:
    GET  /healthz           → {"ok": true, "device": "cuda"}  (探活, 模型加载完才 200, 永不鉴权)
    POST /tts {text,lang,instruct?} → audio/mpeg (24kHz/48kbps mono mp3)  (本地直连, radar 用)
    POST /v1/audio/speech {input,voice?,instructions?,response_format?} → audio/mpeg|audio/wav
        OpenAI 兼容端点, 供 newapi 注册为 OpenAI(1) channel 中转:
          input→正文, instructions→CosyVoice instruct(情感), voice 以 "en" 开头→英文否则中文,
          response_format 仅 mp3/wav, model/speed 忽略。
    鉴权: 设 COSY_API_KEY 后 /tts 与 /v1/audio/speech 均需 `Authorization: Bearer <key>`;
          未设则放行 (本地直连默认零鉴权)。

设计:
    - 模型只加载一次 (fp16, ~3-4G 显存, 4070 12G 充裕); load_trt=False → 不需要 TensorRT。
    - asyncio.Lock 串行化推理: 单条单跑, 防并发 GPU OOM。
    - 推理在 thread 跑 (阻塞调用), 不卡事件循环。
    - 服务端用 ffmpeg 把 PCM → mp3 (Windows 侧免装 ffmpeg)。
"""

import asyncio
import io
import os
import sys
import wave
from contextlib import asynccontextmanager

import numpy as np
import torch
import uvicorn
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel

# ── CosyVoice 源码 / 模型 / 参考音色路径 (相对 COSY_HOME) ──
COSY_HOME = os.environ.get("COSY_HOME", "/root/CosyVoice")
sys.path.insert(0, COSY_HOME)
sys.path.insert(0, os.path.join(COSY_HOME, "third_party", "Matcha-TTS"))

MODEL_DIR = os.environ.get(
    "COSY_MODEL_DIR", os.path.join(COSY_HOME, "pretrained_models", "CosyVoice2-0.5B")
)
# 参考音色 (16k)。中英先用同一默认参考 (B1 试听门禁验证); 英文别扭可改 COSY_PROMPT_EN。
PROMPT_ZH = os.environ.get(
    "COSY_PROMPT_ZH", os.path.join(COSY_HOME, "asset", "zero_shot_prompt.wav")
)
PROMPT_EN = os.environ.get("COSY_PROMPT_EN", PROMPT_ZH)

DEFAULT_ZH_INSTRUCT = "用专业、热情的新闻主播语气播报，吐字清晰、节奏明快。"
DEFAULT_EN_INSTRUCT = "Read in a professional, upbeat news-anchor tone."

# CosyVoice2 instruct 模式要求 instruct_text 以此特殊 token 收尾分隔指令与正文
# (inference_instruct2 不自动补; 所有官方 example.py 都手动带)。
INSTRUCT_END = "<|endofprompt|>"

HOST = os.environ.get("COSY_HOST", "0.0.0.0")
PORT = int(os.environ.get("COSY_PORT", "8123"))

# 经 newapi / Cloudflare Tunnel 对外暴露时设置: 非空则 /tts 与 /v1/audio/speech 都要求
# `Authorization: Bearer <key>`。未设 → 放行 (保持本地 localhost 直连的默认零鉴权)。
# healthz 永不鉴权 (探活)。
API_KEY = os.environ.get("COSY_API_KEY", "").strip()

# 运行时填充 (lifespan 加载)
_model = None
_prompt_zh = None
_prompt_en = None
_sample_rate = 24000
_lock = asyncio.Lock()


def _load():
    """加载模型 + 校验参考音色路径 (阻塞, 仅启动时调一次)。"""
    global _model, _prompt_zh, _prompt_en, _sample_rate
    from cosyvoice.cli.cosyvoice import CosyVoice2

    _model = CosyVoice2(MODEL_DIR, load_jit=False, load_trt=False, fp16=True)
    _sample_rate = _model.sample_rate
    # 此版 inference_instruct2 的 prompt_wav 取「文件路径」: frontend 内部各 _extract_* 自己
    # load_wav(path, 16k/24k) 重采样。传预加载 tensor 会报 "Invalid file"。故只存路径, 不预加载。
    for p in {PROMPT_ZH, PROMPT_EN}:
        if not os.path.exists(p):
            raise RuntimeError(f"prompt wav not found: {p}")
    _prompt_zh = PROMPT_ZH
    _prompt_en = PROMPT_EN


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await asyncio.to_thread(_load)
    yield


app = FastAPI(lifespan=lifespan)


async def require_key(authorization: str | None = Header(default=None)) -> None:
    """Bearer 鉴权依赖: API_KEY 未配置则放行; 配置后须匹配, 否则 401。"""
    if not API_KEY:
        return
    if authorization != f"Bearer {API_KEY}":
        raise HTTPException(status_code=401, detail="invalid or missing api key")


class TtsReq(BaseModel):
    text: str
    lang: str = "zh"  # "zh" | "en"
    instruct: str | None = None


# OpenAI /v1/audio/speech 请求体 (newapi 透传的字段子集)。
class SpeechReq(BaseModel):
    input: str
    model: str | None = None  # 路由用, 本服务忽略 (channel 已绑定本模型)
    voice: str | None = None  # 约定: 以 "en" 开头→英文, 否则中文 (标准 OpenAI voice 名默认中文)
    instructions: str | None = None  # → CosyVoice instruct (情感指令), 天然对应
    response_format: str | None = "mp3"  # 仅 mp3 / wav
    speed: float | None = None  # CosyVoice2 不吃此参数, 节奏由 instruct 控制 → 忽略


def _wav_bytes(wav_tensor: "torch.Tensor", sr: int) -> bytes:
    """torch float [-1,1] → PCM16 mono WAV bytes (无外部依赖)。"""
    audio = wav_tensor.squeeze().detach().cpu().numpy()
    audio = np.clip(audio, -1.0, 1.0)
    pcm16 = (audio * 32767.0).astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm16.tobytes())
    return buf.getvalue()


def _synth(text: str, instruct: str, prompt) -> bytes:
    """inference_instruct2 → 拼接所有 chunk → WAV bytes (阻塞, 在 thread 跑)。"""
    if INSTRUCT_END not in instruct:
        instruct = instruct + INSTRUCT_END
    chunks = []
    for out in _model.inference_instruct2(text, instruct, prompt, stream=False):
        chunks.append(out["tts_speech"])
    if not chunks:
        raise RuntimeError("no audio produced")
    wav = torch.concat(chunks, dim=1)
    return _wav_bytes(wav, _sample_rate)


async def _wav_to_mp3(wav_bytes: bytes) -> bytes:
    """WAV → mp3 (24kHz/48kbps mono) via ffmpeg 子进程。"""
    proc = await asyncio.create_subprocess_exec(
        "ffmpeg", "-hide_banner", "-loglevel", "error",
        "-i", "pipe:0", "-ar", "24000", "-ac", "1", "-b:a", "48k", "-f", "mp3", "pipe:1",
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    out, err = await proc.communicate(wav_bytes)
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {err.decode(errors='ignore')[:200]}")
    return out


@app.get("/healthz")
async def healthz():
    if _model is None:
        return JSONResponse({"ok": False, "reason": "loading"}, status_code=503)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    return {"ok": True, "device": device, "sample_rate": _sample_rate}


@app.post("/tts", dependencies=[Depends(require_key)])
async def tts(req: TtsReq):
    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="empty text")
    if _model is None:
        raise HTTPException(status_code=503, detail="model loading")

    if req.lang == "en":
        instruct = req.instruct or DEFAULT_EN_INSTRUCT
        prompt = _prompt_en
    else:
        instruct = req.instruct or DEFAULT_ZH_INSTRUCT
        prompt = _prompt_zh

    # 串行: 单条单跑防并发 GPU OOM
    async with _lock:
        try:
            wav_bytes = await asyncio.to_thread(_synth, text, instruct, prompt)
        except Exception as e:  # noqa: BLE001 — 单条失败回 500, 调用方跳过不阻塞整批
            raise HTTPException(status_code=500, detail=f"synth: {e}") from e
    mp3 = await _wav_to_mp3(wav_bytes)
    return Response(content=mp3, media_type="audio/mpeg")


@app.post("/v1/audio/speech", dependencies=[Depends(require_key)])
async def audio_speech(req: SpeechReq):
    """OpenAI 兼容 TTS: 供 newapi 注册为 OpenAI(1) channel 中转。复用 /tts 的合成路径。"""
    text = (req.input or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="empty input")
    if _model is None:
        raise HTTPException(status_code=503, detail="model loading")

    fmt = (req.response_format or "mp3").lower()
    if fmt not in ("mp3", "wav"):
        # 诚实拒绝: 本服务只产 PCM/WAV→mp3, 不冒充支持 opus/aac/flac/pcm。
        raise HTTPException(
            status_code=400,
            detail=f"unsupported response_format '{fmt}'; only mp3 or wav",
        )

    # voice 选语种 + 参考音色: 以 "en" 开头→英文, 否则中文 (标准 OpenAI voice 名走默认中文)
    if (req.voice or "").lower().startswith("en"):
        instruct = req.instructions or DEFAULT_EN_INSTRUCT
        prompt = _prompt_en
    else:
        instruct = req.instructions or DEFAULT_ZH_INSTRUCT
        prompt = _prompt_zh

    async with _lock:
        try:
            wav_bytes = await asyncio.to_thread(_synth, text, instruct, prompt)
        except Exception as e:  # noqa: BLE001 — 单条失败回 500, 调用方跳过不阻塞整批
            raise HTTPException(status_code=500, detail=f"synth: {e}") from e

    if fmt == "wav":
        return Response(content=wav_bytes, media_type="audio/wav")
    mp3 = await _wav_to_mp3(wav_bytes)
    return Response(content=mp3, media_type="audio/mpeg")


if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT, log_level="info")
