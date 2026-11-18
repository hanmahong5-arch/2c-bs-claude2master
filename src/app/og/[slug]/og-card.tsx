import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getAllContent } from "@/lib/content";
import { CHANNEL_LABEL } from "@/lib/content-types";
import { getSeoLanding } from "@/lib/seo-landings";
import { getPrompt } from "@/lib/prompts";
import { getTutorial } from "@/lib/tutorials";
import { getSkill } from "@/lib/skills";

const PAPER = "#F5F2E8";
const INK = "#14130F";
const ACCENT = "#7C5CFF";
const ACCENT_DEEP = "#5A3FE0";
const MUTED = "#7A7769";
const SECONDARY = "#3D3B33";
const RULE = "#D6D2C2";

let cachedFont: Buffer | null = null;

async function loadCJKFont(): Promise<Buffer> {
  if (cachedFont) return cachedFont;
  cachedFont = await readFile(
    join(process.cwd(), "public/fonts/noto-sans-sc-700.woff"),
  );
  return cachedFont;
}

export interface OgEntryData {
  title: string;
  publishedAt: string;
  channelLabel: string;
  subtitle: string;
}

export async function resolveOgEntry(slug: string): Promise<OgEntryData | null> {
  const all = await getAllContent();
  const contentItem = all.find((x) => x.slug === slug);
  const landingItem = contentItem ? undefined : getSeoLanding(slug);
  const promptItem = !contentItem && !landingItem ? getPrompt(slug) : undefined;
  const tutorialItem =
    !contentItem && !landingItem && !promptItem ? getTutorial(slug) : undefined;
  const skillItem =
    !contentItem && !landingItem && !promptItem && !tutorialItem
      ? getSkill(slug)
      : undefined;

  if (contentItem) {
    return {
      title: contentItem.title,
      publishedAt: contentItem.publishedAt,
      channelLabel: CHANNEL_LABEL[contentItem.channel],
      subtitle:
        contentItem.channel === "harness"
          ? contentItem.desc
          : (contentItem.hook ?? ""),
    };
  }
  if (landingItem) {
    return {
      title: landingItem.title,
      publishedAt: landingItem.updatedAt,
      channelLabel: "中文指南",
      subtitle: landingItem.hook,
    };
  }
  if (promptItem) {
    return {
      title: promptItem.title,
      publishedAt: "",
      channelLabel: "Prompt",
      subtitle: promptItem.desc,
    };
  }
  if (tutorialItem) {
    return {
      title: tutorialItem.title,
      publishedAt: tutorialItem.date,
      channelLabel: "教程",
      subtitle: tutorialItem.desc,
    };
  }
  if (skillItem) {
    return {
      title: skillItem.title,
      publishedAt: "",
      channelLabel: "Skill",
      subtitle: skillItem.desc,
    };
  }
  return null;
}

export async function buildOgImageResponse(opts: {
  title: string;
  subtitle: string;
  badge: string;
  publishedAt?: string;
}): Promise<ImageResponse> {
  const fontData = await loadCJKFont();
  const truncated =
    opts.subtitle.length > 110
      ? opts.subtitle.slice(0, 108) + "…"
      : opts.subtitle;
  const titleSize = opts.title.length > 36 ? 52 : 64;

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
            {opts.badge}
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
            {opts.title}
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
            {opts.publishedAt && (
              <div
                style={{
                  fontSize: 20,
                  color: MUTED,
                  padding: "6px 14px",
                  border: `1px solid ${RULE}`,
                  borderRadius: 6,
                }}
              >
                {opts.publishedAt}
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
