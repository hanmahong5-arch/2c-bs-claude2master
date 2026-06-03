export const meta = {
  name: 'c2m-elegance-audit',
  description: 'claude2master.com 全站优雅度审计: 6 维并行 read-only 审查 + 逐条对抗式验证 → 只留真问题',
  phases: [
    { title: 'Audit', detail: '6 维并行只读审查 (a11y/SEO/UX/正确性/内容/性能)' },
    { title: 'Verify', detail: '逐条对抗式验证, 读真代码确认, 默认怀疑' },
  ],
}

const ROOT = 'C:/Users/Anita/Desktop/lurus/2c-bs-claude2master'

const SHARED = `你在审查 claude2master.com 这个 Next.js 16 (App Router) + Bun + TS strict + Tailwind 4 + React 19 站点。
仓库根目录: ${ROOT}
这是面向中国大陆 Claude 用户的中文流量站, 把流量引流到 Lurus 产品 (newapi/forge/lutu)。核心页面:
  / (landing), /chat (在线试用), /prompts, /tutorials, /skills, /changelog (工具更新雷达), /weekly, /harness, /zh/[slug] (SEO 落地页), /subscribe, /about, /api-keys, /rank, /legal/*
关键 lib: src/lib/{tools,content,content-types,jsonld,rss,prompts,skills,tutorials,seo-landings,use-url-filter,date}.ts
最近刚做的改动 (请重点验证, 但不要只看它): 新增 src/lib/use-url-filter.ts (用 history.replaceState + popstate 把列表筛选存进 URL ?cat=/?tool=, 保留 SSG), 并改造了 ChangelogList/SkillsList/TutorialsList/PromptList 用它。

只读审查 —— 绝对不要编辑任何文件。用 Read/Grep/Glob 实际读代码后再下结论, 不要凭空猜。
只报告 **真正影响用户/SEO/正确性的问题**, 不要凑数、不要风格洁癖。每条给出: 准确的 file 路径 + 行号(若适用) + 具体可执行的修复建议 + 改动风险。
最多报告 5 条最有价值的发现 (按影响排序), 宁缺毋滥。`

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['dimension', 'findings'],
  properties: {
    dimension: { type: 'string' },
    findings: {
      type: 'array',
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'file', 'severity', 'description', 'suggestedFix', 'risk'],
        properties: {
          title: { type: 'string', description: '一句话问题标题' },
          file: { type: 'string', description: '相对仓库根的文件路径' },
          line: { type: 'string', description: '行号或行范围, 不确定填 ""' },
          severity: { type: 'string', enum: ['P0', 'P1', 'P2', 'nit'] },
          description: { type: 'string', description: '问题是什么 + 为什么是问题(对用户/SEO/正确性的实际影响)' },
          suggestedFix: { type: 'string', description: '具体怎么改' },
          risk: { type: 'string', description: '改动的风险/副作用' },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['isReal', 'confidence', 'reasoning', 'recommendedAction', 'fixComplexity'],
  properties: {
    isReal: { type: 'boolean', description: '读了真代码后, 这个问题是否真实存在且值得修' },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    reasoning: { type: 'string', description: '验证依据: 你读了哪个文件的哪几行, 证实或证伪了什么' },
    recommendedAction: { type: 'string', enum: ['fix-now', 'defer', 'wontfix'] },
    fixComplexity: { type: 'string', enum: ['trivial', 'small', 'medium', 'large'] },
  },
}

const DIMENSIONS = [
  {
    key: 'a11y',
    focus: `无障碍 (a11y): 语义化标签, aria-* 正确性, 键盘可达性 (焦点顺序/可见 focus ring), 表单 label 关联,
图标按钮的 aria-label, 颜色对比度 (注意 --color-text-muted/secondary 等 CSS 变量对 --lt-paper 的对比), 装饰性 emoji 是否 aria-hidden,
role/aria-live 用得对不对。重点扫 src/components 与各 page.tsx / List 组件。`,
  },
  {
    key: 'seo',
    focus: `SEO 与结构化数据: 每个路由的 metadata 完整性 (title/description/canonical/openGraph/twitter), JSON-LD 是否合法且类型恰当
(src/lib/jsonld.ts + 各 page 注入点), sitemap.ts 正确性 (lastModified 是否用了运行时 now 导致每次 build 都变=误报 daily 变更; prompts/skills 缺真实日期),
robots, h1 唯一性与标题层级, 内链。注意这是中文站 (inLanguage zh-CN)。`,
  },
  {
    key: 'ux',
    focus: `UX 与视觉优雅度: 空状态/加载态/错误态是否都有, 响应式断点 (移动端是否挤/溢出), hover/focus/active 反馈一致性,
间距与排版节奏, 筛选 pill 的交互 (含刚加的 URL 持久化: 深链进入有筛选时首屏是否闪一下全部再过滤——可接受但确认无布局跳动),
CTA 引流路径是否顺畅, 微交互 (framer-motion/Reveal) 是否过度或缺失。`,
  },
  {
    key: 'correctness',
    focus: `正确性与边界: 重点审 src/lib/use-url-filter.ts (SSR 安全/无 hydration mismatch/popstate 在 router 缓存复用时是否真生效/非法 ?cat= 回落/dflt 删参逻辑/edge: 多个 query 参数共存时 replaceState 是否丢掉别的参数),
雷达管线 scripts/radar/{fetch-trending.ts,summarize.ts,fetch-releases.sh} (去重/重试/slug 生成/state.json 原子性),
src/lib/rss.ts (XML 转义/非法字符), src/app/api/chat/route.ts (输入校验/超时/错误处理), content loader 排序与 cache()。找真 bug。`,
  },
  {
    key: 'content',
    focus: `内容与文案一致性: 8 工具文案是否处处对齐 (toolListCopy 用法), 是否有死链/占位链接/TODO, Anthropic disclaimer 是否在 Footer 存在 (CLAUDE.md 硬要求 "Not affiliated with Anthropic"),
CJK 排版 (中英文混排空格), 品牌一致性, prompt 库每条是否有 license/source (CLAUDE.md 要求只收 MIT/CC0/自创且附 source), 引流文案是否克制 (不堆民族主义)。`,
  },
  {
    key: 'perf',
    focus: `性能与组件边界: 不必要的 "use client" (能 server component 的别客户端化), client/server 边界是否合理, 字体加载 (next/font/local 配置), 图片优化 (next/image vs img),
大依赖/重复依赖, 数据加载瀑布 (content loader 是否并行), bundle 上的明显浪费, framer-motion 是否拖累首屏。`,
  },
]

phase('Audit')
log(`派出 ${DIMENSIONS.length} 个审查 agent, 各审一个维度...`)

const results = await pipeline(
  DIMENSIONS,
  (d) =>
    agent(
      `${SHARED}\n\n## 你负责的维度: ${d.key}\n${d.focus}`,
      { label: `audit:${d.key}`, phase: 'Audit', model: 'sonnet', schema: FINDINGS_SCHEMA },
    ),
  (audit, d) =>
    parallel(
      (audit?.findings ?? []).map((f) => () =>
        agent(
          `${SHARED}\n\n## 对抗式验证一条审查发现 (维度 ${d.key})\n` +
            `有人报告了下面这个问题。你的任务是**默认怀疑**, 去读真代码 (用 Read 打开 ${f.file}${f.line ? ' 第 ' + f.line + ' 行附近' : ''} 及相关文件) 来证实或证伪。\n` +
            `如果无法在代码里确认, 或它只是风格偏好/不影响用户, 判 isReal=false。只有真实、值得修的才 isReal=true + fix-now。\n\n` +
            `问题标题: ${f.title}\n严重度(报告者自评): ${f.severity}\n文件: ${f.file} ${f.line}\n` +
            `描述: ${f.description}\n建议修复: ${f.suggestedFix}\n风险: ${f.risk}`,
          { label: `verify:${d.key}:${f.file}`, phase: 'Verify', model: 'sonnet', schema: VERDICT_SCHEMA },
        ).then((v) => ({ ...f, dimension: d.key, verdict: v })),
      ),
    ),
)

const all = results.flat().filter(Boolean)
const confirmed = all.filter((f) => f.verdict?.isReal && f.verdict?.recommendedAction === 'fix-now')
const deferred = all.filter((f) => f.verdict?.isReal && f.verdict?.recommendedAction === 'defer')

log(`验证完成: ${all.length} 条发现, 确认需修 ${confirmed.length}, 建议延后 ${deferred.length}`)

return {
  confirmedFixNow: confirmed.sort((a, b) => {
    const order = { P0: 0, P1: 1, P2: 2, nit: 3 }
    return (order[a.severity] ?? 9) - (order[b.severity] ?? 9)
  }),
  deferred,
  rejectedCount: all.length - confirmed.length - deferred.length,
}
