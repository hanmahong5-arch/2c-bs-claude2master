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
    POST /voices (multipart: file=wav/m4a/mp3 ≤30s, name?) → {"voice_id","prompt_text"}
        zero-shot 声音克隆样本登记: 转 16k mono wav 存 COSY_VOICES_DIR/<id>.wav,
        openai-whisper 自动转写 prompt_text 存 <id>.txt (转写错会拉低克隆相似度,
        可 PUT /voices/<id> {"prompt_text"} 人工修正)。
    GET  /voices            → 已登记音色列表
    PUT  /voices/<id> {prompt_text} → 修正转写
    DELETE /voices/<id>     → 删除克隆样本+转写+名字 (用户删除权; 后续合成该 id 返回 404)
    /tts 与 /v1/audio/speech 的 voice 支持 "custom:<voice_id>" → inference_zero_shot
        克隆音色合成 (克隆模式与 instruct 情感模式二选一: custom voice 时忽略 instruct)。
    鉴权: 设 COSY_API_KEY 后除 /healthz 外所有端点均需 `Authorization: Bearer <key>`;
          未设则放行 (本地直连默认零鉴权)。

声音克隆合规红线 (产品文案须同步声明):
    - 仅允许克隆「本人」声音, 且须取得本人明确同意;
    - 禁止克隆名人、公众人物或任何未授权第三方音色;
    - 克隆音色仅用于本人/家庭场景 (如用家长声音给孩子读故事), 不得用于冒充。

设计:
    - 模型只加载一次 (fp16, ~3-4G 显存, 4070 12G 充裕); load_trt=False → 不需要 TensorRT。
    - asyncio.Lock 串行化推理: 单条单跑, 防并发 GPU OOM。
    - 推理在 thread 跑 (阻塞调用), 不卡事件循环。
    - 服务端用 ffmpeg 把 PCM → mp3 (Windows 侧免装 ffmpeg)。
