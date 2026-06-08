"use client";

// BroadcastProvider — 全局持久语音播报器的状态机核心。
//
// 物理基础: Next App Router 客户端导航时根 layout 不卸载(只换 children)。
// 把唯一 <audio> + 播放状态提到挂在 layout 的本 Provider, <audio> 常驻 DOM →
// 切页不停播。三处入口(Header 按钮 / changelog pill / 播放条控件)共用同一 context。
//
// <audio> 永远挂载(初始无 src) → 消灭旧 AudioBroadcast "open 进 effect 依赖" 的设源 bug:
// 旧版播放条关闭时 <audio> 不在 DOM, 开启后才挂载, 需 hack 让设源 effect 在 open 变 true 时跑。
// 现在常驻挂载, 单 effect 按 [clipIdx, queue, playing] 自然推进, 无需观察 open。

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangelogKind } from "@/lib/content-types";
import { TOOLS } from "@/lib/tools";
import { BroadcastContext } from "./useBroadcast";
import { BroadcastBar } from "./BroadcastBar";
import type {
  BroadcastContextValue,
  BroadcastFilters,
  Clip,
  EnrichedManifestEntry,
  Lang,
  Span,
} from "./types";

const DAY_MS = 86_400_000;
const KIND_ORDER: ChangelogKind[] = [
  "changelog",
  "trending",
  "blogger",
  "practice",
];

// span 过滤: 缺/坏日期一律保留(向后兼容旧 manifest); 未来日期视作今天。
function withinSpan(
  publishedAt: string | undefined,
  span: Span,
  now: number,
): boolean {
  if (span === "all") return true;
  if (!publishedAt) return true;
  const t = new Date(publishedAt).getTime();
  if (Number.isNaN(t)) return true;
  const diffDays = Math.floor((now - t) / DAY_MS);
  if (diffDays < 0) return true;
  if (span === "today") return diffDays <= 0;
  if (span === "3d") return diffDays <= 3;
  return diffDays <= 7; // "7d"
}

