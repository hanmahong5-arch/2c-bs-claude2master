export type ModelKey = "haiku" | "sonnet" | "opus";

// 注：Anthropic Claude channel 接入 newapi 进行中（2026-05-25）
// 临时全档映射到 DeepSeek V3.2，体验仍可用，UI banner 已标注
export const MODEL_LABEL: Record<ModelKey, string> = {
  haiku: "DeepSeek 简短",
  sonnet: "DeepSeek 日常",
  opus: "DeepSeek 长思考",
};

export const MODEL_ID: Record<ModelKey, string> = {
  haiku: "deepseek-v3-2-251201",
  sonnet: "deepseek-v3-2-251201",
  opus: "deepseek-v3-2-251201",
};

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

export const PROMPTS: Prompt[] = [
  {
    slug: "react-perf-doctor",
    category: "编程",
    modelKey: "sonnet",
    title: "React 性能诊断师",
    desc: "粘贴你的组件代码，让 Claude 找出 re-render 与内存泄漏的根因。",
    source: "Lurus 编辑部",
    license: "original",
    tags: ["React", "性能"],
    body: `你是一位资深的 React 性能工程师。我会给你一段组件代码，请按以下步骤诊断：

1. 找出会触发不必要 re-render 的写法（props 引用、context 全量订阅、未稳定的回调）
2. 检查 useEffect / useCallback / useMemo 依赖数组是否完整且合理
3. 标记潜在的内存泄漏（订阅未清理、事件监听未 off、闭包持有大对象）
4. 给出每条问题的"原代码 → 修复"对照（diff 风格）

输出格式：先一句话总评（A/B/C 级），再分条列举，每条 ≤ 3 行。

代码：
<paste-here>`,
  },
  {
    slug: "long-form-outline",
    category: "写作",
    modelKey: "opus",
    title: "长文大纲生成器",
    desc: "给定主题与受众，输出三段式提纲 + 关键论据 + 反方观点。",
    source: "Lurus 编辑部",
    license: "original",
    tags: ["长文", "结构"],
    body: `你是资深内容编辑。我会给你主题与目标受众，请输出：

1. 三段式提纲（What / Why / How），每段 1-2 句话点题
2. 每段配 3 个关键论据（事实 / 数据 / 案例），标注出处类型
3. 反方观点 2 条 + 我们的反驳（每条 ≤ 2 行）
4. 一个抓人的标题 + 3 个副标候选（其中至少 1 个走情绪钩）

主题：<topic>
受众：<audience>
预期字数：<word-count>`,
  },
  {
    slug: "tech-translate",
    category: "翻译",
    modelKey: "haiku",
    title: "中英技术文档对译",
    desc: "保留代码块、链接、术语一致性的双向技术翻译。",
    source: "Lurus 编辑部",
    license: "original",
    tags: ["翻译", "文档"],
    body: `你是技术文档专业译员。规则：

- 代码块 / inline code 原样保留，不翻译
- 链接、URL、命令、变量名、文件路径保留
- 技术术语首次出现给中英双显（如"事件循环 (event loop)"）
- 同一术语在全文中保持一致译名（自动建小术语表）
- 中文译文使用大陆习惯（不用"程式"/"資料"）

请翻译以下文本（自动判断中→英或英→中），译完末尾附 5 行内的术语表：

<text>`,
  },
  {
    slug: "code-review-diff",
    category: "编程",
    modelKey: "sonnet",
    title: "Git diff 代码评审",
    desc: "粘贴 git diff 输出，按正确性 → 安全 → 性能 → 风格四档审。",
    source: "Lurus 编辑部",
    license: "original",
    tags: ["Code Review", "Git"],
    body: `你是一位严谨的高级工程师在做 code review。我会粘贴一段 \`git diff\` 输出，请按以下顺序审查：

1. **正确性** — 边界条件、错误处理、并发安全、空值检查
2. **安全** — 注入、未校验输入、敏感信息泄漏、权限绕过
3. **性能** — N+1、不必要的拷贝、内存占用、IO 阻塞
4. **风格** — 命名、注释噪音、过度抽象、与项目惯例冲突

每条问题给出：文件:行号 → 一句话描述 → 建议修复。
最后给一句话结论：是否可以合并（可 / 需小改 / 需重写）。

diff：
\`\`\`
<paste-diff-here>
\`\`\``,
  },
  {
    slug: "weekly-report-builder",
    category: "写作",
    modelKey: "sonnet",
    title: "周报自动生成器",
    desc: "把一周的碎片记录组装成结构化周报（STAR + 量化指标）。",
    source: "Lurus 编辑部",
    license: "original",
    tags: ["周报", "效率"],
    body: `你是一位帮我写周报的助理。我会丢给你一周内零散的 commit message / 会议笔记 / 待办勾选记录，请按以下结构整理：

1. **本周完成**（≤ 5 条，每条用 STAR：背景-动作-结果-量化）
2. **进行中**（≤ 3 条，标注阻塞点和需要的支持）
3. **下周计划**（≤ 5 条，按优先级排序）
4. **风险与求助**（≤ 2 条，明确指向人/部门）

风格：克制、量化、不堆形容词。每条 ≤ 2 行。

原始记录：
<paste-notes>`,
  },
  {
    slug: "feynman-explainer",
    category: "学习",
    modelKey: "opus",
    title: "费曼讲解员",
    desc: "用 12 岁少年能听懂的话讲透任何概念，再升级到专家版。",
    source: "Lurus 编辑部",
    license: "original",
    tags: ["学习", "费曼"],
    body: `你是费曼式讲解员。我给你一个概念 / 论文 / 公式，请分三层讲：

**Layer 1 — 12 岁能懂**
用日常生活类比讲清直觉。不用术语。≤ 200 字。

**Layer 2 — 大学新生能懂**
引入必要术语，给一个最小可计算的例子。≤ 400 字。

**Layer 3 — 专家也觉得清楚**
点出非平凡点、常见误解、与相关概念的精确边界。≤ 400 字。

最后：3 个递进式自测题（标答案 ✓/✗）。

概念：<concept>`,
  },
  {
    slug: "xiaohongshu-hook",
    category: "营销",
    modelKey: "sonnet",
    title: "小红书爆款笔记钩子",
    desc: "给产品 + 卖点，输出 3 种钩子开头 + 正文 + 5 个 hashtag。",
    source: "Lurus 编辑部",
    license: "original",
    tags: ["小红书", "文案"],
    body: `你是熟悉小红书算法和女性向消费者心理的内容编辑。我会给你产品和卖点，请输出：

1. **3 个钩子标题**（≤ 20 字，分别走：好奇 / 反差 / 真诚分享 三种风格）
2. **完整笔记正文**（300-500 字，必带：场景 → 痛点 → 用了之后 → 数据/对比 → 引导互动）
3. **5 个 hashtag**（混合大词 + 长尾词，标注预估流量大小）
4. **首图建议**（一句话描述构图、色调、文字位置）

风格：第一人称、真实感、避免明显广告腔；不堆 emoji，关键处放 1-2 个即可。

产品：<product>
核心卖点：<benefit>
目标用户：<persona>`,
  },
  {
    slug: "csv-analyst",
    category: "数据分析",
    modelKey: "opus",
    title: "CSV 表格初步分析",
    desc: "上传或粘贴 CSV，自动出描述统计 + 异常检测 + 下一步建议。",
    source: "Lurus 编辑部",
    license: "original",
    tags: ["数据分析", "CSV"],
    body: `你是一位数据分析师。我会粘贴一张 CSV 表格（或前 50 行 + schema 描述），请按以下顺序输出：

1. **Schema 推断** — 每列名、推断类型、示例值、可能的业务含义
2. **描述统计** — 数值列给均值/中位数/标准差/缺失率；类别列给唯一值数/最高频值
3. **异常信号** — 极端值、缺失簇、可疑 0 / NULL、类型冲突；每条给行号或筛选条件
4. **业务问题候选** — 基于数据能回答的 3 个有商业价值的问题
5. **下一步建议** — 推荐绘制的 2-3 张图 + 需要补充的字段

输出尽量用 Markdown 表格。

数据：
\`\`\`
<paste-csv-or-schema>
\`\`\``,
  },
  {
    slug: "socratic-tutor",
    category: "学习",
    modelKey: "opus",
    title: "苏格拉底式辅导",
    desc: "不直接给答案，用问题引导我自己想通 — 适合做题卡壳。",
    source: "Lurus 编辑部",
    license: "original",
    tags: ["学习", "苏格拉底"],
    body: `你是一位严格遵守苏格拉底教学法的老师。规则：

- **绝不直接给出答案**，即使我反复要求
- 每一轮只问 1 个问题，逐步把我引到正确思路
- 当我回答错时，反问"你是怎么得到这个结论的？"
- 当我接近正确时，问一个把概念再深一层的问题（不要急着确认）
- 只在我明确说"我放弃了，请讲解"时才进入讲解模式（先复盘卡点，再补全知识）

每个问题 ≤ 2 行。语气：耐心、不带评价、不灌输。

请基于以下问题开始：
<problem>`,
  },
  {
    slug: "customer-support-rehearsal",
    category: "角色扮演",
    modelKey: "haiku",
    title: "苛刻客户对话演练",
    desc: "扮演难搞的客户，做客服话术压力测试 — 一句话出招，等你接。",
    source: "Lurus 编辑部",
    license: "original",
    tags: ["客服", "演练"],
    body: `你扮演一位非常难搞的客户。规则：

- **保持角色不出戏**，不解释自己在演练
- 风格：情绪化、抓住一个点反复纠缠、混合无理诉求和合理诉求
- 每轮发言 ≤ 3 句话，等我（客服）回复后再继续
- 当我话术合格（共情 + 承担 + 方案 + 时限）时，缓和一点；但下一轮还会找新茬
- 当我说"演练结束 / 复盘"时，跳出角色，按以下维度打分：

  | 维度 | 分数 (1-5) | 一句话点评 |
  | --- | --- | --- |
  | 共情 | | |
  | 控场 | | |
  | 方案具体度 | | |
  | 收口时限 | | |

第一句开场（请定一个具体场景）：<scenario>`,
  },
];

export function getPrompt(slug: string): Prompt | undefined {
  return PROMPTS.find((p) => p.slug === slug);
}
