import type { ChangelogItem, DigestItem, HarnessItem } from "./content-types";

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
