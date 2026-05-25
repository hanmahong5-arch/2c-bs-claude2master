# claude2master.com 合规与安全审查

> 顾问性报告，**非法律意见**；落地前需法务复核。审查日期 2026-05-25。

## TL;DR — 红线清单（≤ 10 条 must-not）

1. **MUST-NOT** 在公开页面 / Logo / Favicon / 域名标题里把 "Claude" 当主品牌（拟人物图 / 仿 Anthropic 配色 / "Powered by Claude" 暗示官方授权）。
2. **MUST-NOT** 在 ToS / About 出现"Anthropic 官方 / 授权 / 合作 / partner"等措辞。
3. **MUST-NOT** 把 Anthropic API key 直发前端浏览器（必须 newapi 代理）。
4. **MUST-NOT** 让匿名用户无速率限制调用 Chat（一晚被刷爆 = 自掏腰包）。
5. **MUST-NOT** Lurus 主体若为"中资控股 ≥50%"实体直接走 Anthropic 官方 API（2025-09 政策禁），必须经合规中转 / 海外主体。
6. **MUST-NOT** 上"如何越狱 Claude / 绕过限制 / Jailbreak prompt"教程与 prompt 模板（直接违反 Anthropic Usage Policy + 国内增加内容审查风险）。
7. **MUST-NOT** 在境内服务器（含 R6）落库用户 chat 历史 + 跨境送到 Anthropic 时不做 consent + 不告知出境（PIPL 38 条）。
8. **MUST-NOT** 收集真实姓名 / 身份证 / 手机号等敏感信息做注册（不必要）。
9. **MUST-NOT** 接微信 / 支付宝个人收款做商业行为（缺商户资质 → 资金冻结 + 偷逃税风险）。
10. **MUST-NOT** Prompt 库收录 NSFW / 攻击性 / 政治敏感内容（国内监管 + Anthropic ToS 双重红线）。

---

## 1. Anthropic 商标 "Claude" 使用边界 (评级: 🔴)

**调研发现**:
- "CLAUDE" 是 Anthropic 在 USPTO 注册商标（Reg #7645254，2025-01 注册，Class: Computer & Software Services）；"ANTHROPIC" 是注册商标 Reg #7804391。
- Anthropic Software Directory Terms 明文："inclusion ... does not grant rights to use Anthropic's name, trademarks, or intellectual property" + "third-party developers cannot make statements ... suggest partnership with, sponsorship by, or endorsement by Anthropic without prior written approval"。
- 未找到 Anthropic 公开的 domain-name-specific Trademark Guidelines（`/legal/trademark-policy` 404）。可借鉴 OpenAI / Google 的同类政策：通常允许 "nominative fair use"（如 "tutorials for Claude"）但禁止以 trademark 作为产品主品牌 / 域名主体。
- "claude2master" = "Claude" + 通用动词 "to master"，与 "claudeguide.com" / "claudetips.com" 性质相似；属典型边缘地带，可能被 Anthropic 法务请求 transfer（UDRP 程序，约 65% 成功率被申诉方拿下含他人商标的域名）。

**风险**:
- 🔴 短期（6 月内）小，长期（流量 >10K DAU 或形成商业规模）极可能被 Anthropic 发 cease & desist。
- 🔴 若域名 + logo + 配色形成"伪官方"印象，UDRP 几乎必输。
- 🟡 即便保留域名，也无法在 Apple Store / 微信小程序通过审核（商标 + Anthropic 主体冲突）。

**缓解**:
1. **首选: 保留域名作 SEO 引流锚，但站点品牌改名**（如 "C2M"、"PromptMaster"、"Lurus AI Hub"）。Logo 与 Anthropic Claude 视觉系统完全脱钩。
2. 任何 "Claude" 出现处必须前缀 "for / about / with"，从不裸用作主语品牌。
3. 页脚加 disclaimer："Claude® is a trademark of Anthropic, PBC. This site is independent and not affiliated with or endorsed by Anthropic."
4. 备案备用域名（claude2master.com 被收时 fallback 到 c2m.lurus.cn 或 promptmaster.cn）。
5. 法务评估在中国（CNIPA）+ 美国（USPTO）对"C2M"做防御性注册。

---

## 2. Anthropic API ToS — 中转/转售条款 (评级: 🔴)

