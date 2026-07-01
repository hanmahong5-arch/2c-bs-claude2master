// llm-prices.ts — LLM API 价格对照表(单一信息源)
//
// 数据口径:
// - 价格 = 每百万 token(区分输入/输出),一律取厂商**官方定价页**当时价;
//   查不到官方页的模型不收录(宁缺毋滥,来源记在 sourceUrl)。
// - 国产模型记 CNY 原价,海外记 USD 原价,展示层再按 USD_CNY_RATE 估算换算。
// - PRICES_AS_OF 是数据核实日;价格会变,页面必须展示此日期 + "以官方为准"。
// 更新方式: 人工/管线定期重核官方页后整体替换 MODEL_PRICES 并更新 PRICES_AS_OF。

export interface ModelPrice {
  /** kebab-case 唯一 id,做行 key 与锚点 */
  id: string;
  /** 模型展示名 */
  name: string;
  /** 厂商中文名 */
  vendor: string;
  /** 每百万输入 token 价格(currency 计价) */
  inputPerM: number;
  /** 每百万输出 token 价格(currency 计价) */
  outputPerM: number;
  currency: "USD" | "CNY";
  /** 上下文窗口,如 "200K" */
  context: string;
  /** 档位 — 旗舰(最强)/均衡(性价比)/轻量(便宜快) */
  tier: "旗舰" | "均衡" | "轻量";
  /** 官方 API 大陆能否直连 */
  cnDirect: boolean;
  /** 官方定价页 URL(数据出处) */
  sourceUrl: string;
  /** 特殊计价备注(缓存价/阶梯价),无则空串 */
  note: string;
}

/** 数据核实日期 — 更新 MODEL_PRICES 时必须同步更新 */
export const PRICES_AS_OF = "2026-06-30";

/** USD→CNY 估算汇率,仅用于同表排序与直观对比,页面须标注"估算" */
export const USD_CNY_RATE = 7.2;

