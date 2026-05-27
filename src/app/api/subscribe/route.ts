export const runtime = "edge";

// Buttondown API: https://docs.buttondown.com/api-subscribers-create
const BUTTONDOWN_BASE =
  process.env.BUTTONDOWN_BASE_URL ?? "https://api.buttondown.com/v1";
const TOKEN = process.env.BUTTONDOWN_API_KEY ?? "";

const MAX_EMAIL_LEN = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function POST(req: Request) {
  if (!TOKEN) {
    return json(503, {
      error: "subscribe_unconfigured",
      message: "Newsletter 后端尚未配置（BUTTONDOWN_API_KEY 缺失），临时不可用。",
    });
  }

  let payload: { email?: string };
  try {
    payload = (await req.json()) as { email?: string };
  } catch {
    return json(400, { error: "bad_json", message: "请求体不是合法 JSON。" });
  }

  const email = (payload.email ?? "").trim().toLowerCase();
  if (!email) {
    return json(400, { error: "missing_email", message: "请输入邮箱。" });
  }
  if (email.length > MAX_EMAIL_LEN) {
    return json(400, { error: "email_too_long", message: "邮箱过长。" });
  }
  if (!EMAIL_RE.test(email)) {
    return json(400, { error: "bad_email", message: "邮箱格式不正确。" });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BUTTONDOWN_BASE}/subscribers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${TOKEN}`,
      },
      body: JSON.stringify({
        email_address: email,
        type: "regular",
        referrer_url:
          req.headers.get("referer") ??
          "https://claude2master.com/subscribe",
      }),
    });
  } catch (e) {
    return json(502, {
      error: "upstream_unreachable",
      message: `Newsletter 后端不可达：${(e as Error).message}`,
    });
  }

  if (upstream.ok || upstream.status === 201) {
    return json(200, { status: "subscribed" });
  }

  const detail = await upstream.text().catch(() => "");
  // Buttondown 422/400 报已存在的邮箱
  if (
    (upstream.status === 400 || upstream.status === 422) &&
    /already|exists|subscribed/i.test(detail)
  ) {
    return json(200, { status: "already_subscribed" });
  }

  return json(502, {
    error: "upstream_failed",
    message: "Newsletter 后端返回非 2xx。",
    upstream_status: upstream.status,
    detail: detail.slice(0, 400),
  });
}
