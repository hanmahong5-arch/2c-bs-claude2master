"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDown, ChevronUp, Clock, Calendar } from "lucide-react";

type Preview = {
  slug: string;
  title: string;
  hook: string;
  body: string;
  weekOf: string;
  publishedAt: string;
  readingMinutes?: number;
} | null;

export default function DigestPreview({ preview }: { preview: Preview }) {
  const [expanded, setExpanded] = useState(false);

  if (!preview) {
    return (
      <div className="mb-10 px-5 py-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
          上一期样本
        </p>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          首期 Weekly Digest 还在准备中 — 每周一早上自动生成并发出。
          先订阅，第一期上线时第一个收到。
        </p>
      </div>
    );
  }

  const collapsed = preview.body.length > 400 && !expanded;
  const preview400 = preview.body.slice(0, 400);

  return (
    <div className="mb-10 px-5 py-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          上一期样本
        </p>
        <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={11} />
            {preview.publishedAt}
          </span>
          {preview.readingMinutes && (
            <span className="inline-flex items-center gap-1.5">
              <Clock size={11} />
              {preview.readingMinutes} 分钟
            </span>
          )}
        </div>
      </div>

      <h3 className="font-display italic text-xl font-semibold mb-1 text-[var(--lt-ink)]">
        {preview.title}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
        {preview.hook}
      </p>

      <div className="tutorial-md text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {collapsed ? `${preview400}…` : preview.body}
        </ReactMarkdown>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 justify-between">
        {preview.body.length > 400 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 text-xs text-[var(--c2m-accent-deep)] hover:underline"
          >
            {expanded ? (
              <>
                <ChevronUp size={12} />
                收起
              </>
            ) : (
              <>
                <ChevronDown size={12} />
                展开全文
              </>
            )}
          </button>
        )}
        <Link
          href={`/weekly/${preview.slug}`}
          className="ml-auto text-xs text-[var(--c2m-accent-deep)] hover:underline"
        >
          网页完整版 →
        </Link>
      </div>
    </div>
  );
}
