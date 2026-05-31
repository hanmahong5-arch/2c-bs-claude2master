import Link from "next/link";
import {
  BookOpen,
  MessageSquare,
  Wrench,
  GraduationCap,
  Sparkles,
  Key,
  ArrowRight,
} from "lucide-react";
import Hero from "@/components/Hero";
import RadarSection from "@/components/RadarSection";
import HarnessDeepDive from "@/components/HarnessDeepDive";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";
import TrackedLink from "@/components/TrackedLink";

// 漏斗核心:3 张大卡 —— 进站第一眼要"重要功能一目了然"。Chat 是转化主路径,高亮。
const PRIMARY = [
  {
    icon: MessageSquare,
    title: "在线 Chat",
    desc: "免登录 3 条试用,Haiku / Sonnet / Opus 全系流式对话 —— 打开就能用。",
    cta: "开始对话",
    href: "/chat",
    featured: true,
  },
  {
    icon: GraduationCap,
    title: "Claude Code 教程",
    desc: "中文系统化教程,Skills / Hooks / MCP 实战,3 分钟跑通本地环境。",
    cta: "看教程",
    href: "/tutorials",
    featured: false,
  },
  {
    icon: Key,
    title: "API key 申请",
    desc: "3 步拿 key,支付宝 / 微信充值,OpenAI 与 Anthropic 双协议兼容。",
    cta: "拿 API key",
    href: "/api-keys",
    featured: false,
  },
];

// 次要入口:3 张小卡 —— 探索向,不抢主路径的视觉权重。
const SECONDARY = [
  {
    icon: BookOpen,
    title: "Prompt 库",
    desc: "按场景分类的高质量提示词,点击即复制。",
    href: "/prompts",
  },
  {
    icon: Wrench,
    title: "Skills 商店",
    desc: "国内首个 Claude Code Skills 中文索引,一键安装。",
    href: "/skills",
  },
  {
    icon: Sparkles,
    title: "Lurus 矩阵",
    desc: "newapi(算力)+ forge(workflow)+ lutu(APP)打包加速。",
    href: "/about",
  },
];

const TRUST_ROW = ["newapi", "forge", "lutu", "lucrum", "tally"];

export default async function Home() {
  return (
    <>
      <Hero />

      <section className="max-w-6xl mx-auto px-6 py-20 md:py-24">
        <Reveal className="text-center mb-12">
          <p className="eyebrow mb-3">你能在这里做什么</p>
          <h2 className="font-display italic text-3xl md:text-4xl font-semibold text-[var(--lt-ink)] mb-3">
            一个站点,把 Claude 串起来。
          </h2>
          <p className="max-w-xl mx-auto text-[var(--color-text-secondary)]">
            从对话到上手,再到接 API —— 先用起来,再深入。
          </p>
        </Reveal>

        {/* 漏斗核心:3 大卡 */}
        <Stagger className="grid md:grid-cols-3 gap-6 mb-6">
          {PRIMARY.map((p) => (
            <StaggerItem key={p.href} className="h-full">
              <TrackedLink
                href={p.href}
                event="cta_home_card"
                data={{ from: "home-card", target: p.href }}
                className={`card group flex flex-col h-full ${
                  p.featured ? "card-featured" : ""
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 ${
                    p.featured
                      ? "bg-[var(--c2m-accent)] text-white"
                      : "bg-[var(--c2m-accent-soft)] text-[var(--c2m-accent-deep)]"
                  }`}
                >
                  <p.icon size={24} strokeWidth={1.75} />
                </span>
                {p.featured && (
                  <p className="eyebrow mb-2 text-[var(--c2m-accent-deep)]">
                    最快上手
                  </p>
                )}
                <h3 className="text-xl font-semibold mb-3 text-[var(--lt-ink)]">
                  {p.title}
                </h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6 flex-1">
                  {p.desc}
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm text-[var(--c2m-accent-deep)] font-medium group-hover:gap-3 transition-all">
                  {p.cta}
                  <ArrowRight size={15} />
                </span>
              </TrackedLink>
            </StaggerItem>
          ))}
        </Stagger>

        {/* 次要入口:3 小卡 */}
        <Stagger className="grid sm:grid-cols-3 gap-4">
          {SECONDARY.map((s) => (
            <StaggerItem key={s.href} className="h-full">
              <Link
                href={s.href}
                className="card card-compact group flex items-start gap-3 h-full"
              >
                <s.icon
                  size={20}
                  className="text-[var(--c2m-accent)] shrink-0 mt-0.5"
                  strokeWidth={1.5}
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-base font-semibold text-[var(--lt-ink)]">
                    {s.title}
                    <ArrowRight
                      size={13}
                      className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[var(--c2m-accent-deep)]"
                    />
                  </span>
                  <span className="block text-sm text-[var(--color-text-secondary)] leading-relaxed mt-1">
                    {s.desc}
                  </span>
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <div className="section-divider max-w-6xl mx-auto" />

      <RadarSection />

      <div className="section-divider max-w-6xl mx-auto" />

      <HarnessDeepDive />

      <div className="section-divider max-w-6xl mx-auto" />

      <section className="max-w-6xl mx-auto px-6 py-20">
        <Reveal>
          <p className="eyebrow text-center mb-6">由 Lurus 自营基础设施驱动</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {TRUST_ROW.map((name) => (
              <span
                key={name}
                className="font-display italic text-2xl text-[var(--color-text-muted)] hover:text-[var(--c2m-accent-deep)] transition-colors"
              >
                {name}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <Reveal>
          <p className="eyebrow mb-3">准备好了?</p>
          <h2 className="font-display italic text-4xl md:text-5xl font-semibold text-[var(--lt-ink)] mb-6 headline-tight">
            打开浏览器就能开始。
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)] mb-8">
            不需要梯子、不需要信用卡、不需要等待。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/chat" className="btn btn-cta-glow">
              试试 Chat
              <ArrowRight size={16} />
            </Link>
            <Link href="/tutorials" className="btn btn-secondary">
              从 Claude Code 入门
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
