"use client";

import { useState } from "react";
import { Copy, Check, AlertTriangle } from "lucide-react";

export default function CopyPromptButton({
  text,
  label = "复制",
  variant = "primary",
}: {
  text: string;
  label?: string;
  variant?: "primary" | "secondary";
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      setFailed(true);
      setTimeout(() => setFailed(false), 2400);
    }
  }

  const cls =
    variant === "secondary" ? "btn btn-secondary text-sm" : "btn btn-primary";

  return (
    <button
      onClick={onCopy}
      className={cls}
      type="button"
      aria-label={copied ? "已复制" : failed ? "复制失败，请手动选择文本" : label}
    >
      {copied ? (
        <Check size={14} />
      ) : failed ? (
        <AlertTriangle size={14} />
      ) : (
        <Copy size={14} />
      )}
      {copied ? "已复制" : failed ? "复制失败，请手动选择文本" : label}
    </button>
  );
}
