// modelKey: prompt 的内部档位标注, 不对用户展示模型名。
// 模型选择器已移除、卡片不再显示模型档 → 此字段当前为休眠元数据(可后续按任务类型重命名/移除)。
export type ModelKey = "haiku" | "sonnet" | "opus";

export type PromptCategory =
  | "写作"
  | "编程"
  | "翻译"
  | "学习"
  | "营销"
  | "数据分析"
  | "角色扮演";

export const PROMPT_CATEGORIES: PromptCategory[] = [
  "写作",
  "编程",
  "翻译",
  "学习",
  "营销",
  "数据分析",
  "角色扮演",
];

export interface Prompt {
  slug: string;
  category: PromptCategory;
  modelKey: ModelKey;
  title: string;
  desc: string;
  body: string;
  source: string;
  /** 许可: 仅收 MIT / CC0 / 自创 */
  license: "MIT" | "CC0" | "CC-BY-4.0" | "original";
  tags?: string[];
}

