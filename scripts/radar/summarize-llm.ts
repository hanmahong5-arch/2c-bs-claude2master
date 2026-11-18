import {
  postNewapiCompletion,
  radarFetchJson,
} from "../../src/infra/radar-http";
import {
  BLOGGER_SYSTEM_PROMPT,
  BROADCAST_SYSTEM_PROMPT,
  INSIGHT_SYSTEM_PROMPT,
  PRACTICE_SYSTEM_PROMPT,
  RELEASE_SYSTEM_PROMPT,
  TRENDING_SYSTEM_PROMPT,
} from "./summarize-prompts";
import {
  isBlogger,
  isPractice,
  isTrending,
  titleLineFor,
  type Input,
  type ReleaseInput,
  type SummaryOutput,
} from "./summarize-types";

const NEWAPI_BASE_URL =
  process.env.NEWAPI_BASE_URL ?? "https://newapi.lurus.cn";
export const MODEL_ID = process.env.RADAR_MODEL_ID ?? "deepseek-chat";
const TOKEN = process.env.NEWAPI_TRIAL_TOKEN ?? "";

export async function callNewapi(
  systemPrompt: string,
  userContent: string,
  maxTokens: number,
): Promise<string> {
  if (!TOKEN) throw new Error("NEWAPI_TRIAL_TOKEN missing");
  const MAX_ATTEMPTS = 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await postNewapiCompletion({
        baseUrl: NEWAPI_BASE_URL,
        token: TOKEN,
        model: MODEL_ID,
        systemPrompt,
        userContent,
        maxTokens,
        temperature: 0.3,
      });
    } catch (err) {
      lastErr = err;
      const status = (err as { status?: number }).status;
      const retryable = status === undefined || status >= 500;
      if (retryable && attempt < MAX_ATTEMPTS) {
        console.error(
          `[radar] newapi attempt ${attempt}/${MAX_ATTEMPTS} failed (${
            err instanceof Error ? err.message : String(err)
          }); retrying`,
        );
        await new Promise((r) => setTimeout(r, attempt * 1500));
        continue;
      }
      throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export async function callLLM(input: Input): Promise<SummaryOutput> {
  const sysPrompt = isPractice(input)
    ? PRACTICE_SYSTEM_PROMPT
    : isTrending(input)
      ? TRENDING_SYSTEM_PROMPT
      : isBlogger(input)
        ? BLOGGER_SYSTEM_PROMPT
        : RELEASE_SYSTEM_PROMPT;

  let userContent: string;
  if (isPractice(input)) {
    userContent = `Source label: ${input.label}
URL: ${input.url}
Title: ${input.title}

Article body (truncated to ~8KB):
${input.body || "(empty)"}`;
  } else if (isBlogger(input)) {
    userContent = `Blogger: ${input.author}
URL: ${input.url}
Title: ${input.title}

Post body (truncated to ~8KB):
${input.body || "(empty)"}`;
  } else if (isTrending(input)) {
    userContent = `Repository: ${input.repo}
Language: ${input.language}
Stars: ${input.stars}
URL: ${input.html_url}

Description:
${input.description || "(no description)"}`;
  } else {
    userContent = `Repository: ${input.repo}
Tag: ${input.tag}
Title: ${input.name}
URL: ${input.html_url}

Release notes:
${input.body || "(no notes provided)"}`;
  }

  const content = await callNewapi(sysPrompt, userContent, 800);
  let parsed: SummaryOutput;
  try {
    parsed = JSON.parse(content) as SummaryOutput;
  } catch {
    throw new Error(`LLM did not return valid JSON: ${content.slice(0, 200)}`);
  }
  if (!parsed.hook || !parsed.body || !Array.isArray(parsed.tags)) {
    throw new Error(`LLM JSON missing fields: ${content.slice(0, 200)}`);
  }
  return parsed;
}

export async function callCommentary(
  input: Input,
  summary: SummaryOutput,
): Promise<string> {
  const titleLine = titleLineFor(input);
  const userContent = `输入摘要标题：${titleLine}

中文 hook：${summary.hook}

中文摘要正文：
${summary.body}

请仅基于以上事实，给一段 80–150 字的 Lurus 视角判断。`;

  const content = await callNewapi(INSIGHT_SYSTEM_PROMPT, userContent, 400);
  let parsed: { insight?: string };
  try {
    parsed = JSON.parse(content) as { insight?: string };
  } catch {
    throw new Error(
      `insight LLM did not return valid JSON: ${content.slice(0, 200)}`,
    );
  }
  const insight = (parsed.insight ?? "").trim();
  if (insight.length < 40) {
    throw new Error(
      `insight too short (${insight.length} chars): ${insight.slice(0, 120)}`,
    );
  }
  return insight;
}

export async function callBroadcast(
  titleLine: string,
  hook: string,
  body: string,
): Promise<string> {
  const userContent = `输入摘要标题：${titleLine}

中文 hook：${hook}

中文摘要正文：
${body}

请仅基于以上事实，写一段 80–140 字的口语播报稿。`;

  const content = await callNewapi(BROADCAST_SYSTEM_PROMPT, userContent, 300);
  let parsed: { broadcast?: string };
  try {
    parsed = JSON.parse(content) as { broadcast?: string };
  } catch {
    throw new Error(
      `broadcast LLM did not return valid JSON: ${content.slice(0, 200)}`,
    );
  }
  const broadcast = (parsed.broadcast ?? "").trim();
  if (broadcast.length < 30) {
    throw new Error(
      `broadcast too short (${broadcast.length} chars): ${broadcast.slice(0, 120)}`,
    );
  }
  return broadcast;
}

export async function fetchReleaseFromUrl(url: string): Promise<ReleaseInput> {
  const m = url.match(
    /github\.com\/([^/]+)\/([^/]+)\/releases\/tag\/([^/?#]+)/,
  );
  if (!m) throw new Error(`Cannot parse release URL: ${url}`);
  const [, owner, repo, tag] = m;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`;
  const auth: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    auth.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await radarFetchJson<{
    tag_name: string;
    name: string;
    body: string;
    html_url: string;
    published_at: string;
  }>(apiUrl, { headers: auth });
  if (!res.ok || !res.data) {
    throw new Error(`GitHub API ${res.status}: ${res.errorText}`);
  }
  return {
    repo: `${owner}/${repo}`,
    tag: res.data.tag_name,
    name: res.data.name,
    body: res.data.body,
    html_url: res.data.html_url,
    published_at: res.data.published_at,
  };
}
