export interface ReleaseInput {
  kind?: "release";
  repo: string;
  tag: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
}

export interface PracticeInput {
  kind: "practice";
  label: string;
  url: string;
  title: string;
  body: string;
  published_at: string;
}

export interface TrendingInput {
  kind: "trending";
  repo: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  html_url: string;
  published_at: string;
}

export interface BloggerInput {
  kind: "blogger";
  author: string;
  handle: string;
  url: string;
  title: string;
  body: string;
  published_at: string;
}

export type Input = ReleaseInput | PracticeInput | TrendingInput | BloggerInput;

export interface SummaryOutput {
  hook: string;
  body: string;
  tags: string[];
}

export function isPractice(x: Input): x is PracticeInput {
  return (x as PracticeInput).kind === "practice";
}

export function isTrending(x: Input): x is TrendingInput {
  return (x as TrendingInput).kind === "trending";
}

export function isBlogger(x: Input): x is BloggerInput {
  return (x as BloggerInput).kind === "blogger";
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/^v/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugifyRaw(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function deriveSlug(input: Input): string {
  const date = input.published_at.slice(0, 10);
  if (isPractice(input)) {
    const pathTail = input.url
      .replace(/^https?:[/]{2}[^/]+[/]/, "")
      .replace(/[/]$/, "")
      .split("/")
      .slice(-1)[0];
    return `${date}-${slugify(input.label)}-${slugify(pathTail || "post")}`;
  }
  if (isTrending(input)) {
    return `${date}-trending-${slugifyRaw(input.repo)}`;
  }
  if (isBlogger(input)) {
    const handleSlug = slugifyRaw(input.handle);
    const titleSlug = slugifyRaw(input.title).split("-").slice(0, 8).join("-");
    return `${date}-blog-${handleSlug}-${titleSlug || "post"}`;
  }
  const repo = input.repo.split("/")[1] ?? input.repo;
  return `${date}-${slugify(repo)}-${slugify(input.tag)}`;
}

export function titleLineFor(input: Input): string {
  return isPractice(input)
    ? `${input.title} (${input.label})`
    : isTrending(input)
      ? `${input.name} (${input.repo})`
      : isBlogger(input)
        ? `${input.title} (${input.author})`
        : `${input.repo} ${input.tag} — ${input.name}`;
}

export function inputLabel(x: Input): string {
  if (isPractice(x)) return `${x.label}@${x.url}`;
  if (isTrending(x)) return `trending:${x.repo}`;
  if (isBlogger(x)) return `blog:${x.handle}@${x.url}`;
  return `${x.repo}@${x.tag}`;
}

export function escapeYaml(s: string): string {
  return s
    .replace(/[\r\n]+/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}
