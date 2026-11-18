"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { fetchAudioManifest } from "@/infra/client-api";
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
  return diffDays <= 7;
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
  const [now, setNow] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedUrlRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;
    fetchAudioManifest<EnrichedManifestEntry>().then((items) => {
      if (!cancelled) setAvail(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const playable = useMemo<EnrichedManifestEntry[]>(() => {
    if (!avail) return [];
    return avail.filter((e) => {
      if (!(e.zh || e.en)) return false;
      const kind = e.kind ?? "changelog";
      if (filters.kind !== "all" && kind !== filters.kind) return false;
      if (
        filters.tools.length > 0 &&
        (!e.tool || !filters.tools.includes(e.tool))
      ) {
        return false;
      }
      if (!withinSpan(e.publishedAt, filters.span, now)) return false;
      return true;
    });
  }, [avail, filters, now]);

  const queue = useMemo<Clip[]>(() => {
    const out: Clip[] = [];
    playable.forEach((e, entryIdx) => {
      const title = e.title ?? e.slug;
      const wantEn = (lang === "en" || lang === "both") && e.en;
      const wantZh = (lang === "zh" || lang === "both") && e.zh;
      if (wantEn) {
        out.push({
          entryIdx,
          lang: "en",
          url: `/audio/${e.slug}.en.mp3`,
          title,
          author: e.author,
          source: e.source,
        });
      }
      if (wantZh) {
        out.push({
          entryIdx,
          lang: "zh",
          url: `/audio/${e.slug}.zh.mp3`,
          title,
          author: e.author,
          source: e.source,
        });
      }
    });
    return out;
  }, [playable, lang]);

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

  const stop = useCallback(() => {
    setPlaying(false);
    setOpen(false);
    setClipIdx(0);
  }, []);

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

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setClipIdx(0);
  }, []);

  const setFilters = useCallback((patch: Partial<BroadcastFilters>) => {
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
