#!/usr/bin/env bun
/**
 * backfill-graph.ts — 给存量 changelog 条目补知识图谱 (src/content/graph/<slug>.json)
 *
 * 用法:
 *   bun run scripts/radar/backfill-graph.ts                 # 全部缺图谱的条目 (新→旧)
 *   bun run scripts/radar/backfill-graph.ts --limit 50      # 只补最新 50 条
 *   bun run scripts/radar/backfill-graph.ts --since 2026-07-01
 *   bun run scripts/radar/backfill-graph.ts --no-fetch      # 不重抓原文, 只用 MDX 摘要
 *
 * 正文来源: blogger / practice 重抓原文 (信息密度高, 图谱更实), 抓不到退回 MDX 摘要;
 * release 用 MDX 摘要 (release notes 已被逐条摘要过)。trending 跳过 (与 summarize.ts 一致)。
 * 幂等: 已有图谱文件的条目跳过; 失败条目只记日志, 重跑即补。
 *
 * env: NEWAPI_TRIAL_TOKEN (同 summarize.ts); RADAR_CONCURRENCY (默认 6)
 */

import { promises as fs } from "fs";
import path from "path";
import { extractMainText } from "./html-extract";
import { callGraph, writeGraph } from "./summarize";

const ROOT = path.resolve(import.meta.dir, "..", "..");
const CHANGELOG_DIR = path.join(ROOT, "src", "content", "changelog");
const GRAPH_DIR = path.join(ROOT, "src", "content", "graph");

function fm(raw: string): { data: Record<string, string>; body: string } {
  const end = raw.indexOf("\n---", 3);
  if (!raw.startsWith("---") || end === -1) return { data: {}, body: raw };
  const data: Record<string, string> = {};
  for (const line of raw.slice(3, end).split(/\r?\n/)) {
    const m = line.match(/^([a-zA-Z]\w*):\s*(.*)$/);
    if (m) data[m[1]] = m[2].trim().replace(/^"(.*)"$/, "$1").replace(/\\"/g, '"');
  }
  return { data, body: raw.slice(end + 4) };
}

async function fetchSourceText(url: string): Promise<string> {
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "claude2master-radar/1.0 (+https://claude2master.com; bot)" },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
    if (!resp.ok) return "";
    const ct = resp.headers.get("content-type") ?? "";
    if (!ct.includes("html")) return "";
    return extractMainText(await resp.text()).slice(0, 8000);
  } catch {
    return "";
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const arg = (k: string) => {
    const i = argv.indexOf(k);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const limit = Number(arg("--limit")) || Infinity;
  const since = arg("--since") ?? "";
  const noFetch = argv.includes("--no-fetch");
  const concurrency = Math.max(1, Number(process.env.RADAR_CONCURRENCY) || 6);

  const have = new Set(
    (await fs.readdir(GRAPH_DIR).catch(() => [] as string[])).map((f) => f.replace(/\.json$/, "")),
  );
  const files = (await fs.readdir(CHANGELOG_DIR)).filter((f) => f.endsWith(".mdx")).sort().reverse();

  const todo: { slug: string; kind: string; title: string; url: string; summary: string }[] = [];
  for (const f of files) {
    const slug = f.replace(/\.mdx$/, "");
    if (have.has(slug)) continue;
    const { data, body } = fm(await fs.readFile(path.join(CHANGELOG_DIR, f), "utf-8"));
    if (data.kind === "trending") continue;
    if (since && (data.publishedAt ?? "") < since) continue;
    todo.push({
      slug,
      kind: data.kind ?? "changelog",
      title: data.title ?? slug,
      url: data.sourceUrl ?? "",
      summary: `${data.hook ?? ""}\n\n${body.split("\n---\n")[0]}`,
    });
    if (todo.length >= limit) break;
  }
  console.error(`[backfill-graph] ${todo.length} item(s) to process, concurrency ${concurrency}`);

  let ok = 0;
  let fail = 0;
  let fetched = 0;
  let cursor = 0;
  // 熔断: 额度/鉴权类错误 (402 池耗尽 / 401 / 403) 重试无意义且持续打网关 → 全体停。
  // 2026-09-23 教训: 共享 default 租户池被批量回填打空后, 脚本仍以 8 并发刷了 800+ 条 402。
  let halted = "";
  const worker = async () => {
    while (cursor < todo.length && !halted) {
      const it = todo[cursor++];
      try {
        let text = "";
        if (!noFetch && (it.kind === "blogger" || it.kind === "practice") && it.url) {
          text = await fetchSourceText(it.url);
          if (text.length > 600) fetched++;
          else text = "";
        }
        const g = await callGraph(it.title, text || it.summary);
        await writeGraph(it.slug, g);
        ok++;
        if (ok % 25 === 0) console.error(`[backfill-graph] ${ok}/${todo.length} ok (${fetched} with source text)`);
      } catch (e) {
        fail++;
        const status = (e as { status?: number }).status;
        console.error(`[backfill-graph] FAIL ${it.slug}: ${(e as Error).message.slice(0, 160)}`);
        if (status === 402 || status === 401 || status === 403) {
          halted = `HTTP ${status}`;
        }
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, todo.length) }, worker));
  console.error(
    `[backfill-graph] done: ${ok} ok, ${fail} failed, ${fetched} used re-fetched source text` +
      (halted ? ` — HALTED on ${halted} (quota/auth); fix upstream then rerun (idempotent)` : ""),
  );
  if (halted || (fail > 0 && ok === 0)) process.exit(1);
}

await main();
