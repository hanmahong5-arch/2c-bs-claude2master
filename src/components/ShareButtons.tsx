"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { track } from "@vercel/analytics";

type ShareChannel = "copy" | "x" | "weibo";

export default function ShareButtons({
  url,
  title,
  slug,
  channel,
}: {
  url: string;
  title: string;
  slug: string;
  channel: "changelog" | "digest" | "harness";
}) {
  const [copied, setCopied] = useState(false);

  function trackShare(target: ShareChannel) {
    try {
      track("share_clicked", { channel, slug, target });
    } catch {
      // analytics 不阻塞导航
    }
  }

  async function onCopy() {
    trackShare("copy");
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title,
  )}&url=${encodeURIComponent(`${url}?utm_source=share-x`)}`;

  const weiboHref = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(
    `${url}?utm_source=share-weibo`,
  )}&title=${encodeURIComponent(title)}`;

  return (
    <div className="flex items-center gap-2 flex-wrap mt-10 pt-6 border-t border-[var(--color-border)]">
      <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mr-1">
        <Share2 size={12} aria-hidden="true" />
        分享：
      </span>
      <button
        onClick={onCopy}
        className="btn btn-secondary text-xs"
        type="button"
        aria-label={copied ? "已复制链接" : "复制链接"}
      >
        {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
        {copied ? "已复制" : "复制链接"}
      </button>
      <a
        href={xHref}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-secondary text-xs"
        onClick={() => trackShare("x")}
      >
        X (Twitter)
      </a>
      <a
        href={weiboHref}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-secondary text-xs"
        onClick={() => trackShare("weibo")}
      >
        微博
      </a>
    </div>
  );
}
