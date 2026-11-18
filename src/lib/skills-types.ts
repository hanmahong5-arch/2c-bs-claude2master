export type SkillCategory =
  | "代码"
  | "设计"
  | "写作"
  | "数据"
  | "运维"
  | "生产力";

export const SKILL_CATEGORIES: SkillCategory[] = [
  "代码",
  "设计",
  "写作",
  "数据",
  "运维",
  "生产力",
];

export type SkillSource = "Anthropic" | "Lurus 出品" | "Lurus 编辑部";

export interface Skill {
  slug: string;
  category: SkillCategory;
  title: string;
  desc: string;
  source: SkillSource;
  sourceUrl?: string;
  installCmd?: string;
  triggerHint: string;
  readme?: string;
  tags?: string[];
}

export const INSTALL_LURUS = (slug: string) =>
  `# Lurus 出品 — 国内镜像，建议克隆到全局 skill 目录\nmkdir -p ~/.claude/skills/${slug}\n# 内部团队从 Lurus monorepo .claude/skills/${slug}/ 复制\n# 或 ssh root@100.98.57.55 拉一份 tarball`;

export const INSTALL_DEMO = (slug: string) =>
  `# Lurus 编辑部 demo skill — 复制下文 SKILL.md 到本地\nmkdir -p ~/.claude/skills/${slug}\n# 把 README 里的 SKILL.md 内容粘贴到:\n#   ~/.claude/skills/${slug}/SKILL.md`;