**调研发现**:
- Anthropic Commercial Terms Section D.4：customers "may not ... resell the Services except as expressly approved by Anthropic"。
- 2026-01 Anthropic 强化执法：封禁 OpenClaw / OpenCode / Roo / Goose 的 OAuth 提取行为。Usage Policy 现明文："applies to anyone who can submit inputs ... including via any authorized resellers or passthrough access"。
- 2025-09 Anthropic 区域限制升级：禁止"由不支持地区（含中国）实体直接或间接持股 ≥50%"的公司使用 Claude，**不论实际运营地**。
- 行业现状：国内 17 家主流中转站，仅 1 家有 ICP 备案；OpenRouter 已主动屏蔽 CN/HK/SG 用户访问 Claude 系列。
- "wrapper 边界"行业判读：**纯代理 + 自家 key + 无增值** = 高危违约；**Claude 仅作组件 + 自家 prompt 库 / 教程 / 工作流** = 灰色但更可辩护。

**风险**:
- 🔴 P0 — 转售违约：用 Lurus newapi 把 Claude 转给匿名 CN 用户 = 同时撞 D.4（reseller）+ 区域限制。
- 🔴 P0 — Lurus 法人/股东结构若 ≥50% CN 主体（待法务核实），任何方式调 Claude 都构成违约。
- 🟡 商业风险：上游 key 一旦被风控封停（Anthropic 已演示能力），全站 chat 立刻挂。
- 🟡 用户被欺诈风险（"Shadow API"问题）：用户花钱用"Claude"，但 newapi 后台可能 fallback 到便宜模型，引发投诉。

**缓解 / 边界**:
1. **法律隔离层**: Chat 后端的法律主体最好是 Lurus 海外实体（HK / Singapore / US），与境内 Lurus 主体业务隔离。Anthropic 合约签在海外主体。
2. **"组件化" 而非 "wrapper"**: 强化 Prompt 库 / 工作流 / 教程的增值价值，避免站点本质是 "type message → get Claude reply"。
3. **不暗示用 Claude**: Chat UI 模型选择器写 "C2M Assistant (powered by frontier models)" 不写 "Claude 3.5 Sonnet"。模型透明度 vs 法律风险二选一时偏后者。
4. **Rate limit + 实名 / 注册门槛**: 防止匿名滥用 token、防止短期烧光。
5. **诚实计费**: 如真用 Anthropic 模型，token usage 必须如实展示；不偷换底层模型（避免 Shadow API 类指控）。
6. **fallback 路径**: 设计 Claude 不可用时自动切 DeepSeek / GLM / Qwen 的降级链路（同时也契合 lurus `cost-llm` skill 推荐）。

---

## 3. 国内备案与监管 (评级: 🟡)

**调研发现**:
- 技术层面 .com + Vercel 海外 = 不强制 ICP（dsnb.help 同模式跑通，详见 `cn-idc-icp` skill）。
- 但《生成式人工智能服务管理暂行办法》(2023-08 施行) + 网信办登记制：**对面向境内公众、有"舆论属性 / 社会动员能力"的 AI 服务必须登记**。2025 年累计 748 款大模型备案 + 435 款 API 调用应用登记。
- 国家网信办 2024 立场：**境外 AIGC 产品对中国境内公众提供服务的，适用本暂行办法**（《暂行办法》第 20 条）。
- 中转 Anthropic 模型给境内公众 = Anthropic Claude 未在 CN 备案 → 提供方违法风险 P0。
- 已有案例：2024-2025 国内若干"GPT 镜像站"被属地网信办约谈下架。

**风险**:
- 🟡 短期 P1 — 个体站 / 流量小（<1 万 DAU）通常不被主动盯，但被举报即立案。
- 🔴 中期 P0 — 若有支付转化 + 有用户内容生成（chat 输出）+ 中文营销，国内监管认定为"面向境内公众" → 强制登记 / 下架。
- 🔴 内容红线 — 用户 prompt 触发涉政 / 色情 / 暴恐内容输出，平台连带责任（"生成式 AI 服务提供者的内容安全责任"）。

