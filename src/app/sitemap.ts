import type { MetadataRoute } from "next";
import { PROMPTS } from "@/lib/prompts";
import { TUTORIALS } from "@/lib/tutorials";
import { SKILLS } from "@/lib/skills";
import { getChangelog, getDigest, getHarness } from "@/lib/content";
import { SEO_LANDINGS } from "@/lib/seo-landings";

const BASE = "https://claude2master.com";
const now = new Date();

const STATIC_ROUTES: {
  path: string;
  priority: number;
  changeFreq: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "/", priority: 1.0, changeFreq: "weekly" },
  { path: "/prompts", priority: 0.9, changeFreq: "daily" },
  { path: "/chat", priority: 0.9, changeFreq: "weekly" },
  { path: "/tutorials", priority: 0.9, changeFreq: "weekly" },
  { path: "/skills", priority: 0.9, changeFreq: "weekly" },
  { path: "/changelog", priority: 0.9, changeFreq: "daily" },
  { path: "/weekly", priority: 0.8, changeFreq: "weekly" },
  { path: "/harness", priority: 0.8, changeFreq: "weekly" },
  { path: "/api-keys", priority: 0.8, changeFreq: "monthly" },
  { path: "/zh", priority: 0.7, changeFreq: "weekly" },
  { path: "/subscribe", priority: 0.7, changeFreq: "monthly" },
  { path: "/rank", priority: 0.85, changeFreq: "monthly" },
  { path: "/about", priority: 0.6, changeFreq: "monthly" },
  { path: "/login", priority: 0.3, changeFreq: "yearly" },
  { path: "/signup", priority: 0.3, changeFreq: "yearly" },
  { path: "/legal/privacy", priority: 0.3, changeFreq: "yearly" },
  { path: "/legal/terms", priority: 0.3, changeFreq: "yearly" },
  { path: "/legal/beian", priority: 0.3, changeFreq: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [changelog, digest, harness] = await Promise.all([
    getChangelog(),
    getDigest(),
    getHarness(),
  ]);
  return [
    ...STATIC_ROUTES.map((r) => ({
      url: `${BASE}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFreq,
      priority: r.priority,
    })),
    ...PROMPTS.map((p) => ({
      url: `${BASE}/prompts/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...TUTORIALS.map((t) => ({
      url: `${BASE}/tutorials/${t.slug}`,
      lastModified: new Date(t.date),
      changeFrequency: "monthly" as const,
      priority: t.pinned ? 0.8 : 0.7,
    })),
    ...SKILLS.map((s) => ({
      url: `${BASE}/skills/${s.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...changelog.map((c) => ({
      url: `${BASE}/changelog/${c.slug}`,
      lastModified: c.publishedAt ? new Date(c.publishedAt) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...digest.map((d) => ({
      url: `${BASE}/weekly/${d.slug}`,
      lastModified: d.publishedAt ? new Date(d.publishedAt) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...harness.map((h) => ({
      url: `${BASE}/harness/${h.slug}`,
      lastModified: h.publishedAt ? new Date(h.publishedAt) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...SEO_LANDINGS.map((l) => ({
      url: `${BASE}/zh/${l.slug}`,
      lastModified: new Date(l.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  ];
}