"""

import asyncio
import io
import os
import re
import sys
import tempfile
import uuid
import wave
from contextlib import asynccontextmanager

import numpy as np
import torch
import uvicorn
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
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

# zero-shot 克隆音色样本目录 (R5: /home 大盘, 根盘只剩 ~18G 勿写)
VOICES_DIR = os.environ.get("COSY_VOICES_DIR", "/home/cosy-voices")
MAX_VOICE_SECONDS = 30
_VOICE_ID_RE = re.compile(r"[a-f0-9]{12}")

# 运行时填充 (lifespan 加载)
_model = None
_prompt_zh = None
_prompt_en = None
_sample_rate = 24000
_lock = asyncio.Lock()
# whisper 懒加载 (仅 /voices 上传时用; small ~1G 显存, 与 CosyVoice 共存充裕)
_whisper = None


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
    voice: str | None = None  # "custom:<id>" → zero-shot 克隆音色 (此时忽略 lang/instruct)


class VoiceFixReq(BaseModel):
    prompt_text: str


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


def _synth_zero_shot(text: str, prompt_text: str, prompt_wav: str) -> bytes:
    """inference_zero_shot (克隆音色) → WAV bytes (阻塞, 在 thread 跑)。"""
    chunks = []
    for out in _model.inference_zero_shot(text, prompt_text, prompt_wav, stream=False):
        chunks.append(out["tts_speech"])
    if not chunks:
        raise RuntimeError("no audio produced")
    wav = torch.concat(chunks, dim=1)
    return _wav_bytes(wav, _sample_rate)


def _resolve_custom_voice(voice: str) -> tuple[str, str]:
    """"custom:<id>" → (prompt_text, prompt_wav_path); 不存在/非法 → HTTPException。"""
    vid = voice.split(":", 1)[1].strip()
    if not _VOICE_ID_RE.fullmatch(vid):
        raise HTTPException(status_code=400, detail=f"bad voice id '{vid}'")
    wav_path = os.path.join(VOICES_DIR, f"{vid}.wav")
    txt_path = os.path.join(VOICES_DIR, f"{vid}.txt")
    if not (os.path.exists(wav_path) and os.path.exists(txt_path)):
        raise HTTPException(status_code=404, detail=f"voice '{vid}' not found")
    with open(txt_path, encoding="utf-8") as f:
        prompt_text = f.read().strip()
    if not prompt_text:
        raise HTTPException(status_code=409, detail=f"voice '{vid}' has empty prompt_text; PUT /voices/{vid} to fix")
    return prompt_text, wav_path


def _transcribe(path: str) -> str:
    """whisper 转写克隆样本 (阻塞, 在 thread + _lock 内跑; 语种自动检测)。"""
    global _whisper
    if _whisper is None:
        import whisper

        _whisper = whisper.load_model("small")
    return (_whisper.transcribe(path)["text"] or "").strip()


def _wav_duration_seconds(path: str) -> float:
    with wave.open(path, "rb") as w:
        return w.getnframes() / w.getframerate()


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


@app.post("/voices", dependencies=[Depends(require_key)])
async def create_voice(file: UploadFile = File(...), name: str = Form("")):
    """登记克隆样本: 任意 ffmpeg 可解格式 → 16k mono wav (≤30s) + whisper 转写。"""
    if _model is None:
        raise HTTPException(status_code=503, detail="model loading")
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="empty file")

    os.makedirs(VOICES_DIR, exist_ok=True)
    vid = uuid.uuid4().hex[:12]
    wav_path = os.path.join(VOICES_DIR, f"{vid}.wav")
    # m4a/mp4 容器的 moov atom 常在文件尾, 不能 pipe 喂 ffmpeg → 先落临时文件
    suffix = os.path.splitext(file.filename or "")[1] or ".bin"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(raw)
        src = tmp.name
    try:
        proc = await asyncio.create_subprocess_exec(
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-i", src, "-ar", "16000", "-ac", "1", wav_path,
            stderr=asyncio.subprocess.PIPE,
        )
        _, err = await proc.communicate()
        if proc.returncode != 0:
            raise HTTPException(
                status_code=400,
                detail=f"ffmpeg cannot decode sample: {err.decode(errors='ignore')[:200]}",
            )
        duration = _wav_duration_seconds(wav_path)
        if duration > MAX_VOICE_SECONDS:
            os.remove(wav_path)
            raise HTTPException(
                status_code=400,
                detail=f"sample too long: {duration:.1f}s > {MAX_VOICE_SECONDS}s (5-30s 最佳)",
            )
        async with _lock:  # whisper 也吃 GPU, 与合成共用串行锁
            prompt_text = await asyncio.to_thread(_transcribe, wav_path)
    finally:
        os.remove(src)

    with open(os.path.join(VOICES_DIR, f"{vid}.txt"), "w", encoding="utf-8") as f:
        f.write(prompt_text)
    if name.strip():
        with open(os.path.join(VOICES_DIR, f"{vid}.name"), "w", encoding="utf-8") as f:
            f.write(name.strip())
    return {"voice_id": vid, "prompt_text": prompt_text, "duration_seconds": round(duration, 1)}


@app.get("/voices", dependencies=[Depends(require_key)])
async def list_voices():
    voices = []
    try:
        files = sorted(os.listdir(VOICES_DIR))
    except FileNotFoundError:
        files = []
    for f in files:
        if not f.endswith(".wav"):
            continue
        vid = f[:-4]
        txt_path = os.path.join(VOICES_DIR, f"{vid}.txt")
        name_path = os.path.join(VOICES_DIR, f"{vid}.name")
        prompt_text = ""
        if os.path.exists(txt_path):
            with open(txt_path, encoding="utf-8") as fh:
                prompt_text = fh.read().strip()
        name = ""
        if os.path.exists(name_path):
            with open(name_path, encoding="utf-8") as fh:
                name = fh.read().strip()
        voices.append({"voice_id": vid, "name": name, "prompt_text": prompt_text})
    return {"voices": voices}


@app.put("/voices/{vid}", dependencies=[Depends(require_key)])
async def fix_voice(vid: str, req: VoiceFixReq):
    """人工修正 whisper 转写 (prompt_text 不准会明显拉低克隆相似度)。"""
    if not _VOICE_ID_RE.fullmatch(vid):
        raise HTTPException(status_code=400, detail=f"bad voice id '{vid}'")
    if not os.path.exists(os.path.join(VOICES_DIR, f"{vid}.wav")):
        raise HTTPException(status_code=404, detail=f"voice '{vid}' not found")
    text = req.prompt_text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="empty prompt_text")
    with open(os.path.join(VOICES_DIR, f"{vid}.txt"), "w", encoding="utf-8") as f:
        f.write(text)
    return {"voice_id": vid, "prompt_text": text}


@app.delete("/voices/{vid}", dependencies=[Depends(require_key)])
async def delete_voice(vid: str):
    """删除克隆音色 (样本 wav + 转写 txt + 名字): 用户「一键删除」的服务端落点。

    幂等: 文件不存在也返回 200 deleted=false, 调用方无需区分「已删」与「从未有过」。
    """
    if not _VOICE_ID_RE.fullmatch(vid):
        raise HTTPException(status_code=400, detail=f"bad voice id '{vid}'")
    deleted = False
    for ext in (".wav", ".txt", ".name"):
        p = os.path.join(VOICES_DIR, f"{vid}{ext}")
        try:
            os.remove(p)
            deleted = True
        except FileNotFoundError:
            pass
    return {"voice_id": vid, "deleted": deleted}


@app.post("/tts", dependencies=[Depends(require_key)])
async def tts(req: TtsReq):
    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="empty text")
    if _model is None:
        raise HTTPException(status_code=503, detail="model loading")

    # 克隆模式与 instruct 情感模式二选一: custom voice 走 zero-shot
    if (req.voice or "").startswith("custom:"):
        prompt_text, prompt_wav = _resolve_custom_voice(req.voice)
        async with _lock:
            try:
                wav_bytes = await asyncio.to_thread(_synth_zero_shot, text, prompt_text, prompt_wav)
            except Exception as e:  # noqa: BLE001
                raise HTTPException(status_code=500, detail=f"synth: {e}") from e
        mp3 = await _wav_to_mp3(wav_bytes)
        return Response(content=mp3, media_type="audio/mpeg")

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

    # 克隆模式与 instruct 情感模式二选一: custom voice 走 zero-shot
    if (req.voice or "").startswith("custom:"):
        prompt_text, prompt_wav = _resolve_custom_voice(req.voice)
        async with _lock:
            try:
                wav_bytes = await asyncio.to_thread(_synth_zero_shot, text, prompt_text, prompt_wav)
            except Exception as e:  # noqa: BLE001
                raise HTTPException(status_code=500, detail=f"synth: {e}") from e
        if fmt == "wav":
            return Response(content=wav_bytes, media_type="audio/wav")
        mp3 = await _wav_to_mp3(wav_bytes)
        return Response(content=mp3, media_type="audio/mpeg")

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
