"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/prompts", label: "Prompt 库" },
  { href: "/chat", label: "Chat" },
  { href: "/tutorials", label: "教程" },
  { href: "/skills", label: "Skills" },
  { href: "/api-keys", label: "API key" },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const lastPathRef = useRef(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      setOpen(false);
    }
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-[rgba(245,242,232,0.85)] border-b border-[var(--color-border)]"
          : "backdrop-blur-md bg-[rgba(245,242,232,0.6)]"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="wordmark text-xl text-[var(--lt-ink)]">
          claude<span className="text-[var(--c2m-accent-deep)]">2</span>master
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-2 text-sm transition-colors ${
                  active
                    ? "text-[var(--c2m-accent-deep)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--lt-ink)]"
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[var(--c2m-accent)] rounded-full" />
                )}
              </Link>
            );
          })}
          <Link href="/login" className="btn btn-ghost ml-2 text-sm">
            登录
          </Link>
        </nav>

        <button
          aria-label={open ? "关闭菜单" : "打开菜单"}
          className="md:hidden p-2 -mr-2 text-[var(--lt-ink)]"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-[var(--color-border)] bg-[var(--lt-paper)]">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-6 h-14 border-l-2 border-transparent hover:border-[var(--c2m-accent)] hover:bg-[var(--lt-bg)] text-[var(--lt-ink)]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="flex items-center px-6 h-14 border-l-2 border-transparent text-[var(--c2m-accent-deep)] font-medium"
          >
            登录 →
          </Link>
        </nav>
      )}
    </header>
  );
}
