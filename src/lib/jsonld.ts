import type { ChangelogItem, DigestItem, HarnessItem } from "./content-types";
import type { Prompt } from "./prompts";
import type { Tutorial } from "./tutorials";
import type { Skill } from "./skills";
import type { SeoLanding } from "./seo-landings";

const SITE = "https://claude2master.com";

const PUBLISHER = {
  "@type": "Organization",
  name: "claude2master",
  url: SITE,
  logo: {
    "@type": "ImageObject",
    url: `${SITE}/favicon.ico`,
  },
} as const;

const AUTHOR = {
  "@type": "Organization",
  name: "claude2master 编辑部",
  url: SITE,
} as const;

function baseArticle(
  headline: string,
  description: string,
  slug: string,
  publishedAt: string,
  pagePath: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    datePublished: publishedAt,
    dateModified: publishedAt,
    image: `${SITE}/og/${slug}`,
    author: AUTHOR,
    publisher: PUBLISHER,
    mainEntityOfPage: `${SITE}${pagePath}`,
    inLanguage: "zh-CN",
  };
}

export function changelogJsonLd(item: ChangelogItem) {
  return baseArticle(
    item.title,
    item.hook,
    item.slug,
    item.publishedAt,
    `/changelog/${item.slug}`,
  );
}

export function digestJsonLd(item: DigestItem) {
  return baseArticle(
    item.title,
    item.hook,
    item.slug,
    item.publishedAt,
    `/weekly/${item.slug}`,
  );
}

export function harnessJsonLd(item: HarnessItem) {
  return baseArticle(
    item.title,
    item.desc,
    item.slug,
    item.publishedAt,
    `/harness/${item.slug}`,
  );
}

// Prompt 无 per-item 日期字段; 种子内容统一按项目上线日。用作 datePublished 的稳定基线,
// 避免 SERP 新鲜度信号缺失。与 sitemap 的 CONTENT_SEED_DATE 保持一致。
const PROMPT_SEED_DATE = "2026-05-25";

/** Prompt 详情页 Article 结构化数据(/prompts 是 SEO 主战场, Article 可富结果, 优于 CreativeWork)。 */
export function promptJsonLd(p: Prompt) {
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.desc,
    image: `${SITE}/og/${p.slug}`,
    datePublished: PROMPT_SEED_DATE,
    dateModified: PROMPT_SEED_DATE,
    author: AUTHOR,
    publisher: PUBLISHER,
    mainEntityOfPage: `${SITE}/prompts/${p.slug}`,
    inLanguage: "zh-CN",
  };
  if (p.body) base.articleBody = p.body;
  const keywords = [p.category, ...(p.tags ?? [])].filter(Boolean);
  if (keywords.length > 0) base.keywords = keywords.join(",");
  return base;
}

/** Tutorial 详情页 Article 结构化数据。 */
export function tutorialJsonLd(t: Tutorial) {
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: t.title,
    description: t.desc,
    image: `${SITE}/og/${t.slug}`,
    author: AUTHOR,
    publisher: PUBLISHER,
    mainEntityOfPage: `${SITE}/tutorials/${t.slug}`,
    inLanguage: "zh-CN",
  };
  if (t.date) {
    base.datePublished = t.date;
    base.dateModified = t.date;
  }
  return base;
}

/** Skill 详情页 SoftwareApplication 结构化数据。 */
export function skillJsonLd(s: Skill) {
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: s.title,
    description: s.desc,
    applicationCategory: "DeveloperApplication",
    url: `${SITE}/skills/${s.slug}`,
    author: AUTHOR,
    inLanguage: "zh-CN",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
  return base;
}

/** Harness 列表页 CollectionPage + ItemList 结构化数据。 */
export function harnessListJsonLd(items: HarnessItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Agent Harness 设计",
    url: `${SITE}/harness`,
    inLanguage: "zh-CN",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.slice(0, 30).map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE}/harness/${c.slug}`,
        name: c.title,
      })),
    },
  };
}

/** Weekly Digest 列表页 CollectionPage + ItemList 结构化数据。 */
export function digestListJsonLd(items: DigestItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Weekly Digest",
    url: `${SITE}/weekly`,
    inLanguage: "zh-CN",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.slice(0, 30).map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE}/weekly/${c.slug}`,
        name: c.title,
      })),
    },
  };
}

/** 中文落地页 /zh/[slug] 的 @graph 结构化数据，含 Article + BreadcrumbList。
 *  注: 不输出 FAQPage —— 落地页 sections 是主题段(非真实 Q&A)且正文含 markdown,
 *  当成 FAQ 标记会违反 Google 结构化数据规范, 故只保留 Article + 面包屑。 */
export function zhLandingJsonLd(landing: SeoLanding) {
  const pageUrl = `${SITE}/zh/${landing.slug}`;

  const article: Record<string, unknown> = {
    "@type": "Article",
    headline: landing.title,
    description: landing.desc,
    image: `${SITE}/og/${landing.slug}`,
    author: AUTHOR,
    publisher: PUBLISHER,
    mainEntityOfPage: pageUrl,
    inLanguage: "zh-CN",
  };
  if (landing.keywords.length > 0) {
    article.keywords = landing.keywords.join(", ");
  }
  if (landing.updatedAt) {
    article.datePublished = landing.updatedAt;
    article.dateModified = landing.updatedAt;
  }

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "首页",
        item: SITE,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "中文指南",
        item: `${SITE}/zh`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: landing.title,
        item: pageUrl,
      },
    ],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [article, breadcrumb],
  };
}

/**
 * 列表页 (/changelog) 的结构化数据: CollectionPage + ItemList。
 * 详情页用 Article(编辑摘要), 列表页用 ItemList 帮 SEO 收录 8 工具雷达。
 * cap 前 30 条避免膨胀。
 */
export function changelogListJsonLd(items: ChangelogItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "工具更新雷达",
    url: `${SITE}/changelog`,
    inLanguage: "zh-CN",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.slice(0, 30).map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE}/changelog/${c.slug}`,
        name: c.title,
      })),
    },
  };
}