**缓解**:
1. **定位海外用户为主，中文营销淡化**：营销文案不以"中国用户专属 Claude"为卖点，保留"全球开发者"叙事。
2. **不主动登记 + 不主动公开宣传**: 流量起来前先低调跑，避免成为"枪打的出头鸟"。
3. **内容审查 pipeline**: chat 入口 + 输出双层中文敏感词扫描（接入第三方如净网 / 数美 / 网易易盾）。涉政 / 涉黄 / 涉恐自动拦截 + 留痕。
4. **用户协议明确**: ToS 写明"本服务不针对中国大陆用户提供"，账号注册要勾"我不是中国大陆居民"（参考 OpenAI 早期做法，法律屏障 ≠ 实际拦截但提供抗辩）。
5. **避开高敏话题**: Prompt 库不收"政治评论 / 历史争议 / 时事分析"类模板。

---

## 4. 用户数据合规 (PIPL) (评级: 🟡)

**调研发现**:
- PIPL 第 38 条：跨境传输个人信息须满足三路径之一（安评 / 标准合同 SCC / 认证）。
- 2025-10 网信办《个人信息出境认证办法》落地，三路径制度补齐。
- 阈值：累计 10 万人以上非敏感 PI 或 1 万人以上敏感 PI → 触发 SCC 备案 + PIPIA（个人信息保护影响评估）。
- Vercel (US) + 后端调 Anthropic (US) = 用户每次 chat 都构成 PI 出境（prompt 内容 + IP + 账号信息）。

**风险**:
- 🟡 P1 — MVP 期用户量小，单纯触发 SCC 备案概率低；但**任何 PI 出境通知 + consent 缺失就是合规缺陷**，举报即查。
- 🟡 用户 chat 内容含 PII（姓名 / 手机 / 邮箱）→ 出境时未脱敏 = PIPL Art.40 风险。
- 🟢 Cookie / Analytics 用 Vercel Analytics（无 PII）+ 不接 GA / 百度统计 → 较干净。

**缓解**:
1. **数据最小化注册**：邮箱 + 密码（或 GitHub OAuth），**不收**手机号 / 实名 / 身份证。
2. **隐私政策模板要点**：
   - 明确出境接收方（Anthropic / OpenAI / Vercel / Cloudflare），目的、字段、保存期限。
   - "您的 prompt 内容将传输至美国 Anthropic 服务器处理" + 勾选 consent。
   - DSAR 路径（数据导出 / 删除），承诺响应窗口 ≤15 工作日。
3. **Chat 历史本地优先**：默认存浏览器 IndexedDB，**用户主动开启**云同步才出境（消减 consent 风险）。
4. **PII 脱敏中间层**：调上游 LLM 前 regex 屏蔽手机/邮箱/身份证（newapi 加 hook）。
5. **PIPIA 模板预备**：达到 1 万用户时启动正式评估（参考网信办 SCC 备案模板）。

---

## 5. 支付合规 (评级: 🟡)

**调研发现**:
- Lurus platform (`2l-svc-platform`) 已集成 Stripe / Alipay / WeChat / Creem / Epay 多 provider。
- Stripe 不支持 mainland CN 主体直接收款；HK 主体可（需 BR/CR），费率 3.4%+HK$2.35。
- 微信 / 支付宝商户号需国内主体 + 营业执照 + 行业资质（"AI 服务"目前归"信息技术服务"，待二级目录确认）。
- 个人收款码做商业 = 央行 261 号文明确禁止 + 资金冻结风险高。

**风险**:
- 🟡 P1 — 若走个人微信收款 = 100% 违规 + 高概率冻结。
- 🟡 增值税 / 发票：商业服务对个人收 ≥500 元 / 月需提供发票 → 个人主体无法开。
- 🟢 用 Lurus platform 现有支付链路：技术风险低，但要确认 platform 主体 (Lurus 公司) 已有相应资质 + 已在 newapi/lucrum 跑过。

**缓解**:
1. **首选: 复用 Lurus platform 支付** (`2l-svc-platform/internal/adapter/payment/`)，按 newapi 多租户模式接入，统一开票走 platform。
2. **海外 / Web3 用户**: Stripe + Creem 海外卡 + USDT（参考 lucrum）。
3. **价格策略**: 包月 (¥30/月) > 充值 token，包月对账简单 + 不触发"算力转售"敏感解读。
4. **不接 KYC 妥协方案**：仅做"虚拟产品 / 不退款"模式 → 风险 = 用户投诉 12315 → 必须有显著退款规则 + 平台兜底机制。
5. **法务核**: 询问公司财务"AI 信息服务"行业 invoice 类目是否已开通。

---

## 6. 安全基线 (评级: 🟢)

