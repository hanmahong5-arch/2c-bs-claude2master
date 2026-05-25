"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyPromptButton({ text }: { text: string }) {
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

  return (
    <button
      onClick={onCopy}
      className="btn btn-primary"
      type="button"
      aria-label={copied ? "已复制" : "复制 prompt"}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "已复制" : "复制 prompt"}
    </button>
  );
}