export const MODEL_PRICES: ModelPrice[] = [
  {
    id: "claude-fable-5",
    name: "Claude Fable 5",
    vendor: "Anthropic",
    inputPerM: 10,
    outputPerM: 50,
    currency: "USD",
    context: "1M",
    tier: "旗舰",
    cnDirect: false,
    sourceUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    note: "5m缓存写1.25x/1h写2x/缓存命中0.1x；批量价对折",
  },
  {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    vendor: "Anthropic",
    inputPerM: 5,
    outputPerM: 25,
    currency: "USD",
    context: "1M",
    tier: "旗舰",
    cnDirect: false,
    sourceUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    note: "现行最强Opus；批量价对折；Fast mode输入$10/输出$50",
  },
  {
    id: "claude-sonnet-5",
    name: "Claude Sonnet 5",
    vendor: "Anthropic",
    inputPerM: 2,
    outputPerM: 10,
    currency: "USD",
    context: "1M",
    tier: "均衡",
    cnDirect: false,
    sourceUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    note: "2026-08-31前introductory价$2/$10，之后转标准价$3/$15",
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    vendor: "Anthropic",
    inputPerM: 1,
    outputPerM: 5,
    currency: "USD",
    context: "200K",
    tier: "轻量",
    cnDirect: false,
    sourceUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    note: "批量价对折",
  },
  {
    id: "gpt-5.5",
    name: "GPT-5.5",
    vendor: "OpenAI",
    inputPerM: 5,
    outputPerM: 30,
    currency: "USD",
    context: "—",
    tier: "旗舰",
    cnDirect: false,
    sourceUrl: "https://platform.openai.com/docs/pricing",
    note: "缓存输入$0.5/M；批量/Flex价对折；Priority价2.5x",
  },
  {
    id: "gpt-5.5-pro",
    name: "GPT-5.5-pro",
    vendor: "OpenAI",
    inputPerM: 30,
    outputPerM: 180,
    currency: "USD",
    context: "—",
    tier: "旗舰",
    cnDirect: false,
    sourceUrl: "https://platform.openai.com/docs/pricing",
    note: "批量/Flex价对折",
  },
  {
    id: "gpt-5.4",
    name: "GPT-5.4",
    vendor: "OpenAI",
    inputPerM: 2.5,
    outputPerM: 15,
    currency: "USD",
    context: "—",
    tier: "均衡",
    cnDirect: false,
    sourceUrl: "https://platform.openai.com/docs/pricing",
    note: "缓存输入$0.25/M；批量/Flex价对折；Priority价2x",
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro Preview",
    vendor: "Google",
    inputPerM: 2,
    outputPerM: 12,
    currency: "USD",
    context: "200K阶梯",
    tier: "旗舰",
    cnDirect: false,
    sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    note: "≤200K输入$2/输出$12，>200K输入$4/输出$18；无正式\"Gemini 3 Pro\"GA款，当前为Preview",
  },
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    vendor: "Google",
    inputPerM: 1.5,
    outputPerM: 9,
    currency: "USD",
    context: "—",
    tier: "均衡",
    cnDirect: false,
    sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    note: "官方无独立context caching存储费$1/小时",
  },
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash Preview",
    vendor: "Google",
    inputPerM: 0.5,
    outputPerM: 3,
    currency: "USD",
    context: "—",
    tier: "轻量",
    cnDirect: false,
    sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    note: "文本/图片/视频输入价；音频输入$1/M",
  },
  {
    id: "grok-4.3",
    name: "Grok 4.3",
    vendor: "xAI",
    inputPerM: 1.25,
    outputPerM: 2.5,
    currency: "USD",
    context: "1M",
    tier: "旗舰",
    cnDirect: false,
    sourceUrl: "https://docs.x.ai/docs/models",
    note: "官方推荐主力模型，知识截止2024-11",
  },
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek-V4-Flash (原deepseek-chat)",
    vendor: "DeepSeek",
    inputPerM: 1,
    outputPerM: 2,
    currency: "CNY",
    context: "1M(最大输出384K)",
    tier: "均衡",
    cnDirect: true,
    sourceUrl: "https://api-docs.deepseek.com/zh-cn/quick_start/pricing",
    note: "缓存命中输入¥0.02/M；deepseek-chat将于2026-07-24弃用并映射为此模型非思考模式",
  },
  {
    id: "deepseek-v4-pro",
    name: "DeepSeek-V4-Pro (原deepseek-reasoner)",
    vendor: "DeepSeek",
    inputPerM: 3,
    outputPerM: 6,
    currency: "CNY",
    context: "1M(最大输出384K)",
    tier: "旗舰",
    cnDirect: true,
    sourceUrl: "https://api-docs.deepseek.com/zh-cn/quick_start/pricing",
    note: "缓存命中输入¥0.025/M；deepseek-reasoner将于2026-07-24弃用并映射为此模型思考模式",
  },
  {
    id: "kimi-k2.7-code",
    name: "Kimi K2.7 Code",
    vendor: "月之暗面",
    inputPerM: 6.5,
    outputPerM: 27,
    currency: "CNY",
    context: "262144",
    tier: "旗舰",
    cnDirect: true,
    sourceUrl: "https://platform.kimi.com/docs/pricing/chat-k27-code",
    note: "缓存命中输入¥1.30/M；同系列highspeed版输入¥13/输出¥54",
  },
  {
    id: "kimi-k2.6",
    name: "Kimi K2.6",
    vendor: "月之暗面",
    inputPerM: 6.5,
    outputPerM: 27,
    currency: "CNY",
    context: "262144",
    tier: "均衡",
    cnDirect: true,
    sourceUrl: "https://platform.kimi.com/docs/pricing/chat-k26",
    note: "缓存命中输入¥1.10/M；支持文本/图片/视频输入及思考/非思考模式",
  },
  {
    id: "gpt-5.4-mini",
    name: "GPT-5.4 mini",
    vendor: "OpenAI",
    inputPerM: 0.75,
    outputPerM: 4.5,
    currency: "USD",
    context: "—",
    tier: "轻量",
    cnDirect: false,
    sourceUrl: "https://developers.openai.com/api/docs/pricing",
    note: "",
  },
  {
    id: "gpt-5.4-nano",
    name: "GPT-5.4 nano",
    vendor: "OpenAI",
    inputPerM: 0.2,
    outputPerM: 1.25,
    currency: "USD",
    context: "—",
    tier: "轻量",
    cnDirect: false,
    sourceUrl: "https://developers.openai.com/api/docs/pricing",
    note: "",
  },
];

/** 统一换算为 CNY(估算),用于跨币种排序与计算器 */
export function toCny(value: number, currency: "USD" | "CNY"): number {
  return currency === "CNY" ? value : value * USD_CNY_RATE;
}

export function getModelPrice(id: string): ModelPrice | undefined {
  return MODEL_PRICES.find((m) => m.id === id);
}
