import { MODEL_ID } from "./summarize-llm";
import {
  escapeYaml,
  isBlogger,
  isPractice,
  isTrending,
  type Input,
  type ReleaseInput,
  type SummaryOutput,
} from "./summarize-types";

export function buildMdx(
  input: Input,
  summary: SummaryOutput,
  insight: string,
  broadcast: string,
  slug: string,
): string {
  const tagsArr = `[${summary.tags.map((t) => `${t.trim()}`).join(", ")}]`;
  const verified = "pending" as const;
  const kind: "changelog" | "practice" | "trending" | "blogger" = isPractice(
    input,
  )
    ? "practice"
    : isTrending(input)
      ? "trending"
      : isBlogger(input)
        ? "blogger"
        : "changelog";

  if (isBlogger(input)) {
    const titleCore = summary.hook.replace(/[—\-:].*$/, "").trim().slice(0, 40);
    const head =
      input.title.length <= 56
        ? input.title
        : input.title.slice(0, 56).replace(/\s+\S*$/, "");
    const title = `${head} — ${titleCore}`;
    return `---
slug: ${slug}
title: "${escapeYaml(title)}"
source: "${escapeYaml(input.author)}"
sourceUrl: ${input.url}
publishedAt: ${input.published_at.slice(0, 10)}
authored: llm
model: ${MODEL_ID}
verified: ${verified}
kind: ${kind}
author: "${escapeYaml(input.author)}"
hook: "${escapeYaml(summary.hook)}"
broadcast: "${escapeYaml(broadcast)}"
tags: ${tagsArr}
---

${summary.body}

---

> 原文：[${input.title}](${input.url}) · 作者 ${input.author}
`;
  }

  if (isPractice(input)) {
    const titleCore = summary.hook.replace(/[—\-:].*$/, "").trim().slice(0, 40);
    const title = `${input.title.slice(0, 40)} — ${titleCore}`;
    return `---
slug: ${slug}
title: "${escapeYaml(title)}"
source: ${input.label}
sourceUrl: ${input.url}
publishedAt: ${input.published_at.slice(0, 10)}
authored: llm
model: ${MODEL_ID}
verified: ${verified}
kind: ${kind}
hook: "${escapeYaml(summary.hook)}"
broadcast: "${escapeYaml(broadcast)}"
insight: "${escapeYaml(insight)}"
tags: ${tagsArr}
---

${summary.body}

---

> 原文：[${input.title}](${input.url})
`;
  }

  if (isTrending(input)) {
    const titleCore = summary.hook.replace(/[—\-:].*$/, "").trim().slice(0, 40);
    const title = `${input.name} — ${titleCore}`;
    return `---
slug: ${slug}
title: "${escapeYaml(title)}"
source: ${input.repo}
sourceUrl: ${input.html_url}
publishedAt: ${input.published_at.slice(0, 10)}
authored: llm
model: ${MODEL_ID}
verified: ${verified}
kind: ${kind}
hook: "${escapeYaml(summary.hook)}"
broadcast: "${escapeYaml(broadcast)}"
tags: ${tagsArr}
---

${summary.body}

---

> 项目：[${input.repo}](${input.html_url}) · ⭐ ${input.stars} · ${input.language}
`;
  }

  const release = input as ReleaseInput;
  const title = `${release.repo.split("/")[1]} ${release.tag} — ${summary.hook.replace(/[—\-:].*$/, "").trim().slice(0, 40)}`;
  return `---
slug: ${slug}
title: "${escapeYaml(title)}"
source: ${release.repo}
sourceUrl: ${release.html_url}
publishedAt: ${release.published_at.slice(0, 10)}
authored: llm
model: ${MODEL_ID}
verified: ${verified}
kind: ${kind}
hook: "${escapeYaml(summary.hook)}"
broadcast: "${escapeYaml(broadcast)}"
insight: "${escapeYaml(insight)}"
tags: ${tagsArr}
---

${summary.body}

---

> 原文 release：[${release.repo} ${release.tag}](${release.html_url})
`;
}
