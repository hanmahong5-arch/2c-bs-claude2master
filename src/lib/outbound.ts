// 单一信息源:所有出站引流链接(newapi / forge / hub)的归因 URL 只在这里构造。
// 禁各页面手拼 query string —— 防止 UTM 参数 drift。
//
// 设计原则:
// - buildOutbound() 是纯函数(入→出无 I/O),可单测、决定论。
// - 幂等:已带 utm_source 的 URL 不再二次追加(重跑等价)。
// - 归因事件(track)与归因链接(utm)解耦:link 走本模块,track 走 TrackedLink 组件。

/** 出站引流目标。每个目标对应一个稳定 prod 域名。 */
export type OutboundTarget = "newapi" | "forge" | "hub";

const TARGET_BASE: Record<OutboundTarget, string> = {
  newapi: "https://newapi.lurus.cn",
  forge: "https://forge.lurus.cn",
  hub: "https://hub.lurus.cn",
};

/**
 * 来源页区分的 campaign。新增引流入口时在这里加一个常量,
 * 不要在调用点传裸字符串(避免 typo 导致归因数据碎裂)。
 */
export const OUTBOUND_CAMPAIGN = {
  /** chat 额度耗尽 → 注册 */
  chatExhausted: "chat-exhausted",
  /** 首页 3 大卡 / CTA */
  homeCard: "home-card",
  /** API key 申请页 */
  apiKeys: "api-keys",
  /** 教程页内引流 */
  tutorial: "tutorial",
  /** 登录页引流 */
  login: "login",
  /** 注册页引流 */
  signup: "signup",
  /** 关于页产品矩阵 */
  about: "about",
  /** skills 详情 → forge */
  skillsPage: "skills-page",
} as const;

export type OutboundCampaign =
  (typeof OUTBOUND_CAMPAIGN)[keyof typeof OUTBOUND_CAMPAIGN];

const UTM_SOURCE = "claude2master";
const UTM_MEDIUM = "referral";

// newapi 原生邀请码(root 账号 aff_code): c2m 引流的注册经此落入 newapi users.inviter_id,
// 使「c2m → 真实注册」可被 SQL 归因 —— utm 对 newapi 不可见, 故归因必须走 aff。
// 注: 当前复用 root(id=1)的 aff_code; 如需与 owner 个人引荐分离, 后续建专属 c2m 账号换码。
const NEWAPI_AFF_CODE = "LnyW";

/**
 * 构造带归因参数的出站 URL。
 *
 * @param target   引流目标(newapi/forge/hub)
 * @param campaign 来源页 campaign(见 OUTBOUND_CAMPAIGN)
 * @returns        形如 `https://newapi.lurus.cn/?utm_source=claude2master&utm_medium=referral&utm_campaign=chat-exhausted`
 *
 * 幂等:若 base 已含 utm_source 则原样返回,不二次追加。
 */
export function buildOutbound(
  target: OutboundTarget,
  campaign: OutboundCampaign,
): string {
  const base = TARGET_BASE[target];
  // 已带归因 → 原样返回(幂等)。
  if (base.includes("utm_source=")) return base;

  const url = new URL(base);
  url.searchParams.set("utm_source", UTM_SOURCE);
  url.searchParams.set("utm_medium", UTM_MEDIUM);
  url.searchParams.set("utm_campaign", campaign);
  // newapi 注册归因(见 NEWAPI_AFF_CODE): 仅 newapi 目标带 aff 邀请码。
  if (target === "newapi") {
    url.searchParams.set("aff", NEWAPI_AFF_CODE);
  }
  return url.toString();
}
