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

const PERSONAS = [
  {
    icon: GraduationCap,
    eyebrow: "学生 / 爱好者",
    title: "想学 Claude？",
    desc: "中文系统教程、能直接抄的 prompt、3 条免费试用，零门槛入门。",
    cta: "看教程",
    href: "/tutorials",
  },
  {
    icon: Wrench,
    eyebrow: "开发者",
    title: "想用 Claude API？",
    desc: "稳定 API key、支付宝/微信充值、OpenAI 与 Anthropic 双协议兼容。",
    cta: "拿 API key",
    href: "/api-keys",
  },
  {
    icon: Sparkles,
    eyebrow: "创作者",
    title: "想用 Claude 干活？",
    desc: "现成 Prompt 模板、Skills 一键安装、Forge 可视化工作流。",
    cta: "看 Prompt 库",
    href: "/prompts",
  },
];

const FEATURES = [
  {
    icon: BookOpen,
    title: "Prompt 库",
    desc: "按场景分类的高质量提示词，点击即复制。",
    href: "/prompts",
  },
  {
    icon: MessageSquare,
    title: "在线 Chat",
    desc: "免登录 3 条试用，覆盖 Haiku / Sonnet / Opus 全系。",
    href: "/chat",
  },
  {
    icon: GraduationCap,
    title: "Claude Code 教程",
    desc: "中文系统化教程，含 Skills、Hooks、MCP 实战。",
    href: "/tutorials",
  },
  {
    icon: Wrench,
    title: "Skills 商店",
    desc: "国内首个 Claude Code Skills 中文索引，一键安装。",
    href: "/skills",
  },
  {
    icon: Key,
    title: "API key 申请",
    desc: "3 步拿 key — 支付宝/微信支付，金融级计费透明。",
    href: "/api-keys",
  },
  {
    icon: Sparkles,
    title: "Lurus 矩阵",
    desc: "newapi（算力）+ forge（workflow）+ lutu（APP）打包加速。",
    href: "/about",
  },
];

const TRUST_ROW = ["newapi", "forge", "lutu", "lucrum", "tally"];

export default function Home() {
  return (
    <>
      <Hero />

      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="eyebrow mb-3">选你的角色</p>
          <h2 className="font-display italic text-3xl md:text-4xl font-semibold text-[var(--lt-ink)] mb-3">
            从今天开始，三天上手。
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PERSONAS.map((p) => (
            <Link
              key={p.eyebrow}
              href={p.href}
              className="card group flex flex-col"
            >
              <p.icon
                size={28}
                className="text-[var(--c2m-accent)] mb-4"
                strokeWidth={1.5}
              />
              <p className="eyebrow mb-2">{p.eyebrow}</p>
              <h3 className="text-xl font-semibold mb-3 text-[var(--lt-ink)]">
                {p.title}
              </h3>
              <p className="text-[var(--color-text-secondary)] leading-relaxed mb-5 flex-1">
                {p.desc}
              </p>
              <span className="inline-flex items-center gap-1 text-sm text-[var(--c2m-accent-deep)] font-medium group-hover:gap-2 transition-all">
                {p.cta}
                <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="section-divider max-w-6xl mx-auto" />

      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="eyebrow mb-3">你能在这里做什么</p>
          <h2 className="font-display italic text-3xl md:text-4xl font-semibold text-[var(--lt-ink)]">
            一个站点，把 Claude 串起来。
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <Link key={f.title} href={f.href} className="card group">
              <f.icon
                size={22}
                className="text-[var(--c2m-accent)] mb-3"
                strokeWidth={1.5}
              />
              <h3 className="text-lg font-semibold mb-2 text-[var(--lt-ink)]">
                {f.title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {f.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div className="section-divider max-w-6xl mx-auto" />

      <section className="max-w-6xl mx-auto px-6 py-20">
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
      </section>

      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="eyebrow mb-3">准备好了？</p>
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
      </section>
    </>
  );
}
