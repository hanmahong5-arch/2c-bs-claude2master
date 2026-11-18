// SEO 落地页数据。每页针对一个中文关键词建独立 URL，吃中文搜索流量。
// 灵感：Agent D 调研报告 (机器之心 SOTA / AIbase / 老金 10 万字 Claude 教程)。
// 文案口径：诚实、可操作、不夸大；底部 CTA 引流到 c2m 现有栏目。

export interface SeoSection {
  id: string;
  title: string;
  body: string;
}

export interface SeoCta {
  label: string;
  href: string;
  desc: string;
}

export interface SeoLanding {
  slug: string;
  title: string;
  desc: string;
  hook: string;
  keywords: string[];
  updatedAt: string;
  toc: { id: string; label: string }[];
  sections: SeoSection[];
  ctas: SeoCta[];
}

