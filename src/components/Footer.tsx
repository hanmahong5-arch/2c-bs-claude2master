import Link from "next/link";
import TrackedLink from "./TrackedLink";

const PRODUCTS = [
  { href: "https://www.lurus.cn", label: "lurus.cn" },
  { href: "https://newapi.lurus.cn", label: "newapi" },
  { href: "https://forge.lurus.cn", label: "forge" },
  { href: "https://dsnb.help", label: "dsnb.help" },
];

const NAV = [
  { href: "/changelog", label: "Changelog" },
  { href: "/weekly", label: "Weekly" },
  { href: "/harness", label: "Harness" },
  { href: "/rank", label: "编程榜" },
  { href: "/zh", label: "中文指南" },
  { href: "/prompts", label: "Prompt 库" },
  { href: "/chat", label: "Chat" },
  { href: "/tutorials", label: "教程" },
  { href: "/skills", label: "Skills" },
  { href: "/api-keys", label: "API key" },
  { href: "/about", label: "关于" },
];

const SUBSCRIBE: { href: string; label: string; channel: string }[] = [
  { href: "/subscribe", label: "Newsletter (邮件)", channel: "newsletter" },
  { href: "/feed.xml", label: "RSS · 全站", channel: "all" },
  { href: "/feed/changelog", label: "RSS · Changelog", channel: "changelog" },
  { href: "/feed/digest", label: "RSS · Weekly", channel: "digest" },
];

const LEGAL = [
  { href: "/legal/privacy", label: "隐私政策" },
  { href: "/legal/terms", label: "服务条款" },
  { href: "/legal/beian", label: "备案信息" },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="wordmark text-xl text-[var(--lt-ink)]">
              claude<span className="text-[var(--c2m-accent-deep)]">2</span>master
            </Link>
            <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
              中国大陆用 Claude，
              <br />
              从入门到精通。
            </p>
          </div>

          <FooterCol title="导航" items={NAV} />
          <FooterSubscribeCol title="订阅" items={SUBSCRIBE} />
          <FooterCol title="Lurus 矩阵" items={PRODUCTS} external />
          <FooterCol title="法律" items={LEGAL} />
        </div>

        <div className="pt-6 border-t border-[var(--color-border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-xs text-[var(--color-text-muted)] space-y-1">
            <p>
              © {new Date().getFullYear()} Lurus ·{" "}
              <Link
                href="https://www.lurus.cn"
                className="hover:text-[var(--c2m-accent-deep)]"
              >
                www.lurus.cn
              </Link>
            </p>
            <p>
              Not affiliated with Anthropic. Claude is a trademark of Anthropic PBC.
            </p>
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            <Link href="/legal/beian" className="hover:text-[var(--c2m-accent-deep)]">
              备案：申请中
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
  external,
}: {
  title: string;
  items: { href: string; label: string }[];
  external?: boolean;
}) {
  return (
    <div>
      <h3 className="eyebrow mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--c2m-accent-deep)] transition-colors"
              {...(external && {
                target: "_blank",
                rel: "noopener noreferrer",
              })}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterSubscribeCol({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string; channel: string }[];
}) {
  return (
    <div>
      <h3 className="eyebrow mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => {
          const isNewsletter = item.channel === "newsletter";
          return (
            <li key={item.href}>
              <TrackedLink
                href={item.href}
                external={!isNewsletter}
                event={
                  isNewsletter
                    ? "newsletter_link_clicked"
                    : "rss_link_clicked"
                }
                data={{ channel: item.channel }}
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--c2m-accent-deep)] transition-colors"
              >
                {item.label}
              </TrackedLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
