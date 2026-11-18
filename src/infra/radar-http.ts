export interface NewapiCompletionParams {
  baseUrl: string;
  token: string;
  model: string;
  systemPrompt: string;
  userContent: string;
  maxTokens: number;
  temperature: number;
}

export async function radarFetchText(
  url: string,
  headers?: Record<string, string>,
): Promise<string> {
  const resp = await fetch(url, { headers, redirect: "follow" });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return await resp.text();
}

export async function radarFetchOptionalText(
  url: string,
  headers?: Record<string, string>,
): Promise<string | null> {
  try {
    const resp = await fetch(url, { headers, redirect: "follow" });
    return resp.ok ? await resp.text() : null;
  } catch {
    return null;
  }
}

export async function radarFetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data?: T; errorText: string }> {
  const resp = await fetch(url, init);
  if (!resp.ok) {
    const errorText = await resp.text().catch(() => "");
    return { ok: false, status: resp.status, errorText };
  }
  const data = (await resp.json()) as T;
  return { ok: true, status: resp.status, data, errorText: "" };
}

export async function radarCheckHealth(
  url: string,
  timeoutMs: number,
): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function radarPostBinary(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<Uint8Array> {
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`tts ${res.status}: ${detail.slice(0, 200)}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

export async function postNewapiCompletion(
  params: NewapiCompletionParams,
): Promise<string> {
  const resp = await fetch(`${params.baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({
      model: params.model,
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userContent },
      ],
      response_format: { type: "json_object" },
      temperature: params.temperature,
      max_tokens: params.maxTokens,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    const err = new Error(`newapi ${resp.status}: ${text.slice(0, 300)}`);
    (err as { status?: number }).status = resp.status;
    throw err;
  }

  const json = (await resp.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("LLM returned empty content");
  return content;
}
