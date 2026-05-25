# claude2master.com 市场调研

> 调研时间: 2026-05-25 | 调研人: Lurus 市场分析师 | 数据源: WebSearch + WebFetch 2026 最新结果

## 1. 竞品矩阵

### A. Claude API 中转 / 聚合站

| 产品 | URL | 模式 | 定价 (2026) | 差异化 |
|------|-----|------|------|--------|
| **CloseAI** | closeai-asia.com | 企业级正规中转 (官方直签) | ¥7/$ 官方93折, 按 token | 企业背书+发票, 自称"亚洲规模最大", 海外服务器 |
| **七牛云 AI** | qiniu.com (子产品) | 商业云厂中转 | 接近官方价 + 600 万免费 token | 国内服务器, 双协议 (Anthropic 原生+OpenAI 兼容), 多模型 |
| **302.AI** | 302.ai | 多模型聚合 (650+) | ¥2/$ ≈ 2.8 折 | 模型最多, 但质量参差; 海外服务器 |
| **灵眸** | (无独立公开域名直链) | 国内服务器低汇率 | ¥2.4/$ ≈ 3.3 折 | **国内服务器+首 token 延迟低**, 支持 Cache Write 双档 |
| **PackyAPI / PackyCode** | packycode | 逆向接口 (Kiro/Cursor/Copilot 反代) | ¥1/$ 极低 | 价格最低, 但**法律灰色+随时被封风险高** |
| **AnyRouter** | anyrouter.top | 公益免费 | 每日登录送 $25 额度, 真免费 | 国内开发者口碑站, 80% 可用率, 注册门槛因被攻击而升高 |
| **OhMyGPT** | ohmygpt.com | 老牌全模型站 | 接近官网价 (偏贵) | 多 CDN 区域, 延迟稳定; 适合稳定优先 |
| **AgentRouter (前 OpenClaudeCode)** | agentrouter.org | 大 V 运营 + MAX 号池 | Opus4.6 ¥1/5 反代; MAX 号池 ¥4.2/21 | 站长信誉好, MAX 号池 status 显示 100% 稳定 |
| **OpenRouter** | openrouter.ai | 海外路由聚合 | passthrough + 5.5% 充值费 | Claude Sonnet 4.6: $3/$15 per 1M; **国内需梯子** |
| **Together.ai** | together.ai | 开源模型 GPU 自营 | $0.03-9.95/M | **不托管 Claude**, 仅作参照 |

**关键发现**: 国内中转站三梯队 — 正规企业 (CloseAI/七牛) 接近官方价; 中间档 (灵眸/AgentRouter) 3-5 折; 灰色低价 (PackyAPI 逆向) 1-2 折但随时跑路。 多数站都有"模型掺水"投诉 (用 GLM 替 Claude)。

### B. AI Prompt 库 / Skills 商店

| 产品 | URL | 模式 | 规模 | 差异化 |
|------|-----|------|------|--------|
| **PromptBase** | promptbase.com | 付费市场 (创作者抽成 20%) | 170K+ prompts, 500K+ listings | 老牌头部, 单条 $1.99-$9.99, 偏 ChatGPT/Midjourney |
| **Snack Prompt** | snackprompt.com | 社区免费 + 自定义 | 大量 community 贡献 | "remix" 二创流 |
| **God of Prompt** | godofprompt.ai | freemium + bundle | 30K+, 19 分类 | 课程化, 跨模型 (Claude/GPT/Gemini/Midjourney) |
| **AIPRM** | aiprm.com | 浏览器扩展 + 社区 | 大量 | **强绑 ChatGPT**, Claude 用户体验差 |
| **PromptHero** | prompthero.com | freemium ($19.99/月 Pro) | 百万级 | 偏图像 prompt |
| **Anthropic 官方 Prompt Library** | docs.anthropic.com/claude/prompt-library | 官方免费 | 50+ 精选 | 官方背书, 但**全英文+只 50 个**, 留出大量翻译/扩充空白 |
| **Skills.sh** (Vercel) | skills.sh | 官方目录+排行榜 | 跨 19 个 AI agent | Vercel 2026-01-20 上线, **追踪真实 install 数** |
| **SkillsMP** | skillsmp.com | GitHub 扒取索引 | 800K+ skills | 量大无策展, 需自审 |
| **LobeHub** | lobehub.com | 聚合 + UI | 169K+ | 中文社区基础好 |
| **ClaudeSkills.info** | claudeskills.info | 社区免费 | 658+ 精选 | 免费纯净, 含官方 + 社区 |
| **awesome-claude-prompts-zh** | github.com/tsaol/... | GitHub 中文 | 中文调教 prompts | GitHub repo, 不是产品站 |

**关键发现**: Skills 是 2025-12 Anthropic 推出的新标准, 已被 OpenAI Codex 采纳, **2 个月内 Skills 数从几千暴涨到几十万 (类 npm 2013)**。 中文 Skills 站几乎是空白市场。

### C. Claude / Claude Code 教程站

