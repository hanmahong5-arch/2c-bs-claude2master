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
export const PRICES_AS_OF = "2026-07-02";

/** USD→CNY 估算汇率,仅用于同表排序与直观对比,页面须标注"估算" */
export const USD_CNY_RATE = 7.2;

