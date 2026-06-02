"use client";

import { useState } from "react";
import { Check, Loader2, Mail, AlertCircle } from "lucide-react";
import { track } from "@vercel/analytics";

type State = "idle" | "loading" | "subscribed" | "already" | "error";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading" || state === "subscribed") return;

    setState("loading");
    setError("");
    try {
      track("subscribe_attempted");
    } catch {
      // analytics 不阻塞
    }

    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const j = (await r.json()) as {
        status?: "subscribed" | "already_subscribed";
        error?: string;
        message?: string;
      };

      if (j.status === "subscribed") {
        try {
          track("subscribe_succeeded");
        } catch {}
        setState("subscribed");
        setEmail("");
      } else if (j.status === "already_subscribed") {
        setState("already");
      } else {
        setError(j.message ?? j.error ?? "未知错误");
        setState("error");
      }
    } catch (e) {
      setError((e as Error).message);
      setState("error");
    }
  }

  const disabled = state === "loading" || state === "subscribed";

  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <label htmlFor="subscribe-email" className="sr-only">
            邮箱
          </label>
          <Mail
            size={16}
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            id="subscribe-email"
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state === "error" || state === "already") setState("idle");
            }}
            disabled={disabled}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--lt-paper)] text-[var(--lt-ink)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--c2m-accent)] focus:ring-2 focus:ring-[var(--c2m-accent-glow)] disabled:opacity-60"
            aria-label="邮箱"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || email.trim().length === 0}
          aria-busy={state === "loading"}
          className="btn btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === "loading" ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              提交中
            </>
          ) : state === "subscribed" ? (
            <>
              <Check size={14} />
              已订阅
            </>
          ) : (
            "订阅"
          )}
        </button>
      </form>

      {state === "subscribed" && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 px-4 py-3 rounded-md border border-[var(--lt-ok)] bg-[var(--color-surface-elevated)] text-sm text-[var(--lt-ok)] flex items-start gap-2"
        >
          <Check size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <strong>订阅成功。</strong>请到邮箱查收 Buttondown
            的确认邮件，点击确认链接即可正式加入列表。
          </div>
        </div>
      )}

      {state === "already" && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 px-4 py-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-sm text-[var(--color-text-secondary)]"
        >
          这个邮箱已经在订阅列表里了。如果你没收到周报，先检查垃圾箱；仍未收到欢迎在 GitHub 提 issue。
        </div>
      )}

      {state === "error" && (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-4 px-4 py-3 rounded-md border border-[var(--lt-err)] bg-[var(--color-surface-elevated)] text-sm text-[var(--lt-err)] flex items-start gap-2"
        >
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <strong>提交失败：</strong>
            {error || "请稍后再试。"}
          </div>
        </div>
      )}
    </div>
  );
}
