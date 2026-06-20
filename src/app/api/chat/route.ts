import { buildOutbound, OUTBOUND_CAMPAIGN } from "@/lib/outbound";

export const runtime = "edge";

// 额度耗尽返回给前端的升级链接:带 chat-exhausted 归因(单一出站构造点)。
const UPGRADE_URL = buildOutbound("newapi", OUTBOUND_CAMPAIGN.chatExhausted);

type ChatMessage = { role: "user" | "assistant"; content: string };
type ChatBody = { messages: ChatMessage[] };

const NEWAPI_BASE =
  process.env.NEXT_PUBLIC_NEWAPI_BASE_URL ?? "https://newapi.lurus.cn";
const TRIAL_TOKEN = process.env.NEWAPI_TRIAL_TOKEN ?? "";
// 引擎模型 id 只在服务端配置 —— 不对用户/UI 暴露(站内不展示模型名)。
const ENGINE_MODEL = process.env.NEWAPI_CHAT_MODEL ?? "deepseek-v3-2-251201";

const TRIAL_LIMIT = 3;
const COOKIE_NAME = "c2m_trial";
const COOKIE_MAX_AGE = 86400;
const MAX_MSG_LEN = 4000;
const MAX_CTX_MSGS = 12;
const MAX_TOKENS = 1024;
// 上游响应超时(ms)。低于 Edge runtime 硬限, 保证能返回可读的 504 而非平台级超时。
const UPSTREAM_TIMEOUT_MS = 20000;

function readTrialUsed(cookie: string): number {
  // 精确按 key 解析, 不用子串正则: 否则伪造 `c2m_trial=0` 排在真值前即可绕过,
  // 且 `x_c2m_trial=...` 这类前缀也会被误命中。(注: 这是弱客户端 gate, 此修仅堵显式绕过)
  const val = cookie
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  const n = val ? Number(val) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function jsonError(
  status: number,
  code: string,
  message: string,
  extra?: Record<string, unknown>,
) {
  return new Response(
    JSON.stringify({ error: code, message, ...extra }),
    {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    },
  );
}

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const used = readTrialUsed(cookie);

  if (used >= TRIAL_LIMIT) {
    return jsonError(
      429,
      "trial_exhausted",
      `免费 ${TRIAL_LIMIT} 次试用已用完。注册 newapi.lurus.cn 解锁完整额度。`,
      {
        upgrade_url: UPGRADE_URL,
        trial_used: used,
        trial_limit: TRIAL_LIMIT,
      },
    );
  }

  if (!TRIAL_TOKEN) {
    return jsonError(
      503,
      "trial_unconfigured",
      "Trial 后端尚未配置（NEWAPI_TRIAL_TOKEN 缺失），临时不可用。",
    );
  }

  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return jsonError(400, "bad_json", "请求体不是合法 JSON。");
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return jsonError(400, "empty_messages", "messages 不能为空。");
  }

  for (const m of messages) {
    if (!m || typeof m.content !== "string") {
      return jsonError(400, "bad_message", "message 缺少 content。");
    }
    if (m.content.length > MAX_MSG_LEN) {
      return jsonError(
        400,
        "msg_too_long",
        `单条消息超过 ${MAX_MSG_LEN} 字符。`,
      );
    }
    // 不接受客户端注入 system role(防 prompt injection / 越权改模型行为)。
    const role = m.role as string;
    if (role === "system") {
      return jsonError(400, "bad_role", "system 消息不可由客户端传入。");
    }
    if (role !== "user" && role !== "assistant") {
      return jsonError(400, "bad_role", "role 不合法。");
    }
  }

  const safeMessages = messages.slice(-MAX_CTX_MSGS);

  let upstream: Response;
  try {
    upstream = await fetch(`${NEWAPI_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TRIAL_TOKEN}`,
      },
      body: JSON.stringify({
        model: ENGINE_MODEL,
        messages: safeMessages,
        stream: true,
        max_tokens: MAX_TOKENS,
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (e) {
    const err = e as Error;
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return jsonError(504, "upstream_timeout", "上游网关响应超时，请稍后重试。");
    }
    return jsonError(502, "upstream_unreachable", `上游网关不可达: ${err.message}`);
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return jsonError(502, "upstream_failed", "上游返回非 2xx。", {
      status: upstream.status,
      detail: text.slice(0, 400),
    });
  }

  const newUsed = used + 1;
  const setCookie = `${COOKIE_NAME}=${newUsed}; Path=/; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure`;

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Set-Cookie": setCookie,
      "X-Trial-Used": String(newUsed),
      "X-Trial-Limit": String(TRIAL_LIMIT),
    },
  });
}
