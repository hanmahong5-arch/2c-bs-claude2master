import { MODEL_ID, type ModelKey } from "@/lib/prompts";

export const runtime = "edge";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };
type ChatBody = { model: ModelKey; messages: ChatMessage[] };

const NEWAPI_BASE =
  process.env.NEXT_PUBLIC_NEWAPI_BASE_URL ?? "https://newapi.lurus.cn";
const TRIAL_TOKEN = process.env.NEWAPI_TRIAL_TOKEN ?? "";

const TRIAL_LIMIT = 3;
const COOKIE_NAME = "c2m_trial";
const COOKIE_MAX_AGE = 86400;
const MAX_MSG_LEN = 4000;
const MAX_CTX_MSGS = 12;
const MAX_TOKENS = 1024;

function readTrialUsed(cookie: string): number {
  const m = cookie.match(/c2m_trial=([0-9]+)/);
  return m ? Number(m[1]) : 0;
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
        upgrade_url: "https://newapi.lurus.cn",
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

  const modelKey = body.model;
  if (!modelKey || !(modelKey in MODEL_ID)) {
    return jsonError(400, "bad_model", "model 字段不合法，应为 haiku/sonnet/opus。");
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
    if (m.role !== "user" && m.role !== "assistant" && m.role !== "system") {
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
        model: MODEL_ID[modelKey],
        messages: safeMessages,
        stream: true,
        max_tokens: MAX_TOKENS,
      }),
    });
  } catch (e) {
    return jsonError(502, "upstream_unreachable", `上游网关不可达: ${(e as Error).message}`);
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return jsonError(502, "upstream_failed", "上游返回非 2xx。", {
      status: upstream.status,
      detail: text.slice(0, 400),
    });
  }

  const newUsed = used + 1;
  const setCookie = `${COOKIE_NAME}=${newUsed}; Path=/; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`;

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