**调研发现 + 对齐 lurus security-auditor**:
- API Key 泄漏：参照 `INTERNAL_API_KEY 扩散`威胁矩阵，前端绝不能有 Anthropic / OpenAI 真 key。
- Prompt Injection：2025 仍是 OWASP LLM Top10 #1，NCSC 评估"无法彻底缓解"。Microsoft Prompt Shield / Meta Prompt Guard 被研究演示 100% 绕过。
- Vercel env vars：production / preview / development 三套，敏感 secret 用 Vercel Secrets API 不用 plain env。

**风险**:
- 🟡 匿名 chat 滥用：单 IP 一晚刷 1M token，按 Anthropic Opus 价格 = 烧 $200。
- 🟡 Prompt injection 让模型泄漏 system prompt / 其他用户上下文。
- 🟢 Cookie / Session：Vercel 默认 secure + httpOnly + SameSite=Lax。

**缓解**:
1. **API key 中转链**：浏览器 → claude2master Next.js BFF (rate limit + auth) → Lurus newapi (`newapi.lurus.cn`) → Anthropic。前端只见自家 session token。
2. **多层速率限制**:
   - 未登录: 5 msg/小时/IP (Cloudflare WAF rule)
   - 免费用户: 50 msg/天 + max 4K context
   - 付费: 包月或按 token
3. **Prompt injection 防御**:
   - System prompt 加 canary token（响应中检测漏出 = 攻击成功）
   - 用户输入与 system prompt 用 XML tag 强分隔 (`<user_input>...</user_input>`)
   - 输出层禁敏感字符串（"system:" / "assistant:" 前缀 / 长 base64）
   - 工具调用全部 deny by default + allowlist
4. **租户隔离**: Chat 历史按 user_id 分行 + RLS (PIPL + 多租户基本盘)；前端不暴露 user_id。
5. **Secret 管理**: Vercel env 加密 + production-only；GH repo 加 `.env.example` 占位；任何 commit 触发 gitleaks 扫描。
6. **审计日志**: 每次 chat 调用记录 (user_id, prompt_hash, tokens_in/out, upstream_model, timestamp)，PII 字段 hash 不存原文。

---

## 7. 内容/品牌风险 (评级: 🟡)

**调研发现**:
- dsnb 教训："不要堆民族主义口号"。 → 同样适用 claude2master。
- "如何越狱 Claude" 类内容 = 直接违反 Anthropic Usage Policy "Do Not Abuse Our Platform" + 国内被定性为"破解类教程"。
- Prompt 库若收录 jailbreak / NSFW / 攻击 prompt → Anthropic 反向追踪可锁定违约方。

**风险**:
- 🟡 营销文案踩雷：模仿 dsnb 历史教训。
- 🔴 Prompt 库内容失控：用户上传 jailbreak prompt 没下架 → Anthropic 投诉 / 监管抽查命中。
- 🟡 "Claude Code 教程"内容若包含逆向 / 突破限制 / 提取 system prompt 步骤 → 双重违规。

**缓解**:
1. **Prompt 库审核机制**:
   - 用户提交 → LLM 预审（用便宜模型批分类：合规 / 越狱 / NSFW / 攻击）→ 人工二审 → 上架。
   - 已上架内容用户可一键举报，48h 内人工复核。
   - 后台维护"jailbreak prompt 黑名单"自动拒。
2. **教程内容白名单**: Claude Code 教程只覆盖官方文档允许的用法（agent loop / tool use / prompt engineering），不写"如何让 Claude 说脏话 / 绕过审查"。
3. **营销文案避雷清单**:
   - ❌ "国产替代 / 民族骄傲 / 弯道超车 / 干翻 X"
   - ❌ "Anthropic 官方推荐 / 唯一中文版 / 中国独家"
   - ❌ "免登录 / 永久免费 / 无限制 Claude" (后两个还违反 Anthropic ToS)
   - ✅ "为开发者准备的 Prompt 工作流"
   - ✅ "Claude Code 入门到精通教程合集"
   - ✅ "稳定的中国大陆访问体验"（不说为什么）
4. **品牌中性化**: 站点视觉与 Anthropic 官方明显区分，配色避橙色 / 拒用 Anthropic 字体（Poppins / Lora）。

---

## 推荐"可 ship" 边界 (MVP)

满足以下边界可较安全 ship：