export function BroadcastProvider({ children }: { children: React.ReactNode }) {
  const [avail, setAvail] = useState<EnrichedManifestEntry[] | null>(null);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [lang, setLangState] = useState<Lang>("zh");
  const [clipIdx, setClipIdx] = useState(0);
  const [filters, setFiltersState] = useState<BroadcastFilters>({
    tools: [],
    kind: "all",
    span: "all",
  });
  // span 过滤的参考时刻。只在用户事件(setFilters)里取 Date.now() → 不在 render 调
  // 不纯函数(react-hooks/purity)。初值 0: 默认 span="all" 不读它; 选具体跨度时刷新。
  const [now, setNow] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedUrlRef = useRef<string>("");

  // ── manifest 拉取 (一次) ──
  useEffect(() => {
    let cancelled = false;
    fetch("/audio/manifest.json")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items?: EnrichedManifestEntry[] }) => {
        if (cancelled) return;
        setAvail(Array.isArray(d.items) ? d.items : []);
      })
      .catch(() => {
        if (!cancelled) setAvail([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── 队列构建 (全派生, 不在 effect 内 setState) ──
  // avail → span 过滤 → kind 过滤 → tools 过滤 → 仍 date-desc 的 playable。
  const playable = useMemo<EnrichedManifestEntry[]>(() => {
    if (!avail) return [];
    return avail.filter((e) => {
      if (!(e.zh || e.en)) return false;
      const kind = e.kind ?? "changelog";
      if (filters.kind !== "all" && kind !== filters.kind) return false;
      if (filters.tools.length > 0 && (!e.tool || !filters.tools.includes(e.tool)))
        return false;
      if (!withinSpan(e.publishedAt, filters.span, now)) return false;
      return true;
    });
  }, [avail, filters, now]);

  // playable → 按 zh/en/both 展开成扁平 clip 队列 (both: 先英文标题后中文 hook)。
  const queue = useMemo<Clip[]>(() => {
    const out: Clip[] = [];
    playable.forEach((e, entryIdx) => {
      const title = e.title ?? e.slug;
      const wantEn = (lang === "en" || lang === "both") && e.en;
      const wantZh = (lang === "zh" || lang === "both") && e.zh;
      if (wantEn)
        out.push({
          entryIdx,
          lang: "en",
          url: `/audio/${e.slug}.en.mp3`,
          title,
          author: e.author,
          source: e.source,
        });
      if (wantZh)
        out.push({
          entryIdx,
          lang: "zh",
          url: `/audio/${e.slug}.zh.mp3`,
          title,
          author: e.author,
          source: e.source,
        });
    });
    return out;
  }, [playable, lang]);

  // manifest 真实出现的工具/归类 → chips (避免空 chip)。
  const toolOptions = useMemo(() => {
    if (!avail) return [];
    const present = new Set<string>();
    for (const e of avail) if (e.tool) present.add(e.tool);
    return TOOLS.filter((t) => present.has(t.key)).map((t) => ({
      key: t.key,
      name: t.name,
    }));
  }, [avail]);

  const kindOptions = useMemo<ChangelogKind[]>(() => {
    if (!avail) return [];
    const present = new Set<ChangelogKind>();
    for (const e of avail) present.add(e.kind ?? "changelog");
    return KIND_ORDER.filter((k) => present.has(k));
  }, [avail]);

  // ── 单 effect: 设源 + 播放/暂停 (clipIdx/queue/playing 任一变都重算) ──
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const clip = queue[clipIdx];
    if (!clip) {
      a.pause();
      return;
    }
    if (loadedUrlRef.current !== clip.url) {
      loadedUrlRef.current = clip.url;
      a.src = clip.url;
    }
    if (playing) a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [clipIdx, queue, playing]);

  const onEnded = useCallback(() => {
    setClipIdx((i) => (i + 1 < queue.length ? i + 1 : i));
    setPlaying((p) => (clipIdx + 1 < queue.length ? p : false));
  }, [queue.length, clipIdx]);

  // ── 方法 ──
  const stop = useCallback(() => {
    setPlaying(false);
    setOpen(false);
    setClipIdx(0);
  }, []);

  // 关→开(从头播, 有队列才自动播) / 开→停。playing false→true 入口都源于用户点击(手势成立)。
  const toggle = useCallback(() => {
    if (open) {
      setPlaying(false);
      setOpen(false);
      setClipIdx(0);
    } else {
      setClipIdx(0);
      setPlaying(queue.length > 0);
      setOpen(true);
    }
  }, [open, queue.length]);

  const togglePlay = useCallback(() => {
    setPlaying((p) => (p ? false : queue.length > 0));
  }, [queue.length]);

  // 跳到上/下一「条目」(跨过 both 模式的双 clip)
  const jump = useCallback(
    (dir: 1 | -1) => {
      if (!queue.length) return;
      const curItemIdx = queue[clipIdx]?.entryIdx ?? 0;
      const targetItem = curItemIdx + dir;
      let ni = queue.findIndex((c) => c.entryIdx === targetItem);
      if (ni < 0) ni = Math.max(0, Math.min(queue.length - 1, clipIdx + dir));
      setClipIdx(ni);
      setPlaying(true);
    },
    [queue, clipIdx],
  );

  const next = useCallback(() => jump(1), [jump]);
  const prev = useCallback(() => jump(-1), [jump]);

  // 换语种/筛选 → 同步重置 clipIdx (用户操作栈内合法, 不在 effect 观察派生值 → 不触 lint)。
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setClipIdx(0);
  }, []);

  const setFilters = useCallback((patch: Partial<BroadcastFilters>) => {
    // 用户事件里取时刻(非 render) → span 过滤用新鲜 now, 满足 react-hooks/purity。
    if (patch.span && patch.span !== "all") setNow(Date.now());
    setFiltersState((f) => ({ ...f, ...patch }));
    setClipIdx(0);
  }, []);

  const value: BroadcastContextValue = {
    avail,
    queue,
    clipIdx,
    playing,
    open,
    lang,
    filters,
    toolOptions,
    kindOptions,
    current: queue[clipIdx],
    total: playable.length,
    hasQueue: queue.length > 0,
    hasAudio: (avail?.length ?? 0) > 0,
    toggle,
    stop,
    togglePlay,
    next,
    prev,
    jump,
    setLang,
    setFilters,
  };

  return (
    <BroadcastContext.Provider value={value}>
      {children}
      <BroadcastBar />
      <audio ref={audioRef} onEnded={onEnded} preload="auto" hidden />
    </BroadcastContext.Provider>
  );
}
