export interface ChatPayloadMessage {
  role: "user" | "assistant";
  content: string;
}

export async function postChatStream(
  messages: ChatPayloadMessage[],
): Promise<Response> {
  return await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
}

export async function fetchAudioManifest<T>(): Promise<T[]> {
  try {
    const resp = await fetch("/audio/manifest.json");
    if (!resp.ok) return [];
    const data = (await resp.json()) as { items?: T[] };
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}
