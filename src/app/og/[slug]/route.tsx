import { notFound } from "next/navigation";
import { getAllContent } from "@/lib/content";
import { SEO_LANDINGS } from "@/lib/seo-landings";
import { PROMPTS } from "@/lib/prompts";
import { TUTORIALS } from "@/lib/tutorials";
import { SKILLS } from "@/lib/skills";
import { buildOgImageResponse, resolveOgEntry } from "./og-card";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function generateStaticParams() {
  const all = await getAllContent();
  const seen = new Set<string>();
  const push = (slug: string) => {
    if (!seen.has(slug)) {
      seen.add(slug);
    }
  };
  all.forEach((c) => push(c.slug));
  SEO_LANDINGS.forEach((l) => push(l.slug));
  PROMPTS.forEach((p) => push(p.slug));
  TUTORIALS.forEach((t) => push(t.slug));
  SKILLS.forEach((s) => push(s.slug));
  push("home");
  return Array.from(seen).map((slug) => ({ slug }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (slug === "home") {
    return await buildOgImageResponse({
      title: "claude2master",
      subtitle: "中国大陆用 Claude",
      badge: "中文入口",
    });
  }

  const entry = await resolveOgEntry(slug);
  if (!entry) notFound();

  return await buildOgImageResponse({
    title: entry.title,
    subtitle: entry.subtitle,
    badge: entry.channelLabel,
    publishedAt: entry.publishedAt,
  });
}
