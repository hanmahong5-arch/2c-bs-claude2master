import { describe, expect, test } from "bun:test";
import { buildOutbound, OUTBOUND_CAMPAIGN } from "./outbound";

describe("buildOutbound", () => {
  test("newapi target 的 host 为 newapi.lurus.cn", () => {
    const result = buildOutbound("newapi", OUTBOUND_CAMPAIGN.homeCard);
    expect(new URL(result).host).toBe("newapi.lurus.cn");
  });

  test("forge target 的 host 为 forge.lurus.cn", () => {
    const result = buildOutbound("forge", OUTBOUND_CAMPAIGN.tutorial);
    expect(new URL(result).host).toBe("forge.lurus.cn");
  });

  test("hub target 的 host 为 hub.lurus.cn", () => {
    const result = buildOutbound("hub", OUTBOUND_CAMPAIGN.apiKeys);
    expect(new URL(result).host).toBe("hub.lurus.cn");
  });

  test("含 utm_source=claude2master", () => {
    const result = buildOutbound("newapi", OUTBOUND_CAMPAIGN.chatExhausted);
    expect(new URL(result).searchParams.get("utm_source")).toBe("claude2master");
  });

  test("含 utm_medium=referral", () => {
    const result = buildOutbound("newapi", OUTBOUND_CAMPAIGN.chatExhausted);
    expect(new URL(result).searchParams.get("utm_medium")).toBe("referral");
  });

  test("utm_campaign 等于传入的 campaign 值", () => {
    const campaign = OUTBOUND_CAMPAIGN.login;
    const result = buildOutbound("newapi", campaign);
    expect(new URL(result).searchParams.get("utm_campaign")).toBe(campaign);
  });

  test("newapi target 带 aff 邀请码(注册归因落 inviter_id)", () => {
    const result = buildOutbound("newapi", OUTBOUND_CAMPAIGN.chatExhausted);
    expect(new URL(result).searchParams.get("aff")).toBe("LnyW");
  });

  test("非 newapi 目标不带 aff(aff 是 newapi 专属概念)", () => {
    for (const target of ["forge", "hub"] as const) {
      const result = buildOutbound(target, OUTBOUND_CAMPAIGN.about);
      expect(new URL(result).searchParams.get("aff")).toBeNull();
    }
  });

  test("相同入参两次调用返回字符串相等(决定论)", () => {
    const a = buildOutbound("forge", OUTBOUND_CAMPAIGN.about);
    const b = buildOutbound("forge", OUTBOUND_CAMPAIGN.about);
    expect(a).toBe(b);
  });

  test("遍历 OUTBOUND_CAMPAIGN 全部值传入不抛且 URL 合法", () => {
    for (const campaign of Object.values(OUTBOUND_CAMPAIGN)) {
      for (const target of ["newapi", "forge", "hub"] as const) {
        const result = buildOutbound(target, campaign);
        expect(() => new URL(result)).not.toThrow();
      }
    }
  });
});
