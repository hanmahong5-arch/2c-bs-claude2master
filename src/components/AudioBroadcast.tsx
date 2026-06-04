"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Volume2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
} from "lucide-react";
import type { ChangelogItem } from "@/lib/content-types";

type Lang = "zh" | "en" | "both";
interface ManifestEntry {
  slug: string;
  zh: boolean;
  en: boolean;
}
interface Clip {
  itemIdx: number;
  lang: "zh" | "en";
  url: string;
}

const LANG_TABS: { value: Lang; label: string }[] = [
  { value: "zh", label: "中文" },
  { value: "en", label: "EN" },
  { value: "both", label: "双语" },
];

// 串行播报: 服务端 edge-tts 预生成的 mp3, 按当前列表顺序逐条播放。
// 音频可用性来自 /audio/manifest.json (tts-generate.ts 产出)。
export default function AudioBroadcast({ items }: { items: ChangelogItem[] }) {
  const [avail, setAvail] = useState<Map<
    string,
    { zh: boolean; en: boolean }
  > | null>(null);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [lang, setLang] = useState<Lang>("zh");
  const [clipIdx, setClipIdx] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/audio/manifest.json")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items?: ManifestEntry[] }) => {
        if (cancelled) return;
        const m = new Map<string, { zh: boolean; en: boolean }>();
        for (const e of d.items ?? []) m.set(e.slug, { zh: e.zh, en: e.en });
        setAvail(m);
      })
      .catch(() => {
        if (!cancelled) setAvail(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 有音频的条目, 保持列表(date-desc)顺序
  const playable = useMemo(
    () => (avail ? items.filter((i) => avail.get(i.slug)) : []),
    [items, avail],
  );

  // 按语种展开成扁平 clip 队列
  const clips = useMemo<Clip[]>(() => {
    if (!avail) return [];
    const out: Clip[] = [];
    playable.forEach((it, itemIdx) => {
      const a = avail.get(it.slug);
      if (!a) return;
      const wantEn = (lang === "en" || lang === "both") && a.en;
      const wantZh = (lang === "zh" || lang === "both") && a.zh;
      if (wantEn)
        out.push({ itemIdx, lang: "en", url: `/audio/${it.slug}.en.mp3` });
      if (wantZh)
        out.push({ itemIdx, lang: "zh", url: `/audio/${it.slug}.zh.mp3` });
    });
    return out;
  }, [playable, avail, lang]);

  const total = playable.length;
  const cur = clips[clipIdx];
  const curItem = cur ? playable[cur.itemIdx] : undefined;

  // clipIdx 变 → 换源; 越界 → 停。
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const clip = clips[clipIdx];
    if (!clip) return; // 越界(到末尾)由 onEnded 置 playing=false, 此处只需不换源
    a.src = clip.url;
    if (playing) a.play().catch(() => setPlaying(false));
    // open 入依赖: 播放条打开时 <audio> 才挂载, 此 effect 需在挂载后(open 变 true)跑一次设源;
    // 否则 start() 把 clipIdx 设为既有的 0 → 引用不变 → effect 不触发 → 永远没 src。
    // playing 故意不入依赖: 播放态切换由下方独立 effect 管, 避免重复 load。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipIdx, clips, open]);

  // 播放/暂停
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [playing]);

  const onEnded = useCallback(() => {
    setClipIdx((i) => (i + 1 < clips.length ? i + 1 : i));
    // 到末尾(i 不变)则停
    setPlaying((p) => (clipIdx + 1 < clips.length ? p : false));
  }, [clips.length, clipIdx]);

  const start = useCallback(() => {
    if (clips.length === 0) return;
    setOpen(true);
    setClipIdx(0);
    setPlaying(true);
  }, [clips.length]);

  const stop = useCallback(() => {
    setPlaying(false);
    setOpen(false);
    setClipIdx(0);
    const a = audioRef.current;
    if (a) a.pause();
  }, []);

  // 跳到上/下一「条目」(跨过 both 模式的双 clip)
  const jump = useCallback(
    (dir: 1 | -1) => {
      if (!clips.length) return;
      const curItemIdx = clips[clipIdx]?.itemIdx ?? 0;
      const targetItem = curItemIdx + dir;
      let ni = clips.findIndex((c) => c.itemIdx === targetItem);
      if (ni < 0) ni = Math.max(0, Math.min(clips.length - 1, clipIdx + dir));
      setClipIdx(ni);
      setPlaying(true);
    },
    [clips, clipIdx],
  );

  // 换语种 → 从当前条目重建播放位置
  function changeLang(next: Lang) {
    setLang(next);
    setClipIdx(0);
  }

  const hasAudio = (avail?.size ?? 0) > 0;

  return (
    <>
      <button
        type="button"
        onClick={open ? stop : start}
        disabled={!hasAudio}
        className={`pill-outline pill inline-flex items-center gap-1.5 transition-colors ${
          hasAudio
            ? "hover:text-[var(--c2m-accent-deep)] cursor-pointer"
            : "opacity-50 cursor-not-allowed"
        }`}
        title={hasAudio ? "串行播报所有新闻" : "音频生成中"}
        aria-label="语音播报所有新闻"
      >
        <Volume2 size={12} />
        🔊 播报
      </button>

      {open && (
        <div
          role="region"
          aria-label="新闻语音播报"
          className="fixed bottom-0 inset-x-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]/95 backdrop-blur-sm shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="shrink-0 size-9 rounded-full bg-[var(--c2m-accent-deep)] text-white inline-flex items-center justify-center hover:opacity-90"
              aria-label={playing ? "暂停" : "播放"}
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              type="button"
              onClick={() => jump(-1)}
              className="shrink-0 text-[var(--color-text-secondary)] hover:text-[var(--c2m-accent-deep)]"
              aria-label="上一条"
            >
              <SkipBack size={16} />
            </button>
            <button
              type="button"
              onClick={() => jump(1)}
              className="shrink-0 text-[var(--color-text-secondary)] hover:text-[var(--c2m-accent-deep)]"
              aria-label="下一条"
            >
              <SkipForward size={16} />
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                <span>
                  播报中 {(cur?.itemIdx ?? 0) + 1}/{total}
                </span>
                {cur && (
                  <span className="pill text-[9px] bg-[var(--c2m-accent-soft)] text-[var(--c2m-accent-deep)]">
                    {cur.lang === "zh" ? "中文" : "EN"}
                  </span>
                )}
              </p>
              <p className="text-sm font-medium text-[var(--lt-ink)] truncate">
                {curItem
                  ? `${curItem.author ?? curItem.source} · ${curItem.title}`
                  : "—"}
              </p>
            </div>

            <div
              className="hidden sm:flex shrink-0 rounded-full border border-[var(--color-border)] overflow-hidden text-[11px]"
              role="group"
              aria-label="播报语言"
            >
              {LANG_TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => changeLang(t.value)}
                  className={`px-2.5 py-1 transition-colors ${
                    lang === t.value
                      ? "bg-[var(--c2m-accent-deep)] text-white"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--c2m-accent-deep)]"
                  }`}
                  aria-pressed={lang === t.value}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={stop}
              className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--lt-err)]"
              aria-label="关闭播报"
            >
              <X size={16} />
            </button>
          </div>
          <audio ref={audioRef} onEnded={onEnded} preload="auto" hidden />
        </div>
      )}
    </>
  );
}
