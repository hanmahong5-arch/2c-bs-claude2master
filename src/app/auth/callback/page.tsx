import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "登录中…",
  robots: { index: false, follow: false },
};

export default function AuthCallbackPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <span
        className="inline-block w-3 h-3 rounded-full bg-[var(--c2m-accent)] animate-pulse mb-4"
        aria-hidden
      />
      <p className="text-[var(--color-text-secondary)]">处理登录回调…</p>
      <p className="text-xs text-[var(--color-text-muted)] mt-2">
        账号体系升级中，此页用于处理登录后的跳转。
      </p>
    </div>
  );
}
