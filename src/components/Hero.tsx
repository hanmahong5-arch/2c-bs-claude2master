import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import HeroChatDemo from "./HeroChatDemo";
import FeaturedRelease from "./FeaturedRelease";
import { Reveal } from "./Reveal";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh pointer-events-none" aria-hidden />
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" aria-hidden />

      <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        {/* 首屏:eyebrow → 标题 → 副文 → CTA 依次浮现,delay 递增做载入 stagger */}
        <div className="text-center mb-12 md:mb-16">
          <Reveal delay={0}>
            <p className="eyebrow mb-5 inline-flex items-center gap-1.5">
              <Sparkles size={12} />
              让人用好 Claude
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="headline-tight headline-balance text-[clamp(2.75rem,7vw,5rem)] font-semibold text-[var(--lt-ink)] mb-3">
              <span className="font-display italic">Master Claude</span>
            </h1>
            <h1 className="headline-tight headline-balance text-[clamp(2.75rem,7vw,5rem)] font-semibold text-[var(--c2m-accent-deep)] mb-8">
              like a craftsman.
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed mb-3">
              一站式 Prompt 库、流式 Chat、Skills 商店与 Claude Code 教程。
            </p>
            <p className="max-w-2xl mx-auto text-base md:text-lg text-[var(--color-text-muted)] mb-10">
              不翻墙、3 分钟跑通 — 中国大陆 Claude 用户的中文工具站。
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/chat" className="btn btn-cta-glow">
                开始练习
                <ArrowRight size={16} />
              </Link>
              <Link href="/prompts" className="btn btn-secondary">
                浏览 Prompt 库
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.32}>
          <FeaturedRelease />
        </Reveal>

        <HeroChatDemo />
      </div>
    </section>
  );
}
