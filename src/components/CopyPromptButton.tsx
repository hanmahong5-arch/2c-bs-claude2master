"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

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

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const cls =
    variant === "secondary" ? "btn btn-secondary text-sm" : "btn btn-primary";

  return (
    <button
      onClick={onCopy}
      className={cls}
      type="button"
      aria-label={copied ? "已复制" : label}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "已复制" : label}
    </button>
  );
}
