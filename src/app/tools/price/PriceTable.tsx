"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, Calculator } from "lucide-react";
import type { ModelPrice } from "@/lib/llm-prices";
import { toCny, USD_CNY_RATE } from "@/lib/llm-prices";

type SortKey = "input" | "output" | "vendor";
type Region = "全部" | "国产直连" | "海外";

// 计算器默认量级: 一次中等编码会话的典型用量(百万 token 计)
const DEFAULT_INPUT_M = 1;
const DEFAULT_OUTPUT_M = 0.2;

function fmtMoney(cny: number): string {
  if (cny >= 100) return `¥${cny.toFixed(0)}`;
  if (cny >= 1) return `¥${cny.toFixed(2)}`;
  return `¥${cny.toFixed(3)}`;
}

function fmtRaw(m: ModelPrice, v: number): string {
  return m.currency === "USD" ? `$${v}` : `¥${v}`;
}

export default function PriceTable({ models }: { models: ModelPrice[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("input");
  const [region, setRegion] = useState<Region>("全部");
  const [inputM, setInputM] = useState(DEFAULT_INPUT_M);
  const [outputM, setOutputM] = useState(DEFAULT_OUTPUT_M);

  const rows = useMemo(() => {
    const filtered = models.filter((m) =>
      region === "全部" ? true : region === "国产直连" ? m.cnDirect : !m.cnDirect,
    );
    const cost = (m: ModelPrice) =>
      toCny(m.inputPerM, m.currency) * inputM +
      toCny(m.outputPerM, m.currency) * outputM;
    return filtered
      .map((m) => ({ m, cost: cost(m) }))
      .sort((a, b) => {
        if (sortKey === "vendor") return a.m.vendor.localeCompare(b.m.vendor, "zh");
        const key = sortKey === "input" ? "inputPerM" : "outputPerM";
        return toCny(a.m[key], a.m.currency) - toCny(b.m[key], b.m.currency);
      });
  }, [models, region, sortKey, inputM, outputM]);

  const regions: Region[] = ["全部", "国产直连", "海外"];

  return (
    <div>
      {/* 用量计算器 */}
      <div className="card mb-6">
        <p className="eyebrow mb-3 inline-flex items-center gap-1.5">
          <Calculator size={12} strokeWidth={2} />
          成本速算
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm text-[var(--color-text-secondary)]">
            输入 token(百万)
            <input
              type="number"
              min={0}
              step={0.1}
              value={inputM}
              onChange={(e) => setInputM(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1 block w-32 rounded-md border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-[var(--lt-ink)]"
            />
          </label>
          <label className="text-sm text-[var(--color-text-secondary)]">
            输出 token(百万)
            <input
              type="number"
              min={0}
              step={0.1}
              value={outputM}
              onChange={(e) => setOutputM(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1 block w-32 rounded-md border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-[var(--lt-ink)]"
            />
          </label>
          <p className="text-xs text-[var(--color-text-muted)] pb-2">
            「本次用量成本」列按此用量估算,美元价按 1 USD ≈ ¥{USD_CNY_RATE} 折算
          </p>
        </div>
      </div>

      {/* 筛选 + 排序 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {regions.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setRegion(f)}
            aria-pressed={f === region}
            className={
              f === region
                ? "pill cursor-pointer"
                : "pill-outline pill cursor-pointer hover:border-[var(--c2m-accent)] hover:text-[var(--c2m-accent-deep)] transition-colors"
            }
          >
            {f}
          </button>
        ))}
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
          <ArrowDownUp size={12} />
          排序:
          {(
            [
              ["input", "输入价"],
              ["output", "输出价"],
              ["vendor", "厂商"],
            ] as [SortKey, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSortKey(k)}
              aria-pressed={sortKey === k}
              className={
                sortKey === k
                  ? "text-[var(--c2m-accent-deep)] font-semibold cursor-pointer"
                  : "hover:text-[var(--c2m-accent-deep)] cursor-pointer"
              }
            >
              {label}
            </button>
          ))}
        </span>
      </div>

      {/* 价格表 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
              <th className="py-2 pr-3 font-medium">模型</th>
              <th className="py-2 pr-3 font-medium">厂商</th>
              <th className="py-2 pr-3 font-medium">档位</th>
              <th className="py-2 pr-3 font-medium">输入 /1M</th>
              <th className="py-2 pr-3 font-medium">输出 /1M</th>
              <th className="py-2 pr-3 font-medium">上下文</th>
              <th className="py-2 pr-3 font-medium">大陆直连</th>
              <th className="py-2 font-medium">本次用量成本</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ m, cost }) => (
              <tr
                key={m.id}
                className="border-b border-[var(--color-border)] hover:bg-[var(--c2m-accent-soft)]/30 transition-colors"
              >
                <td className="py-2.5 pr-3">
                  <a
                    href={m.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[var(--lt-ink)] hover:text-[var(--c2m-accent-deep)]"
                    title={m.note || "官方定价页"}
                  >
                    {m.name}
                  </a>
                </td>
                <td className="py-2.5 pr-3 text-[var(--color-text-secondary)]">{m.vendor}</td>
                <td className="py-2.5 pr-3">
                  <span className="pill-outline pill text-[10px]">{m.tier}</span>
                </td>
                <td className="py-2.5 pr-3 tabular-nums">{fmtRaw(m, m.inputPerM)}</td>
                <td className="py-2.5 pr-3 tabular-nums">{fmtRaw(m, m.outputPerM)}</td>
                <td className="py-2.5 pr-3 text-[var(--color-text-secondary)]">{m.context}</td>
                <td className="py-2.5 pr-3">{m.cnDirect ? "✅" : "需代理"}</td>
                <td className="py-2.5 tabular-nums font-medium text-[var(--lt-ink)]">
                  {fmtMoney(cost)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-[var(--color-text-muted)]">
        点击模型名可跳转官方定价页;缓存/批量等特殊计价见悬停备注。人民币折算仅供直观对比。
      </p>
    </div>
  );
}
