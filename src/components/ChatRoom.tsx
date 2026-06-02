"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Send, AlertCircle, Sparkles, ExternalLink } from "lucide-react";
import { MODEL_LABEL, getPrompt, type ModelKey } from "@/lib/prompts";
import TrackedLink from "@/components/TrackedLink";
import { buildOutbound, OUTBOUND_CAMPAIGN } from "@/lib/outbound";

// 漏斗最高意向出站 URL:chat 额度耗尽 → newapi 注册。带 chat-exhausted 归因。
const NEWAPI_CHAT_EXHAUSTED = buildOutbound(
  "newapi",
  OUTBOUND_CAMPAIGN.chatExhausted,
);

type Msg = { role: "user" | "assistant"; content: string };

const MODELS: { key: ModelKey; label: string; tag: string }[] = [
  { key: "haiku", label: MODEL_LABEL.haiku, tag: "简短问答" },
  { key: "sonnet", label: MODEL_LABEL.sonnet, tag: "日常默认" },
  { key: "opus", label: MODEL_LABEL.opus, tag: "长篇思考" },
];

const TRIAL_LIMIT = 3;

export default function ChatRoom() {
  const sp = useSearchParams();
  const initialSlug = sp.get("prompt");
  const initialPrompt = initialSlug ? getPrompt(initialSlug) : undefined;

  const [model, setModel] = useState<ModelKey>(
    initialPrompt?.modelKey ?? "sonnet",
  );
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState<string>(initialPrompt?.body ?? "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [exhausted, setExhausted] = useState(false);
  const [trialUsed, setTrialUsed] = useState<number>(0);
  const listRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [msgs]);

  async function send() {
    const text = input.trim();
    if (!text || loading || exhausted) return;
    setErr(null);

    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setLoading(true);

    let assistant = "";
    setMsgs((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const used = Number(res.headers.get("X-Trial-Used") ?? "0");
      if (used > 0) setTrialUsed(used);

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
          trial_used?: number;
          trial_limit?: number;
        };
        if (data.error === "trial_exhausted") {
          setExhausted(true);
          setTrialUsed(data.trial_used ?? TRIAL_LIMIT);
        }
        const msg = data.message ?? `请求失败 (${res.status})`;
        setErr(msg);
        setMsgs((prev) => prev.slice(0, -1));
        return;
      }

      if (!res.body) {
        setErr("响应没有 body");
        setMsgs((prev) => prev.slice(0, -1));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const chunk = JSON.parse(data) as {
              choices?: { delta?: { content?: string } }[];
            };
            const piece = chunk.choices?.[0]?.delta?.content;
            if (piece) {
              assistant += piece;
              setMsgs((prev) => {
                const copy = prev.slice();
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: assistant,
                };
                return copy;
              });
            }
          } catch {
            // ignore malformed
          }
        }
      }

      if (used >= TRIAL_LIMIT) setExhausted(true);
    } catch (e) {
      setErr((e as Error).message);
      setMsgs((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void send();
    }
  }

  const remaining = Math.max(0, TRIAL_LIMIT - trialUsed);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 md:py-14">
      <header className="mb-6">
        <p className="eyebrow mb-3">在线 Chat</p>
        <h1 className="font-display italic text-3xl md:text-4xl font-semibold mb-3 headline-tight">
          和 Claude 直接聊。
        </h1>
        <p className="text-sm md:text-base text-[var(--color-text-secondary)]">
          免登录 {TRIAL_LIMIT} 次试用。额度用完
          <TrackedLink
            href={NEWAPI_CHAT_EXHAUSTED}
            external
            event="cta_register_newapi"
            data={{ from: "chat-header" }}
            className="text-[var(--c2m-accent-deep)] hover:underline mx-1"
          >
            去 newapi 注册
          </TrackedLink>
          解锁。
        </p>
      </header>

      <div className="mb-5 px-4 py-3 rounded-lg border border-[var(--lt-warn)] bg-[rgba(184,130,31,0.06)] flex items-start gap-2 text-sm text-[var(--lt-warn)]">
        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-[var(--color-text-secondary)]">
          <span className="font-semibold text-[var(--lt-warn)]">
            Anthropic Claude channel 接入中
          </span>
          {" — "}
          newapi.lurus.cn 暂未接 Anthropic 上游，3 档临时全映射 DeepSeek V3.2。Claude 接通后立即切换。
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-[var(--color-border)]">
        {MODELS.map((m) => (
          <button
            key={m.key}
            onClick={() => setModel(m.key)}
            className={
              m.key === model
                ? "pill"
                : "pill pill-outline hover:border-[var(--c2m-accent)]"
            }
            type="button"
          >
            {m.label}
            <span className="ml-1.5 text-[10px] opacity-70">{m.tag}</span>
          </button>
        ))}
        <span className="ml-auto text-xs text-[var(--color-text-muted)]">
          剩余 {remaining} / {TRIAL_LIMIT} 次
        </span>
      </div>

      <div
        ref={listRef}
        className="min-h-[280px] max-h-[55vh] overflow-y-auto mb-5 space-y-5"
        role="log"
        aria-live="polite"
        aria-label="对话记录"
      >
        {msgs.length === 0 && (
          <div className="card flex items-start gap-3">
            <Sparkles
              size={20}
              className="text-[var(--c2m-accent)] flex-shrink-0 mt-0.5"
              strokeWidth={1.5}
            />
            <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              <p className="font-medium text-[var(--lt-ink)] mb-1">
                第一次来？试试这些：
              </p>
              <ul className="space-y-1">
                <li>
                  · 从{" "}
                  <Link
                    href="/prompts"
                    className="text-[var(--c2m-accent-deep)] hover:underline"
                  >
                    Prompt 库
                  </Link>{" "}
                  挑一条，点「在 Chat 里跑」自动填入
                </li>
                <li>· 直接问：「写一段 useEffect cleanup 的常见错误」</li>
                <li>
                  · 模型默认 Sonnet，重活点上面 Opus，问翻译切 Haiku
                </li>
              </ul>
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`${
              m.role === "user" ? "chat-user" : "chat-assistant"
            } whitespace-pre-wrap`}
          >
            {m.content || (
              <span className="cursor-blink" aria-label="正在生成">
                ▎
              </span>
            )}
          </div>
        ))}
      </div>

      {err && (
        <div className="mb-3 px-4 py-3 rounded-lg border border-[var(--lt-err)] bg-[rgba(179,57,43,0.06)] flex items-start gap-2 text-sm text-[var(--lt-err)]">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            {err}
            {exhausted && (
              <TrackedLink
                href={NEWAPI_CHAT_EXHAUSTED}
                external
                event="cta_register_newapi"
                data={{ from: "chat-exhausted" }}
                className="inline-flex items-center gap-1 ml-2 underline"
              >
                去注册
                <ExternalLink size={12} />
              </TrackedLink>
            )}
          </div>
        </div>
      )}

      <div className="relative">
        <textarea
          ref={taRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          rows={3}
          disabled={loading || exhausted}
          placeholder={
            exhausted
              ? "免费额度已用完，去 newapi.lurus.cn 注册解锁"
              : "Cmd/Ctrl + Enter 发送 · 4000 字以内"
          }
          className="w-full px-4 py-3 pr-14 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] focus:outline-none focus:border-[var(--c2m-accent)] focus:ring-2 focus:ring-[var(--c2m-accent-glow)] text-sm leading-relaxed resize-none disabled:opacity-50"
        />
        <button
          onClick={() => void send()}
          disabled={loading || exhausted || !input.trim()}
          className="absolute right-2 bottom-2 p-2.5 rounded-lg bg-[var(--c2m-accent)] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--c2m-accent-deep)] transition-colors"
          aria-label="发送"
          type="button"
        >
          <Send size={16} />
        </button>
      </div>

      <p className="mt-3 text-xs text-[var(--color-text-muted)]">
        对话不会被存储到服务器（本浏览器内的临时状态）。后端走 newapi.lurus.cn，
        非 Anthropic 官方 API。
      </p>
    </div>
  );
}
