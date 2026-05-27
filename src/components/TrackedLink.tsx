"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";

type Props = {
  href: string;
  event: string;
  data?: Record<string, string | number | boolean | null>;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
  ariaLabel?: string;
};

export default function TrackedLink({
  href,
  event,
  data,
  children,
  className,
  external,
  ariaLabel,
}: Props) {
  function fire() {
    try {
      track(event, data);
    } catch {
      // Analytics 不阻塞导航
    }
  }

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={ariaLabel}
        onClick={fire}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      aria-label={ariaLabel}
      onClick={fire}
    >
      {children}
    </Link>
  );
}
