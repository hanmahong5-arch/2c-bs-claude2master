import type { MetadataRoute } from "next";

const BASE = "https://claude2master.com";
const now = new Date();

const STATIC_ROUTES: { path: string; priority: number; changeFreq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFreq: "weekly" },
  { path: "/prompts", priority: 0.9, changeFreq: "daily" },
  { path: "/chat", priority: 0.9, changeFreq: "weekly" },
  { path: "/tutorials", priority: 0.9, changeFreq: "weekly" },
  { path: "/skills", priority: 0.9, changeFreq: "weekly" },
  { path: "/api-keys", priority: 0.8, changeFreq: "monthly" },
  { path: "/about", priority: 0.6, changeFreq: "monthly" },
  { path: "/login", priority: 0.3, changeFreq: "yearly" },
  { path: "/signup", priority: 0.3, changeFreq: "yearly" },
  { path: "/legal/privacy", priority: 0.3, changeFreq: "yearly" },
  { path: "/legal/terms", priority: 0.3, changeFreq: "yearly" },
  { path: "/legal/beian", priority: 0.3, changeFreq: "yearly" },
];

const SEED_PROMPTS = ["react-perf-doctor", "long-form-outline", "tech-translate"];
const SEED_TUTORIALS = [
  "claude-code-setup",
  "model-selection",
  "skills-intro",
  "hooks-pre-commit",
  "mcp-intro",
  "forge-workflow",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...STATIC_ROUTES.map((r) => ({
      url: `${BASE}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFreq,
      priority: r.priority,
    })),
    ...SEED_PROMPTS.map((slug) => ({
      url: `${BASE}/prompts/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...SEED_TUTORIALS.map((slug) => ({
      url: `${BASE}/tutorials/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
