// service-access.ts — 主流 AI 服务大陆访问性对照表(单一信息源)
//
// 定位: 回答目标用户第一诉求「Claude / ChatGPT / Gemini 大陆能用吗、要不要代理、官方支不支持大陆账号」。
// 诚实约束(重要):
// - 可达性值是 c2m 编辑部依公开情况整理的**参考**, 非实时网络探测(部署环境无法从大陆出口探测);
// - 措辞中性: "需代理" = 大陆网络下通常需借助代理才能稳定访问, 不对成因下定论;
// - 网络策略与各服务政策会变, 页面必须展示 ACCESS_AS_OF + "以实际为准";
// - sourceUrl 指向服务官方站点(供跳转核对), 不代表对可达性的官方声明。

/** 大陆访问性: 直连 / 需代理 */
export type Reach = "direct" | "proxy";

export type AccessCategory = "海外主力" | "国产直连";

export const ACCESS_CATEGORIES: AccessCategory[] = ["海外主力", "国产直连"];

export interface ServiceAccess {
  /** kebab-case 唯一 id, 做行 key */
  id: string;
  /** 服务展示名 */
  name: string;
  /** 提供方中文 */
  vendor: string;
  category: AccessCategory;
  /** 官网 / App 大陆访问 */
  webAccess: Reach;
  /** 官方 API 大陆访问 */
  apiAccess: Reach;
  /** 官方是否支持大陆账号 / 结算 */
  officialCn: boolean;
  /** 海外模型能否经国内直连网关中转调用(引流钩子; 国产已直连记 false) */
  viaGateway: boolean;
  /** 补充说明 */
  note: string;
  /** 官方站点 URL */
  sourceUrl: string;
  tags: string[];
}

/** 数据整理日期 — 更新 SERVICES 时必须同步更新 */
export const ACCESS_AS_OF = "2026-07-03";

export const SERVICES: ServiceAccess[] = [
  // ── 海外主力 ──
  {
    id: "claude",
    name: "Claude",
    vendor: "Anthropic",
    category: "海外主力",
    webAccess: "proxy",
    apiAccess: "proxy",
    officialCn: false,
    viaGateway: true,
    note: "官网 claude.ai 与官方 API 对大陆 IP 均有地域限制, 通常需稳定代理; 订阅需境外支付方式。",
    sourceUrl: "https://claude.com",
    tags: ["对话", "编码", "API"],
  },
  {
    id: "chatgpt",
    name: "ChatGPT / OpenAI",
    vendor: "OpenAI",
    category: "海外主力",
    webAccess: "proxy",
    apiAccess: "proxy",
    officialCn: false,
    viaGateway: true,
    note: "网页版与 API 大陆均需代理; OpenAI 未对大陆开放官方账号与结算。",
    sourceUrl: "https://openai.com",
    tags: ["对话", "API"],
  },
  {
    id: "gemini",
    name: "Gemini",
    vendor: "Google",
    category: "海外主力",
    webAccess: "proxy",
    apiAccess: "proxy",
    officialCn: false,
    viaGateway: true,
    note: "gemini.google.com 与 Google AI API 大陆均需代理; 未对大陆地区开放。",
    sourceUrl: "https://gemini.google.com",
    tags: ["对话", "API"],
  },
  {
    id: "grok",
    name: "Grok",
    vendor: "xAI",
    category: "海外主力",
    webAccess: "proxy",
    apiAccess: "proxy",
    officialCn: false,
    viaGateway: true,
    note: "grok.com 与 xAI API 大陆均需代理。",
    sourceUrl: "https://x.ai",
    tags: ["对话", "API"],
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    vendor: "GitHub",
    category: "海外主力",
    webAccess: "proxy",
    apiAccess: "proxy",
    officialCn: false,
    viaGateway: false,
    note: "GitHub 主站大陆可达但常不稳; Copilot 服务与登录环节通常需代理才顺畅; 属订阅制, 非通用 API 网关可替代。",
    sourceUrl: "https://github.com/features/copilot",
    tags: ["编码", "订阅"],
  },
  {
    id: "perplexity",
    name: "Perplexity",
    vendor: "Perplexity",
    category: "海外主力",
    webAccess: "proxy",
    apiAccess: "proxy",
    officialCn: false,
    viaGateway: true,
    note: "网页与 API 大陆均需代理。",
    sourceUrl: "https://www.perplexity.ai",
    tags: ["搜索", "对话", "API"],
  },

  // ── 国产直连 ──
  {
    id: "deepseek",
    name: "DeepSeek",
    vendor: "深度求索",
    category: "国产直连",
    webAccess: "direct",
    apiAccess: "direct",
    officialCn: true,
    viaGateway: false,
    note: "网页、App 与官方 API 大陆直连; 人民币结算; 编码性价比高。",
    sourceUrl: "https://www.deepseek.com",
    tags: ["对话", "编码", "API", "直连"],
  },
  {
    id: "qwen",
    name: "通义千问 Qwen",
    vendor: "阿里云",
    category: "国产直连",
    webAccess: "direct",
    apiAccess: "direct",
    officialCn: true,
    viaGateway: false,
    note: "百炼平台 API 大陆直连; 旗舰 Qwen3.7-Max 及全系可人民币结算。",
    sourceUrl: "https://qwen.ai",
    tags: ["对话", "编码", "API", "直连"],
  },
  {
    id: "kimi",
    name: "Kimi",
    vendor: "月之暗面",
    category: "国产直连",
    webAccess: "direct",
    apiAccess: "direct",
    officialCn: true,
    viaGateway: false,
    note: "网页与官方 API 大陆直连; K2 系列长上下文与编码见长。",
    sourceUrl: "https://www.kimi.com",
    tags: ["对话", "编码", "API", "直连"],
  },
  {
    id: "glm",
    name: "智谱 GLM",
    vendor: "智谱",
    category: "国产直连",
    webAccess: "direct",
    apiAccess: "direct",
    officialCn: true,
    viaGateway: false,
    note: "bigmodel.cn 开放平台大陆直连; 海外另有 Z.AI 站点。",
    sourceUrl: "https://www.bigmodel.cn",
    tags: ["对话", "编码", "API", "直连"],
  },
  {
    id: "doubao",
    name: "豆包",
    vendor: "字节·火山引擎",
    category: "国产直连",
    webAccess: "direct",
    apiAccess: "direct",
    officialCn: true,
    viaGateway: false,
    note: "火山方舟 API 大陆直连; 综合调用成本低。",
    sourceUrl: "https://www.doubao.com",
    tags: ["对话", "API", "直连"],
  },
  {
    id: "wenxin",
    name: "文心一言",
    vendor: "百度",
    category: "国产直连",
    webAccess: "direct",
    apiAccess: "direct",
    officialCn: true,
    viaGateway: false,
    note: "网页与千帆平台 API 大陆直连。",
    sourceUrl: "https://yiyan.baidu.com",
    tags: ["对话", "API", "直连"],
  },
];
