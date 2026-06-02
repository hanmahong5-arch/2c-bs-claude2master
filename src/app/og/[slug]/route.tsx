import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getAllContent } from "@/lib/content";
import { CHANNEL_LABEL } from "@/lib/content-types";
import { SEO_LANDINGS, getSeoLanding } from "@/lib/seo-landings";
import { PROMPTS, getPrompt } from "@/lib/prompts";
import { TUTORIALS, getTutorial } from "@/lib/tutorials";
import { SKILLS, getSkill } from "@/lib/skills";

export const runtime = "nodejs";
export const dynamic = "force-static";

const PAPER = "#F5F2E8";
const INK = "#14130F";
const ACCENT = "#7C5CFF";
const ACCENT_DEEP = "#5A3FE0";
const MUTED = "#7A7769";
const SECONDARY = "#3D3B33";
const RULE = "#D6D2C2";

export async function generateStaticParams() {
  const all = await getAllContent();
  // 用 Set 去重，防止 content/landing 与 prompts/tutorials/skills 同名 slug 重复
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

let cachedFont: ArrayBuffer | null = null;

const FONT_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-700-normal.woff";

async function loadCJKFont(): Promise<ArrayBuffer> {
  if (cachedFont) return cachedFont;
  const res = await fetch(FONT_URL);
  if (!res.ok) {
    throw new Error(
      `og-font: fetch ${FONT_URL} failed with ${res.status}`,
    );
  }
  cachedFont = await res.arrayBuffer();
  return cachedFont;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // "home" 虚拟 slug — 站级 OG 图
  if (slug === "home") {
    const fontData = await loadCJKFont();
    const titleSize = 64;
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            background: PAPER,
            padding: "60px 72px",
            fontFamily: "NotoSC",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 30,
                color: INK,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              claude2master
            </div>
            <div
              style={{
                background: ACCENT,
                color: "#FFFFFF",
                padding: "10px 22px",
                borderRadius: 9999,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              中文入口
            </div>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              paddingTop: 28,
              paddingBottom: 24,
            }}
          >
            <div
              style={{
                fontSize: titleSize,
                fontWeight: 700,
                color: INK,
                lineHeight: 1.12,
                letterSpacing: "-0.025em",
                marginBottom: 24,
              }}
            >
              claude2master
            </div>
            <div
              style={{
                fontSize: 28,
                color: SECONDARY,
                lineHeight: 1.45,
              }}
            >
              中国大陆用 Claude
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                height: 4,
                width: 140,
                background: `linear-gradient(90deg, ${ACCENT} 0%, ${ACCENT_DEEP} 100%)`,
                borderRadius: 2,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 22, color: MUTED, fontWeight: 700 }}>
                claude2master.com
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [{ name: "NotoSC", data: fontData, style: "normal", weight: 700 }],
      },
    );
  }

  const all = await getAllContent();
  const contentItem = all.find((x) => x.slug === slug);
  const landingItem = contentItem ? undefined : getSeoLanding(slug);

  // prompts / tutorials / skills 数据来源
  const promptItem = !contentItem && !landingItem ? getPrompt(slug) : undefined;
  const tutorialItem = !contentItem && !landingItem && !promptItem ? getTutorial(slug) : undefined;
  const skillItem =
    !contentItem && !landingItem && !promptItem && !tutorialItem
      ? getSkill(slug)
      : undefined;

  if (!contentItem && !landingItem && !promptItem && !tutorialItem && !skillItem)
    notFound();

  let title: string;
  let publishedAt: string;
  let channelLabel: string;
  let subtitleRaw: string;

  if (contentItem) {
    title = contentItem.title;
    publishedAt = contentItem.publishedAt;
    channelLabel = CHANNEL_LABEL[contentItem.channel];
    subtitleRaw =
      contentItem.channel === "harness"
        ? contentItem.desc
        : contentItem.hook ?? "";
  } else if (landingItem) {
    title = landingItem.title;
    publishedAt = landingItem.updatedAt;
    channelLabel = "中文指南";
    subtitleRaw = landingItem.hook;
  } else if (promptItem) {
    title = promptItem.title;
    publishedAt = "";
    channelLabel = "Prompt";
    subtitleRaw = promptItem.desc;
  } else if (tutorialItem) {
    title = tutorialItem.title;
    publishedAt = tutorialItem.date;
    channelLabel = "教程";
    subtitleRaw = tutorialItem.desc;
  } else {
    // skillItem is defined here
    title = skillItem!.title;
    publishedAt = "";
    channelLabel = "Skill";
    subtitleRaw = skillItem!.desc;
  }

  const item = { title, publishedAt };
  const subtitle = subtitleRaw;
  const truncated =
    subtitle.length > 110 ? subtitle.slice(0, 108) + "…" : subtitle;
  const titleSize = item.title.length > 36 ? 52 : 64;

  const fontData = await loadCJKFont();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: PAPER,
          padding: "60px 72px",
          fontFamily: "NotoSC",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 30,
              color: INK,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            claude2master
          </div>
          <div
            style={{
              background: ACCENT,
              color: "#FFFFFF",
              padding: "10px 22px",
              borderRadius: 9999,
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {channelLabel}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingTop: 28,
            paddingBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: titleSize,
              fontWeight: 700,
              color: INK,
              lineHeight: 1.12,
              letterSpacing: "-0.025em",
              marginBottom: 24,
            }}
          >
            {item.title}
          </div>
          {truncated && (
            <div
              style={{
                fontSize: 28,
                color: SECONDARY,
                lineHeight: 1.45,
              }}
            >
              {truncated}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              height: 4,
              width: 140,
              background: `linear-gradient(90deg, ${ACCENT} 0%, ${ACCENT_DEEP} 100%)`,
              borderRadius: 2,
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 22, color: MUTED, fontWeight: 700 }}>
              claude2master.com
            </div>
            {item.publishedAt && (
              <div
                style={{
                  fontSize: 20,
                  color: MUTED,
                  padding: "6px 14px",
                  border: `1px solid ${RULE}`,
                  borderRadius: 6,
                }}
              >
                {item.publishedAt}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "NotoSC",
          data: fontData,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