| 产品 | URL | 模式 | 差异化 |
|------|-----|------|--------|
| **ClaudeLog** | claudelog.com | 个人博客 (Claude Developer Ambassador InventorBlack 运营) | 英文头部, 深度技术 (plan mode/ultrathink/sub-agents) |
| **菜鸟教程 Claude Code** | runoob.com/claude-code | 已有 SEO 站补 Claude Code 教程 | 中文 SEO 流量大, 但内容偏入门 |
| **Anthropic 官方中文 docs** | code.claude.com/docs/zh-CN | 官方 | 翻译稿, 缺中国本地化方案 |
| **claude-code-chinese/claude-code-guide** | GitHub repo | 社区指南 | GitHub 形态, 非站点 |
| **xianyu110/awesome-claudcode-tutorial** | GitHub repo | "最全面中文教程, 零基础到企业" | GitHub 形态 |
| **知乎专栏** | zhuanlan.zhihu.com | UGC 长文 | 流量大但**碎片化**, 一篇 1 万阅读, 但无站化 |
| **B站 Claude 教程账号** | bilibili.com | 视频教程 + 付费课 | 头部账号正在卖 ¥299-399 共享账号 (高争议) |
| **comate / 七牛 / Apiyi blog** | (各厂博客) | SEO 引流文 | 都在抢 "Claude Code 国内使用" 关键词, 内容同质化 |

**关键发现**: 中文 Claude Code 教程**没有强势站点**, 流量分散在知乎+B站+菜鸟+GitHub README, 留出**单一权威中文教程站**的位置。 ClaudeLog 是英文头部对标 (但运营者也只是一人 + DevAmbassador 身份)。

## 2. 国内用户痛点 (按权重排序)

1. **付款墙 (最痛)**: Claude 官方只认海外信用卡; 国内双币卡几乎 100% 风控失败; WildCard 2025-07 倒闭后虚拟卡路径大半被封; PayPal/Apple Pay/支付宝全不通。 [来源: segmentfault.com/a/1190000047556725, GitHub imarvinle/Claude-Pro]
2. **封号潮 (高频)**: 2026-04-14 起 Anthropic 启用 Persona 实名 KYC (政府证件 + 活体), 大陆/港澳全封锁; Trae 因中资背景被强制下架 Claude 模型; "大佬被封 20 个号"案例普遍; **2025-09 全球所有权禁令: 中资 50%+ 企业全禁**。 [来源: x.com/gkxspace/status/2036092518975373599, finance.sina.com.cn 2026-04-29 香港禁用]
3. **教程碎片+踩坑成本高**: "前后花了几千块测中转站, 有的一用就封, 有的跑的根本不是 Claude" — 没有权威中文站做汇总。 [来源: zhuanlan.zhihu.com/p/1992313721415046720]
4. **Claude Code 配置门槛**: Node ≥18, Windows 还得装 Git Bash, 环境变量配 ANTHROPIC_BASE_URL/AUTH_TOKEN, CC Switch 多供应商切换 — 小白卡住。 [来源: runoob.com/claude-code]
5. **Prompt / Skills 生态缺中文入口**: 官方 50 个 prompt 全英文; Skills 标准 2025-12 才推出, **中文 Skills 商店几乎空白**。 [来源: anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills]
6. **价格不透明+掺水**: 缓存价 10% 是正常, 黑站收 30%; 用国产模型替 Claude 的"挂羊头卖狗肉"普遍。 [来源: zhuanlan.zhihu.com/p/2020215397866033689]

## 3. 差异化机会 (3 个候选)

### 候选 A: 中文 Claude Code + Skills 权威教程站 (内容流)
- **理由**: 中文教程市场无单一权威站 (ClaudeLog 是英文 + 单人); Skills 是 2026 新标准, 中文资源近乎空白; SEO 词 "Claude Code 国内使用" 同质化严重但都是博客文不是站; 内容站可天然引流到 Lurus newapi (API key) + forge (workbench) + creator (Skills 创作)。
- **风险**: 内容站冷启动慢, SEO 6 个月才见效; 需要持续运营。

### 候选 B: "国内 Claude Code 一键开箱" 工具站 (工具流)
- **理由**: 痛点 1 (付款) + 痛点 4 (配置) 是命门; 一键流程 = 注册 → 拿 newapi key (Lurus 自家) → 下载 CC Switch 配置文件 → 跑通第一个 task; **零配置体验**碾压所有现存中转站 (它们都只给你一个 key + 文档让你自己折腾)。 直接对标 AnyRouter 但补了 UX。
- **风险**: 与 Lurus 现有 switch 桌面产品功能重叠, 需明确定位是"轻量 Web 入口"还是"导流给 switch"。

### 候选 C: 中文 Prompt + Skills 双商店 (生态流)
- **理由**: PromptBase 全英文; awesome-claude-prompts-zh 只是 GitHub README; **中文 Skills 几乎空白**; "remix + 一键导入 Claude Code/Claude.ai" 体验, 同时引流到 creator (内容工厂可二次生产)。
- **风险**: 商店类产品需冷启动供需双边, 创作者激励难做; PromptBase 17 万 prompts 已构成网络效应壁垒 (但英文)。

