import { describe, it, expect } from "bun:test";
import { PROMPTS, getPrompt } from "./prompts";
import { SKILLS, getSkill } from "./skills";
import { TUTORIALS, getTutorial } from "./tutorials";
import { SEO_LANDINGS, getSeoLanding } from "./seo-landings";

// ---- getPrompt ----------------------------------------------------------------

describe("getPrompt", () => {
  it("returns a prompt with key fields for a real slug", () => {
    const p = getPrompt("react-perf-doctor");
    expect(p).toBeDefined();
    expect(p!.title).toBeTruthy();
    expect(p!.category).toBeTruthy();
    expect(p!.body).toBeTruthy();
  });

  it("returns undefined for a non-existent slug", () => {
    expect(getPrompt("does-not-exist-xyz")).toBeUndefined();
  });
});

// ---- getSkill ----------------------------------------------------------------

describe("getSkill", () => {
  it("returns a skill with key fields for a real slug", () => {
    const s = getSkill("code-review");
    expect(s).toBeDefined();
    expect(s!.title).toBeTruthy();
    expect(s!.category).toBeTruthy();
    expect(s!.triggerHint).toBeTruthy();
  });

  it("returns undefined for a non-existent slug", () => {
    expect(getSkill("does-not-exist-xyz")).toBeUndefined();
  });
});

// ---- getTutorial -------------------------------------------------------------

describe("getTutorial", () => {
  it("returns a tutorial with key fields for a real slug", () => {
    const t = getTutorial("claude-code-setup");
    expect(t).toBeDefined();
    expect(t!.title).toBeTruthy();
    expect(t!.category).toBeTruthy();
    expect(t!.body).toBeTruthy();
  });

  it("returns undefined for a non-existent slug", () => {
    expect(getTutorial("does-not-exist-xyz")).toBeUndefined();
  });
});

// ---- getSeoLanding -----------------------------------------------------------

describe("getSeoLanding", () => {
  it("returns a landing with key fields for a real slug", () => {
    const l = getSeoLanding("claude-code-cn");
    expect(l).toBeDefined();
    expect(l!.title).toBeTruthy();
    expect(l!.desc).toBeTruthy();
    expect(l!.sections.length).toBeGreaterThan(0);
  });

  it("returns undefined for a non-existent slug", () => {
    expect(getSeoLanding("does-not-exist-xyz")).toBeUndefined();
  });
});

// ---- slug uniqueness ---------------------------------------------------------

describe("slug uniqueness", () => {
  it("PROMPTS has no duplicate slugs", () => {
    const slugs = PROMPTS.map((p) => p.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("SKILLS has no duplicate slugs", () => {
    const slugs = SKILLS.map((s) => s.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("TUTORIALS has no duplicate slugs", () => {
    const slugs = TUTORIALS.map((t) => t.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("SEO_LANDINGS has no duplicate slugs", () => {
    const slugs = SEO_LANDINGS.map((l) => l.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });
});

// ---- compliance: PROMPTS.source must be non-empty ---------------------------

describe("compliance: PROMPTS source field", () => {
  it("every prompt has a non-empty source", () => {
    for (const p of PROMPTS) {
      expect(
        typeof p.source === "string" && p.source.trim().length > 0,
        `prompt "${p.slug}" has empty source`
      ).toBe(true);
    }
  });
});