| 模块 | 可 ship 形态 | 必须延后/砍 |
|------|------------|-----------|
| **Landing** | 通用品牌（C2M / 不裸用 Claude logo），讲教程 / Prompt 库 / 工具集成 | 不写"官方 / 授权" |
| **Prompt 库** | 100 条人工审核过的工作流 prompt（编程 / 写作 / 分析） | 用户 UGC 上传暂不开 |
| **在线 Chat** | 登录后 50 msg/天，记 chat 历史在浏览器 + 可选云同步（带 consent） | 不接匿名 chat |
| **Claude Code 教程** | 官方文档 + 自家最佳实践，中性表述 | 不写"破解 / 越狱 / 突破" |
| **Skills 商店** | 仅展示 + 跳 GitHub repo，不托管执行 | 不接受未审 skill 上架 |
| **API key 申请** | 仅 Lurus 自家 newapi key（按 newapi 现有计费 / 配额）；不转发 Anthropic 个人 key | 不直接帮用户申请 Anthropic 官方 key |
| **支付** | 复用 platform 支付链 + Stripe HK fallback | 不收个人微信码 |
| **法律页** | 隐私政策 + ToS + 商标 disclaimer + 内容审查规则 | 不写假合规承诺 |

---

## 待用户决断的 3 个问题

1. **Lurus 公司法人 / 股东结构是否触发 Anthropic "中资 ≥50% 实体" 禁令？**
   若是 → 必须用海外子公司持有 Anthropic 合约 & API key，否则**整个 MVP 法律基础不成立**。这是 P0 阻塞问题，建议法务先核 + 决定海外主体（HK / SG / US）setup 路径。

2. **是否接受将站点品牌从 "claude2master" 重命名为中性名（如 "C2M" / "PromptMaster"）？**
   保留域名作 SEO 入口，但页面 / Logo / 营销不再以 "Claude" 为主品牌。这会损失一些 SEO 关键词权重，但显著降低 UDRP / 商标 cease-and-desist 风险。决策影响视觉设计 / 文案 / SEO 策略的所有下游工作。

3. **"提供面向中国大陆公众的 AI 服务" 这个定位是否要正面承担？**
   若 yes → 走《生成式 AI 暂行办法》登记路径 + 内容审查 pipeline + 中国主体 + ICP（要么彻底放弃 Vercel 走国内云）；若 no → ToS 明确写"不面向中国大陆"+ 营销淡化中文 + 用海外用户叙事。**中间地带是监管和法律双高危**。

---

## 参考来源

- [Anthropic Commercial Terms](https://www.anthropic.com/legal/commercial-terms) — Section D.4 resale restriction
- [Anthropic Usage Policy Update](https://www.anthropic.com/news/usage-policy-update) — 2026 wrapper crackdown
- [Anthropic: Updating Region Restrictions](https://www.anthropic.com/news/updating-restrictions-of-sales-to-unsupported-regions) — 2025-09 China majority-controlled ban
- [Claude trademark registration #7645254](https://www.trademarkia.com/claude-97790228) — USPTO 2025-01
- [Anthropic Software Directory Terms](https://support.claude.com/en/articles/13145338-anthropic-software-directory-terms) — third-party trademark restrictions
- [VentureBeat: Anthropic ends OAuth in third-party tools](https://venturebeat.com/technology/anthropic-cuts-off-the-ability-to-use-claude-subscriptions-with-openclaw-and) — 2026-04 enforcement
- [生成式人工智能服务管理暂行办法 备案登记 (CAC 2025)](https://www.cac.gov.cn/2026-01/09/c_1769688009588554.htm) — 748 备案 + 435 登记
- [PIPL 数据出境标准合同 (CAC 2025-10)](https://www.cac.gov.cn/2025-10/17/c_1762449729500501.htm) — 三路径制度补齐
- [OWASP LLM Top 10 2025 — Prompt Injection #1](https://introl.com/blog/llm-security-prompt-injection-defense-production-guide-2025)
- [国内 API 中转站合规风险综合分析](https://www.cnblogs.com/cheman/p/18951870) — 17 家中转站现状

---

**审查人**: Lurus 合规与安全顾问 (AI 辅助)
**审查范围**: 上线前合规预审 + 安全基线 + 法律风险
**免责声明**: 本报告为顾问性意见，**不构成法律意见**。涉及法人结构 / 商标 / 跨境合规 / 监管登记的关键决策必须经持牌法律顾问复核后执行。