### 推荐: A + B 复合 (内容 + 工具入口)
- **A 做 SEO 流量入口** (内容站起量低成本, 长尾词覆盖广) → **B 做转化** (从教程文章一键跳到"领 key + 配 CC Switch") → 引流到 newapi (按 token 计费收入) / forge (workbench 转化) / creator (内容/Skills 二创)。
- **C 作为第二阶段** (站稳后做 Skills 商店, 同时为 creator 提供素材库)。
- 内容差异化锚点: **(1) 中文 + 本地化** (国内能用的支付/网络方案) **(2) Skills 中文先发** (2025-12 新标准 + 中文几乎空白) **(3) 与 Lurus 自有 LLM gateway 闭环** (不靠卖 token 差价吃饭, 靠生态变现, 长期不跑路)。

## 4. 定价参考

### 国内中转站常见定价模式
- **按 token 内部汇率**: 主流 (¥7/$ ~ ¥1/$, 即官方价的 0.93 折 ~ 0.14 折)
  - 正规站: ¥7/$ (CloseAI, 93折)
  - 中端: ¥2-3/$ (302.AI, 灵眸, ≈ 3 折)
  - 灰色逆向: ¥1/$ (PackyAPI, ≈ 1.4 折, 高风险)
- **包月套餐**: ¥149-399/月
  - ¥149/月 = 每周 $75 额度, 月 $300 用量
  - ¥299-399/月 = B 站共享号池 (稳定性差)
- **Opus 4.6 反代价**: ¥1/5 ~ ¥9/45 per 1M token (in/out)
- **官方价对照**: Sonnet 4.6 $3/$15 per 1M; Opus $15/$75 per 1M
- **缓存价**: 正常 10%, 黑站 15-30%
- **官方订阅**: Pro $20/月, Max 5× $100/月, Max 20× $200/月

### claude2master.com 建议定价区间
- **入门**: 接近 AnyRouter 模式 — 注册送少量免费额度 (¥10-30) 拉新, 之后按 token 计费 ¥3-5/$ (3-5 折定位, 避开 ¥7/$ 正规价段和 ¥1/$ 逆向段)
- **包月**: ¥99/月 (轻度, $50 额度) / ¥199/月 (中度, $150 额度) — 比 B 站共享号池便宜且非共享号
- **避雷**: 不做 ¥1/$ 逆向接口 (Lurus 品牌不能背这个锅)

## 5. 风险与盲点

1. **数据缺失**: ClaudeLog 具体流量未公开 (需 SimilarWeb/Ahrefs 付费查); 国内中转站营收数据无公开来源, 价格梯队是按知乎/segmentfault UGC 推断。
2. **政策风险**: Anthropic 2025-09 全球所有权禁令 + 2026-04 Persona KYC 持续收紧; **中转站本质处于灰色** (Anthropic ToS 禁止转售), 若 Anthropic 加强 IP/账号风控, 国内中转站集体可能被打击。 Lurus newapi 已有此基础设施, 但 claude2master.com 公开宣传要避免授人以柄。
3. **品牌定位张力**: claude2master.com 字面是教 Claude, 但商业模式靠 API 中转; 用户认知容易困惑。 需要明确 "教 + 用一站式" 还是 "教程为主, 工具为辅"。
4. **Skills 标准未成熟**: Anthropic 2025-12 才推出, 安全性问题严重 ("npm 2013"), 中文社区是否买账需观察 6 个月。
5. **法律边界**: 国内提供 Claude API 中转, 是否需要 ICP 备案 + 算法备案不明确 (新域名 .com 走海外可绕开 ICP, 但 PIPL/数据出境合规仍存在)。 与 Lurus 现有 newapi (走 newapi.lurus.cn 已备案) 的关系要理清。
6. **未验证**: 中文 Claude Code 教程站具体 SEO 流量、知乎头部 Claude 教程账号 follower 数等未拿到硬数据, 只有定性描述。

---

**引用源**:
- 知乎 8 站对比: zhuanlan.zhihu.com/p/2020215397866033689
- segmentfault 国内合法使用: segmentfault.com/a/1190000047556725
- 七牛云盘点: cnblogs.com/qiniushanghai/p/19857917
- 封号 20 号经验: x.com/gkxspace/status/2036092518975373599
- 香港禁用: finance.sina.com.cn/wm/2026-04-29
- AnyRouter 评测: aicoding.csdn.net/6892f033a6db534ba2bf4075.html
- Anthropic Skills 标准: anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Skills.sh: virtualuncle.com/agent-skills-marketplace-skills-sh-2026/
- ClaudeLog: claudelog.com
- 菜鸟教程: runoob.com/claude-code/claude-code-install.html
- OpenRouter Claude 定价: openrouter.ai/anthropic/claude-sonnet-4.6
- 中转站包月: zhuanlan.zhihu.com/p/1992313721415046720
- PromptBase: aidude.info/tools/promptbase
