import { promises as fs } from "fs";
import path from "path";
import type {
  ChangelogItem,
  ContentChannel,
  ContentItem,
  DigestItem,
  HarnessItem,
} from "./content-types";

const CONTENT_ROOT = path.join(process.cwd(), "src", "content");

function parseFrontmatter(raw: string): {
  data: Record<string, unknown>;
  body: string;
} {
  if (!raw.startsWith("---")) return { data: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: raw };
  const fm = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\r?\n/, "");
  const data: Record<string, unknown> = {};
  for (const line of fm.split(/\r?\n/)) {
    const m = line.match(/^([a-zA-Z][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value: unknown = m[2].trim();
    if (typeof value === "string") {
      const s = value as string;
      if (s.startsWith("[") && s.endsWith("]")) {
        value = s
          .slice(1, -1)
          .split(",")
          .map((x) => x.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      } else if (
        (s.startsWith('"') && s.endsWith('"')) ||
        (s.startsWith("'") && s.endsWith("'"))
      ) {
        value = s.slice(1, -1);
      }
    }
    data[key] = value;
  }
  return { data, body };
}

async function readChannelRaw(
  channel: ContentChannel,
): Promise<{ slug: string; data: Record<string, unknown>; body: string }[]> {
  const dir = path.join(CONTENT_ROOT, channel);
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }
  const items: {
    slug: string;
    data: Record<string, unknown>;
    body: string;
  }[] = [];
  for (const f of entries) {
    if (!f.endsWith(".mdx") && !f.endsWith(".md")) continue;
    const full = path.join(dir, f);
    const raw = await fs.readFile(full, "utf-8");
    const { data, body } = parseFrontmatter(raw);
    const slug = (data.slug as string | undefined) ?? f.replace(/\.mdx?$/, "");
    items.push({ slug, data, body });
  }
  return items;
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asTags(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}

export async function getChangelog(): Promise<ChangelogItem[]> {
  const raw = await readChannelRaw("changelog");
  const items: ChangelogItem[] = raw.map(({ slug, data, body }) => ({
    channel: "changelog",
    slug,
    title: asString(data.title),
    publishedAt: asString(data.publishedAt),
    authored: (asString(data.authored, "llm") as ChangelogItem["authored"]),
    tags: asTags(data.tags),
    body,
    source: asString(data.source),
    sourceUrl: asString(data.sourceUrl),
    hook: asString(data.hook),
    model: data.model ? asString(data.model) : undefined,
    verified:
      asString(data.verified) === "tested"
        ? "tested"
        : asString(data.verified) === "pending"
          ? "pending"
          : undefined,
    insight: data.insight ? asString(data.insight) : undefined,
    kind:
      asString(data.kind) === "practice"
        ? "practice"
        : asString(data.kind) === "changelog"
          ? "changelog"
          : undefined,
  }));
  return items.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export async function getDigest(): Promise<DigestItem[]> {
  const raw = await readChannelRaw("digest");
  const items: DigestItem[] = raw.map(({ slug, data, body }) => ({
    channel: "digest",
    slug,
    title: asString(data.title),
    publishedAt: asString(data.publishedAt),
    authored: (asString(data.authored, "hybrid") as DigestItem["authored"]),
    tags: asTags(data.tags),
    body,
    hook: asString(data.hook),
    weekOf: asString(data.weekOf),
    model: data.model ? asString(data.model) : undefined,
    readingMinutes: data.readingMinutes
      ? Number(asString(data.readingMinutes))
      : undefined,
  }));
  return items.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export async function getHarness(): Promise<HarnessItem[]> {
  const raw = await readChannelRaw("harness");
  const items: HarnessItem[] = raw.map(({ slug, data, body }) => ({
    channel: "harness",
    slug,
    title: asString(data.title),
    publishedAt: asString(data.publishedAt),
    authored: (asString(data.authored, "editor") as HarnessItem["authored"]),
    tags: asTags(data.tags),
    body,
    desc: asString(data.desc),
    read: data.read ? asString(data.read) : undefined,
    model: data.model ? asString(data.model) : undefined,
    references: Array.isArray(data.references)
      ? data.references.map((x) => String(x)).filter(Boolean)
      : undefined,
  }));
  return items.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export async function getChangelogBySlug(
  slug: string,
): Promise<ChangelogItem | undefined> {
  const all = await getChangelog();
  return all.find((x) => x.slug === slug);
}

export async function getDigestBySlug(
  slug: string,
): Promise<DigestItem | undefined> {
  const all = await getDigest();
  return all.find((x) => x.slug === slug);
}

export async function getHarnessBySlug(
  slug: string,
): Promise<HarnessItem | undefined> {
  const all = await getHarness();
  return all.find((x) => x.slug === slug);
}

export async function getAllContent(): Promise<ContentItem[]> {
  const [c, d, h] = await Promise.all([getChangelog(), getDigest(), getHarness()]);
  return [...c, ...d, ...h].sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : -1,
  );
}
