"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// 中英对照示例(约同等语义), 直观展示中文 token 消耗更高
const SAMPLE_ZH =
  "请帮我审查这段代码的性能问题,找出不必要的重复渲染,并给出修复建议。";
const SAMPLE_EN =
  "Please review this code for performance issues, find unnecessary re-renders, and suggest fixes.";

type EncodeFn = (text: string) => number[];

export default function TokenCounter() {
  const [text, setText] = useState("");
  const [tokens, setTokens] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const encodeRef = useRef<EncodeFn | null>(null);

  // tokenizer 词表体积大 → 懒加载, 首次输入才拉
  async function ensureEncoder(): Promise<EncodeFn> {
    if (encodeRef.current) return encodeRef.current;
    setLoading(true);
    const mod = await import("gpt-tokenizer");
    encodeRef.current = mod.encode;
    setLoading(false);
    return mod.encode;
  }

  useEffect(() => {
    let cancelled = false;
    if (!text) return; // 空文本在渲染期派生为 "—", 不在 effect 里写状态
    ensureEncoder().then((encode) => {
      if (!cancelled) setTokens(encode(text).length);
    });
    return () => {
      cancelled = true;
    };
  }, [text]);

  const chars = text.length;
  const shownTokens = text ? tokens : null;
  const ratio = shownTokens && chars ? (shownTokens / chars).toFixed(2) : null;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={() => setText(SAMPLE_ZH)}
          className="pill-outline pill cursor-pointer hover:border-[var(--c2m-accent)] hover:text-[var(--c2m-accent-deep)] transition-colors"
        >
          中文示例
        </button>
        <button
          type="button"
          onClick={() => setText(SAMPLE_EN)}
          className="pill-outline pill cursor-pointer hover:border-[var(--c2m-accent)] hover:text-[var(--c2m-accent-deep)] transition-colors"
        >
          同义英文示例
        </button>
        {text && (
          <button
            type="button"
            onClick={() => setText("")}
            className="pill-outline pill cursor-pointer text-[var(--color-text-muted)]"
          >
            清空
          </button>
        )}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="粘贴你的 prompt / 文档 / 代码,立刻看 token 数(纯本地计算,内容不上传)…"
        rows={8}
        className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-4 py-3 text-sm text-[var(--lt-ink)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--c2m-accent)] focus:outline-none"
      />

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-semibold tabular-nums text-[var(--lt-ink)]">
            {loading ? "…" : (shownTokens ?? "—")}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">token 数</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-semibold tabular-nums text-[var(--lt-ink)]">
            {chars || "—"}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">字符数</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-semibold tabular-nums text-[var(--lt-ink)]">
            {ratio ?? "—"}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">token / 字符</p>
        </div>
      </div>

      <div className="mt-6 text-sm text-[var(--color-text-secondary)] leading-relaxed">
        <p>
          同一句话,中文通常要消耗英文 1.5-2 倍的 token(一个汉字常被拆成 1-2 个
          token,而一个英文单词往往就是 1 个)——用上面两个示例按钮直观感受。
          计数基于主流通用分词词表,不同模型会略有差异,作预算估计足够。
        </p>
        <p className="mt-3">
          <Link
            href="/tools/price"
            className="text-[var(--c2m-accent-deep)] hover:underline inline-flex items-center gap-1"
          >
            拿着 token 数去价格表算成本
            <ArrowRight size={13} />
          </Link>
        </p>
      </div>
    </div>
  );
}
