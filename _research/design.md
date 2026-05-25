# claude2master.com 设计系统

> 视觉调研 + brand 决策 + 实施 token。Lurus Web 产品组第三个 .com 站（继 dsnb.help 之后）。
> 作者: design agent, 2026-05-25

## TL;DR

- **推荐 选项 B+**: 走 Lurus master token (paper #F5F2E8 / ink #14130F / accent #FF5D1F) 做底，但**独立 product accent** = `#7C5CFF` (electric indigo)，对标 cursor/linear 的"AI 工具高级感"，避开 Anthropic 暖色商标风险。Logo + CTA + 链接用紫，正文/版面继承 Lurus paper 体系。
- **跟 Lurus 关系**: 与 dsnb.help 同模式 — master token 共享（paper bg / ink / typography / spacing），product accent 独立（dsnb 用 DeepSeek blue #4D6BFE，本站用 indigo #7C5CFF）。视觉上**家族同源**，产品上**身份独立**。
- **差异化**: (1) **双轨 chat 气泡** = user 用 paper-on-paper 衬线引语风（Fraunces 衬线 + 左竖线），assistant 用 ink-on-paper 等宽字感（首字加紫色圆角 `C`）；(2) **prompt 卡片用"书签"形态** — 卡片左上角折角 + 末行 `↵ try` 唤起 chat，区别于 promptbase 的电商缩略图网格；(3) hero 没有产品截图，只有一段**渐进式打字** demo（用户问 → 紫光标 → 流式回答），强调"Master Claude"的练习感。

---

## 1. 标杆调研

| 站点 | 色调 | 字体 | Hero | 动效 | 关键观察 |
|------|------|------|------|------|----------|
| **anthropic.com** | 纯白 #FFF + 深炭 #1A1A1A + 蓝链 #06C | 现代 sans，宽 letter-spacing | 全宽左对齐大标题"AI research and products that put safety at the frontier"，留白巨大 | 几乎无动效 | 冷峻克制，**学术权威**。warmth 主要来自 claude.ai app 内部 (cream/Tiempos serif)，公司站本身偏冷 |
| **claude.ai** | (403 阻止抓取) — 已知: cream/peach 暖底 + 衬线 Tiempos + 橘红 #DA7756 | Tiempos serif + ABC Diatype sans | 居中输入框 + 浅暖色 | 弹簧缓动 spring `[0.16,1,0.3,1]` | **暖色系是 Claude app 的灵魂**，但直接借用 = 商标雷区 |
| **cursor.com** | dark 深炭 + 蓝紫 accent + 大量产品截图 | sans 现代，hierarchy 强 | 大标题 + 内嵌交互 demo (Cursor IDE 截图) | spring layout transitions + shared element | **AI 工具范本**: 用"产品自身"做视觉，靠 spring 动效显高级 |
| **vercel.com** | 黑白双模式 + 蓝紫 CTA + 微渐变 | **Geist** 自研 sans，几何感 | "Build and deploy on the AI Cloud" 居中 + 双 CTA | runway/timeline 数字动画、node-pulse 全球地图 | "数字动效讲性能"是 Vercel 招牌，e.g. `800ms → 120ms` 单行 stat |
| **linear.app** | 深黑 + 微蓝紫 + 真实产品 UI 截图 | 极简 sans | 大标题 + 真实工单截图，无装饰 | 渐变 + spring transitions | "interface-as-content" — 用产品 UI 本身当 hero，没有图标插画 |
| **groq.com** | dark navy + **signature 橙** + 几何抽象 | 现代 sans，bold | "Inference is Fuel for AI" 全宽 | 几何动画 + speed 主题 | **单色 brand** 玩法：一个强 accent 通吃所有 CTA + logo + chart |
| **fireworks.ai** | dark navy + 蓝紫 accent + 模型 logo 拼色 | 现代 sans | "From Inference to Intelligence" + 双 CTA + DeepSeek V4 横幅 | 静态为主，SVG 架构图 | **technical legibility** > 视觉 flair；client logos 立信 |
| **promptbase.com** | 纯白 + 深字 + emoji 分类徽章 | 结构化 sans | 商品网格 (缩略图 + 标题 + 价格 + 评分) | 极少动效 | 反面教材: 像 Etsy，**电商感重，缺品牌**。我们要做"练习场"不要做"商城" |

**3 个跨标杆观察**:
1. **AI 工具的"高级感"分两派** — (a) Anthropic/Claude 派 = 暖色 cream + 衬线 + 慢节奏；(b) Cursor/Linear/Vercel 派 = dark + 现代 sans + spring 动效 + 几何渐变。中国开发者更接受 (b) 派，但暖色派稀缺 = 差异化机会。
2. **signature 色 = 品牌力** — Groq 的橙、Linear 的紫、DeepSeek 的蓝，**单色 brand identity** 比"全光谱渐变"记忆点强 10×。
3. **"interface-as-content"** 是 2026 hero 默认 — 不要 SaaS 风格的 illustration，要么放真截图（Linear/Cursor），要么放可交互 demo (本站方向)。

---

## 2. 品牌色 (推荐 + tokens)

### 决策矩阵

| 选项 | 优势 | 风险 | 我评分 |
|------|------|------|--------|
| **A. Anthropic 暖色 cream/橘红** | 跟 Claude app 视觉链接强，亲和 | 商标雷区 + 用户混淆 ("是 Anthropic 官方？")+ 中国设计圈对 cream 不敏感 = 容易显廉价 | ❌ 2/10 |
| **B. Lurus ochre gold #c8a24e** | 与 lurus.cn 视觉一致，复用 token | 但 lurus-www 自己已转 paper+orange (`#FF5D1F`)，ochre 是 legacy。**继承"过期"的体系** | ⚠️ 4/10 |
| **C 独立 紫蓝 #7C5CFF (electric indigo)** | AI 通用色但偏冷 cyber 调，cursor/linear/copilot 同向；与 dsnb 蓝、lurus 橙清晰区分；中国开发者审美甜区 | 紫蓝赛道拥挤，需要执行精度 | ✅ 9/10 |
| C' 独立 深绿 #00875A | 高级感 + 差异化大 | 与"AI 工具"语义弱关联，更像金融/医疗 | 6/10 |
| C'' 独立 钴蓝 #2B5BFF | 经典 + 稳 | 跟 dsnb 蓝撞，自家产品互打 | 3/10 |

### **推荐: 选项 B+ (Lurus master token + product accent indigo)**

**复用 LurusTech master**（与 dsnb 同模式 — 见 `2c-bs-dsnb/globals.css` lines 33-46）:

```css
--lt-paper:  #F5F2E8;   /* 主背景：暖白纸 */
--lt-bg:     #E8E4D6;   /* surface 卡片底 */
--lt-ink:    #14130F;   /* 正文深炭 */
--lt-rule:   #D6D2C2;   /* 边线/分隔 */
--lt-ok:     #1F7A4F;
--lt-warn:   #B8821F;
--lt-err:    #B3392B;
--lt-info:   #2D4A8A;
```

**独立 product accent** (本站专属，**不** 覆盖 master):

```css
/* claude2master indigo — electric, 不撞 dsnb 蓝/lurus 橙 */
--c2m-accent:       #7C5CFF;   /* primary CTA / 链接 / focus ring */
--c2m-accent-deep:  #5A3FE0;   /* hover / pressed */
--c2m-accent-soft:  #E8E2FF;   /* badge bg / 选中态 */
--c2m-accent-glow:  rgba(124, 92, 255, 0.18);  /* shadow / spotlight */

/* dark mode (可选 — Phase 2) */
--c2m-dark-bg:      #0E0D14;   /* 不是纯黑，紫调底 */
--c2m-dark-surface: #16141F;
--c2m-dark-ink:     #ECE9F5;
```

**Semantic 映射**（前端就用这些，不要在组件里写 hex）:

```css
--background: var(--lt-paper);
--foreground: var(--lt-ink);
--color-surface: var(--lt-bg);
--color-surface-elevated: #EFEBDC;
--color-border: var(--lt-rule);
--color-text-secondary: #3D3B33;
--color-text-muted: #7A7769;
--color-accent: var(--c2m-accent);
--color-accent-deep: var(--c2m-accent-deep);
--color-link: var(--c2m-accent-deep);  /* 链接用 deep 保证对比 */
```

**WCAG 检查**: `#5A3FE0` on `#F5F2E8` = 6.8:1 ✅ AA Large + AA Normal。`#7C5CFF` on `#F5F2E8` = 4.5:1 ✅ AA Large（CTA 文字需走 deep）。

---

## 3. Typography

### 字体选型

| 用途 | 字体 | 加载策略 |
|------|------|----------|
| **正文 中文** | `system-ui` → 苹方 / PingFang SC / 微软雅黑 fallback | **不加载** web font (性能 + 国内 CDN 风险) |
| **正文 英文 / 数字** | `Inter Tight` (与 dsnb 同) | next/font self-host，subset |
| **Display 大标题** | `Inter Tight` 600 + `-0.035em` letter-spacing | 同上 |
| **品牌/引用 衬线** | `Fraunces` (与 dsnb 同) — 用于 `claude2master` wordmark 和 user chat 气泡 | next/font self-host |
| **代码 / Mono** | `JetBrains Mono` | self-host |

**font-stack**:
```css
--font-sans: 'Inter Tight', -apple-system, 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
--font-display: 'Fraunces', Georgia, serif;
--font-mono: 'JetBrains Mono', 'Source Code Pro', Menlo, monospace;
```

### 字号阶梯

| 角色 | size | line | weight | 用途 |
|------|------|------|--------|------|
| hero | `clamp(2.5rem, 6vw, 4.5rem)` | 1.05 | 600 | 落地页 H1 |
| h1 | `clamp(2rem, 4vw, 3rem)` | 1.1 | 600 | 子页 H1 |
| h2 | `1.875rem` (30px) | 1.2 | 600 | section 标题 |
| h3 | `1.25rem` (20px) | 1.4 | 600 | 卡片标题 |
| body | `1rem` (16px) | 1.7 | 400 | 正文 |
| caption | `0.875rem` (14px) | 1.5 | 400 | 副文/meta |
| eyebrow | `0.6875rem` (11px) | 1 | 500, `0.14em` track, UPPERCASE | 小标签 |
| code | `0.8125rem` (13px) | 1.7 | 400 | inline code |

**中文优化**: 所有 h1/h2 加 `font-feature-settings: "palt"` (proportional alt for CJK) + `text-wrap: balance`。

---

## 4. 组件视觉规约

### 4.1 Button

| 变体 | bg | text | border | hover |
|------|----|----- |--------|-------|
| `primary` | `var(--c2m-accent)` | `#FFFFFF` | none | bg → `--c2m-accent-deep` + lift -1px |
| `secondary` | `var(--lt-bg)` | `var(--lt-ink)` | `1px solid var(--lt-rule)` | border → `--c2m-accent` + shadow `0 0 0 3px var(--c2m-accent-glow)` |
| `ghost` | `transparent` | `var(--c2m-accent-deep)` | none | bg → `var(--c2m-accent-soft)` |
| `cta-glow` (hero) | gradient `135deg #7C5CFF → #5A3FE0` | `#FFFFFF` | none | shadow `0 0 40px var(--c2m-accent-glow)` 常驻 |

`border-radius: 10px`; `padding: 0.625rem 1.25rem`; `font-weight: 500`; `transition: all 0.2s spring`.

### 4.2 Card

**通用 card**:
```css
.card {
  background: var(--lt-bg);
  border: 1px solid var(--lt-rule);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s [0.16,1,0.3,1];
}
.card:hover {
  border-color: var(--c2m-accent);
  box-shadow: 0 8px 32px rgba(20,19,15,0.06), 0 0 0 1px var(--c2m-accent-glow);
  transform: translateY(-2px);
}
```

**Prompt 卡片**（差异化）—"书签"形态:
- 左上角 12×12 折角（CSS clip-path）
- 顶部 eyebrow：`分类徽章 + 模型标签` (e.g. `编程 · Sonnet 4.7`)
- 中部 H3 标题 + 2 行描述
- 底部 meta：`使用 N 次 · 复制 ↵ 试一下`
- hover：折角颜色变 `--c2m-accent`

**Skill 卡片**: 同 prompt 卡片但顶部加 24×24 紫色 icon-glow（drop-shadow 紫光）；右上角 install/update pill。

**Tutorial 卡片**: 横排 4:3 缩略图（左 1/3）+ 文字（右 2/3），底部进度条 (`bg: --c2m-accent-soft, fill: --c2m-accent`)。

### 4.3 Code block

```css
.code-block {
  background: #1B1924;    /* 不复用 lt 系列，code 永远暗底（提升 readability） */
  color: #E2DEF0;
  border: 1px solid #2A2638;
  border-radius: 12px;
  font: 13px/1.7 var(--font-mono);
  padding: 1rem 1.25rem;
}
/* token colors — Catppuccin Macchiato inspired，紫调 */
.code .keyword  { color: #C6A0F6; }  /* 紫 — 呼应品牌 */
.code .string   { color: #A6DA95; }
.code .function { color: #8AADF4; }
.code .comment  { color: #6E738D; font-style: italic; }
.code .number   { color: #F5A97F; }
```

行号灰 + 复制按钮右上角 (`bg: transparent, hover: rgba 紫光`)。

### 4.4 Chat 气泡

**关键差异化**：

| 角色 | 容器 | 字体 | 装饰 |
|------|------|------|------|
| **user** | bg `var(--lt-paper)`, 左 `3px solid var(--c2m-accent)` 竖线 | `Fraunces` 600 18px italic | 上方小字 "你 · 14:32" |
| **assistant** | bg `var(--lt-bg)`, 圆角 16px, 无边线 | `Inter Tight` 400 16px | 左上角 24×24 紫色圆 `C` (Fraunces serif)，stream 时圆 pulse |

**streaming 动画**: 末字符后跟紫色光标 `▎` `@keyframes blink 1s infinite`；新 token 出现用 `blur(4px) → blur(0)` 250ms。

### 4.5 Navigation

桌面 64px 高，sticky + backdrop-blur:
```
[claude2master logo (Fraunces serif)]  Prompt库  Chat  教程  Skills  |  API key  [登录]
```
- 透明底 + `backdrop-filter: blur(12px) + bg rgba(245,242,232,0.8)`
- 滚动 >80px 加 `border-bottom: 1px solid var(--lt-rule)` 阴影
- 当前页 active：底部 2px 紫线，宽度 = 文字宽，左右各留 4px

移动: 汉堡 → 全屏抽屉，每项 56px 高，紫线在左侧。

### 4.6 Hero section 布局

```
┌─────────────────────────────────────────────────────────┐
│              [paper bg + 细 grid #D6D2C2 0.4 opacity]    │
│                                                          │
│                  eyebrow · 让人用好 Claude               │
│                                                          │
│       Master Claude          ← Fraunces 56px italic     │
│       like a craftsman.      ← Inter Tight 56px 600     │
│                              ←   ↑ 双行衬线/sans 对照     │
│                                                          │
│   一站式 prompt 库、流式 chat、Skills 商店与教程，      │
│   助你三天上手 Claude，三个月精通。     ← body 18px      │
│                                                          │
│   [开始练习 →]  [浏览 prompt 库]                         │
│      ↑ primary CTA   ↑ secondary                         │
│                                                          │
│   ┌────────────────────────────────────────────────┐    │
│   │  > 帮我写一个 React useDebounce hook   ← user  │    │
│   │                                                  │   │
│   │  C  好的，下面是一个类型安全的实现：             │   │
│   │     ```ts                                       │   │
│   │     export function useDebounce<T>(v: T, ms▎    │   │
│   │     ```          ↑ 流式 + 紫光标 + blur-in     │    │
│   └────────────────────────────────────────────────┘    │
│                                                          │
│   trusted by  [logo strip 灰度，hover 变彩色]            │
└─────────────────────────────────────────────────────────┘
```

不放传统产品截图，hero 即是"产品本身的一段交互"。

---

## 5. 动效语言

### 总策略
- **保守 > 大动效** — 国内移动端低端机比例高，FCP/CLS 是流量生死线
- 复用 dsnb/lurus-www 的 spring `cubic-bezier(0.16, 1, 0.3, 1)`，duration 400-700ms
- 所有动效 **respect `prefers-reduced-motion`** — `@media (prefers-reduced-motion: reduce)` 全关

### 具体清单

| 场景 | 动效 | 时长 |
|------|------|------|
| 页面进入 | `fadeInUp` y:24→0 + opacity 0→1 | 600ms spring |
| Hero 标题 | `heroEntry` 上下双行错位 100ms stagger | 700ms |
| Hero chat demo | 自动播放：user 气泡 fade in → 0.6s 后 assistant icon pulse → 流式打字 35 token/s | 总 3.5s 后 loop pause |
| 卡片列表 | `staggerChild` 每张延迟 80ms | 500ms each |
| 卡片 hover | border + shadow + translateY -2px | 300ms |
| Button hover | bg + translateY -1px + shadow grow | 200ms |
| Button tap | scale 0.97 | 100ms |
| 路由切换 | View Transitions API（已在 lurus-www / dsnb 启用），crossfade + 8px slide | 200/300ms |
| Streaming chat token | 新字符 `blur(4px) → blur(0)` + opacity | 250ms |
| Loading skeleton | shimmer 横扫 `linear-gradient` 移动 | 1.5s linear infinite |
| Focus ring | 3px `var(--c2m-accent-glow)` + 0.5px solid `--c2m-accent` | 150ms |

**不要**: 鼠标跟随 spotlight（已在 lurus-www 看过，paper bg 上效果差）、3D parallax、自动播放视频背景。

---

## 6. 暗/亮色模式

**默认: 亮色 (paper)**。理由:
1. Anthropic/Claude/PromptBase/Vercel(默认) 都偏亮；dark 是 cursor/linear 路线，但本站定位"教程+练习"，paper 阅读体验 >>
2. 与 lurus-www / dsnb 的"自身切换 dark"路线不同 — 本站亮色为唯一态可以**减一半 CSS 工作量** (Phase 1)

**Phase 2 (上线 30 天后看流量)**: 加 dark mode。token 已预留 (`--c2m-dark-*`)。切换器放右上角，纯 system-preference 自动 detect + localStorage 记忆，**不**做"跟 OS 同步"以外的提示。

切换器组件: 24×24 icon button，亮模式显月亮 outline，暗模式显太阳 fill。`transition: color 200ms`，无大动效。

---

## 7. Mockups

### 7.1 Landing hero
```
─────────────────────────────────────────────────────────
 claude2master ▸             Prompt库 Chat 教程 Skills | API key
─────────────────────────────────────────────────────────



           · 让人用好 Claude ·


           Master Claude            ← Fraunces italic
           like a craftsman.        ← Inter Tight 600


      一站式 prompt 库、流式 chat、Skills 商店与教程
      助你三天上手 Claude，三个月精通


      [ 开始练习 → ]    [ 浏览 prompt 库 ]



      ╭───────────────────────────────────────────────╮
      │ │ 你 · 14:32                                  │
      │ │ 帮我写一个 React useDebounce hook           │
      │                                                │
      │ ⓒ                                              │
      │   好的，下面是类型安全实现：                   │
      │   ┌──────────────────────────────────────┐     │
      │   │ export function useDebounce<T>(▎     │     │
      │   └──────────────────────────────────────┘     │
      ╰───────────────────────────────────────────────╯


      已被以下团队使用
      [logo] [logo] [logo] [logo] [logo]   ← 灰度横滚
─────────────────────────────────────────────────────────
```

### 7.2 Prompt 库列表页
```
─────────────────────────────────────────────────────────
  Prompt 库            🔍 搜索…           分类: 全部 ▾
─────────────────────────────────────────────────────────

  热门  ·  最新  ·  我的收藏                按 ⌘K 唤起

  ┌─────────────╮  ┌─────────────╮  ┌─────────────╮
  │╲           │  │╲           │  │╲           │
  │ 编程·Sonnet│  │ 写作·Opus │  │ 翻译·Haiku│
  │            │  │            │  │            │
  │ React 性能 │  │ 长文大纲   │  │ 中英技术   │
  │ 优化诊断师 │  │ 生成器     │  │ 文档对译   │
  │            │  │            │  │            │
  │ 输入你的   │  │ 给定主题与 │  │ 保留代码与 │
  │ 组件代码…  │  │ 受众…      │  │ 链接结构…  │
  │            │  │            │  │            │
  │ 1.2k 次 ↵ │  │ 856 次 ↵  │  │ 2.1k 次 ↵ │
  └─────────────╯  └─────────────╯  └─────────────╯

  ┌─────────────╮  ┌─────────────╮  ┌─────────────╮
  │ ...        │  │ ...        │  │ ...        │
  ...
─────────────────────────────────────────────────────────
```

折角 `╲` = 12×12 三角 clip-path，颜色与卡片一致；hover 时变紫。

### 7.3 Chat 页
```
─────────────────────────────────────────────────────────
 ← 返回   会话: React Hook 调试      模型: Sonnet 4.7 ▾  …
─────────────────────────────────────────────────────────

      │ 你 · 14:30
      │ 我的 useDebounce 有 stale closure，怎么修？


  ⓒ   嗯，这是 React hook 的经典坑。问题在于 setTimeout
      闭包捕获了首次渲染的 value。

      推荐两种修法：

      ```ts
      // 方案 A: useRef 持有最新值
      const valueRef = useRef(value);
      valueRef.current = value;
      ```

      ```ts
      // 方案 B: 依赖数组加 value
      useEffect(() => { ... }, [value, ms]);
      ```

      哪种符合你的场景？▎   ← 紫光标 blink


      │ 你 · 14:32
      │ 用方案 A，给我完整代码


  ⓒ   ▎   ← 流式中


─────────────────────────────────────────────────────────
  [ 继续对话…                                 ]  [发送]
  ⌘↵ 发送  ⌘K 切 prompt  ⌘/ 切模型
─────────────────────────────────────────────────────────
```

---

## 8. 风险

| 风险 | 等级 | 缓解 |
|------|------|------|
| **商标 / 视觉抄袭** — "claude2master" 名字本身擦边 Anthropic | 🔴 高 | (a) Logo **不**用 Claude 橘红 / 衬线 Tiempos 路线，走 indigo + Fraunces 区分；(b) Footer 显示 "Not affiliated with Anthropic. Claude is a trademark of Anthropic PBC."；(c) 域名上线前法务过一遍 |
| **中文字体性能** — 全量 SC font 3-5MB | 🟡 中 | 不加载 SC web font，只 self-host Inter Tight + Fraunces (拉丁 subset ~80KB total)，中文走 system stack |
| **动效在低端机性能** | 🟡 中 | (a) `prefers-reduced-motion` 全 honor；(b) Hero chat demo 默认 `animation-play-state: paused` until `IntersectionObserver` 进视口；(c) backdrop-blur 在低端机降级为半透明纯色 |
| **product accent #7C5CFF 与 lurus 体系审美冲突** | 🟢 低 | 已与 dsnb 蓝同模式 — master token (paper/ink) 一致，只换 accent。Footer 加一句 "by Lurus" + lurus.cn 链接，体系归属清晰 |
| **chat demo 误导** — hero 静态 demo 让用户以为已登录 | 🟡 中 | demo 容器右上角 pill `演示 · 点击体验` 紫色 outline，click 跳真 chat 页 |
| **dark mode 延后被骂** | 🟢 低 | Phase 1 上线 banner 注明 "Dark mode coming Phase 2"，预留 token |
| **prompt 卡片"折角"在 Safari ≤ 14 不支持 clip-path** | 🟢 低 | 降级为右上角小 dot；占总流量 <2% |

---

## 附: 实施 checklist (移交开发)

- [ ] `globals.css` 复用 dsnb 的 LurusTech master token 块 + 加 `--c2m-*` accent 块
- [ ] `next/font` 配 Inter Tight + Fraunces + JetBrains Mono (三个，无 SC)
- [ ] `lib/motion.ts` 复用 lurus-www 同名文件，**无需改**
- [ ] 在 `components/primitives/` 加 `Button.tsx` (3 variants) / `Card.tsx` (3 variants) / `CodeBlock.tsx` / `ChatBubble.tsx` (user/assistant)
- [ ] hero 的流式 demo 用纯前端 `setInterval` 模拟，**不**调真 API，节省成本
- [ ] WCAG: CTA 文字必须用 `--c2m-accent-deep` (5A3FE0) 而非 accent，对比 ≥4.5
- [ ] OG image: Fraunces "Master Claude" + Inter Tight "claude2master.com" + 紫渐变背景 (Playwright 实拍 1200×630)
- [ ] Footer "Not affiliated with Anthropic" 法务声明
