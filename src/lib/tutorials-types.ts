export type TutorialCategory =
  | "入门"
  | "配置"
  | "Skills"
  | "Hooks"
  | "MCP"
  | "工作流";

export const TUTORIAL_CATEGORIES: TutorialCategory[] = [
  "入门",
  "配置",
  "Skills",
  "Hooks",
  "MCP",
  "工作流",
];

export interface Tutorial {
  slug: string;
  category: TutorialCategory;
  title: string;
  desc: string;
  read: string;
  date: string;
  pinned?: boolean;
  body: string;
}

