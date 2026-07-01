// error-kb.ts — AI 编码工具报错速查库(单一信息源)
//
// 定位: 面向中国大陆用户的"报错怎么修"故障排查页(雷达=发版动态,教程=怎么用,本库=出错自救)。
// 内容规范:
// - errorText 用用户真实会看到的英文报错原样(经 GitHub issue/官方文档核实),便于搜索命中;
// - fixes 每步给具体命令/操作,按"先试最简单"排序;
// - cnNote 记大陆网络环境特别处理(代理/镜像/网关),中性表述。

export interface ErrorEntry {
  /** kebab-case 唯一 slug,做路由 /errors/<slug> */
  slug: string;
  /** 涉及工具,如 "Claude Code" / "Cursor" / "通用" */
  tool: string;
  /** 页面标题(报错关键词中文化) */
  title: string;
  /** 用户实际看到的报错原文(英文原样) */
  errorText: string;
  /** 什么场景下出现 */
  symptom: string;
  /** 可能原因,按概率排序 */
  causes: string[];
  /** 修复步骤,每步具体可执行 */
  fixes: string[];
  /** 大陆网络环境特别注记,无则空串 */
  cnNote: string;
  tags: string[];
}

export const ERROR_KB: ErrorEntry[] = [
  {
    slug: "claude-code-china-403-forbidden",
    tool: "Claude Code",
    title: "大陆 IP 直连 403 Forbidden",
    errorText: "API Error: 403 {\"error\":{\"type\":\"forbidden\",\"message\":\"Request not allowed\"}}",
    symptom: "在国内网络环境下直接执行 claude 命令或触发任意对话请求时出现, /login 后也复现, claude.ai 网页版同样打不开。",
    causes: [
      "Anthropic 对中国大陆 IP 做地域封锁, 无论是否付费订阅都会拦",
      "本地代理未生效, 请求仍走本机公网出口",
      "DNS 被污染解析到错误节点导致连的不是真实 Anthropic 边缘节点",
    ],
    fixes: [
      "确认代理是否真的生效: curl -x http://127.0.0.1:7890 -sI https://api.anthropic.com , 看能否返回正常响应头",
      "终端导出代理: export HTTPS_PROXY=http://127.0.0.1:7890 && export HTTP_PROXY=http://127.0.0.1:7890 , 再重开一个终端窗口跑 claude",
      "Windows PowerShell 设置: $env:HTTPS_PROXY=\"http://127.0.0.1:7890\"",
      "代理软件切到能覆盖 api.anthropic.com / claude.ai 域名的全局或规则分流模式, 避免被 PAC 规则错误直连",
      "仍失败则运行 claude /doctor 看诊断输出, 或改用中转网关方案(见下方大陆网络环境注记)",
    ],
    cnNote: "Anthropic 官方接口在大陆是硬性地域封锁, 无代理必挂; 稳定代理配好后原生 claude.ai 订阅可继续用。若不想长期折腾代理, API 中转网关(国内可直连、按官方计价转发)是常见替代路线, 二者按稳定性和是否需要保留官方账号自行取舍。",
    tags: ["claude-code", "网络", "代理", "403", "大陆"],
  },
  {
    slug: "claude-code-fetch-failed",
    tool: "Claude Code",
    title: "fetch failed 网络请求失败",
    errorText: "fetch failed",
    symptom: "在登录环节(OAuth 浏览器授权回调)或任意对话请求时报错, 通常几秒内就失败, 表现为连接超时或直接被重置。",
    causes: [
      "本地代理/防火墙拦截了到 api.anthropic.com 或 console.anthropic.com 的请求",
      "代理只对浏览器生效, 终端环境变量未继承代理配置",
      "公司/校园网出口对 Anthropic 域名做了 QoS 限速或丢包",
    ],
    fixes: [
      "运行 claude /doctor 看具体是哪一跳失败",
      "确认代理监听端口: netstat -ano | grep 7890 (Git Bash 下用 findstr 也可: netstat -ano | findstr 7890)",
      "手动导出代理变量后在同一终端里跑: export HTTPS_PROXY=http://127.0.0.1:7890; claude",
      "用 curl 单独验证网络层: curl -x $HTTPS_PROXY -v https://api.anthropic.com/v1/messages , 排除是不是 Claude Code 自身 Node 客户端的问题而非网络问题",
      "仍失败可执行 claude /feedback 生成诊断包提交给官方, 或直接切换到国内可直连的中转网关方式跑",
    ],
    cnNote: "该报错是官方文档明确列出的网络类错误, 大陆环境下 90% 是代理未生效或未被终端进程继承, 少数是本身命中了地域封锁(见 403 条目); 用中转网关可以绕开这层排查成本。",
    tags: ["claude-code", "网络", "登录", "OAuth"],
  },
  {
    slug: "claude-code-invalid-api-key-login",
    tool: "Claude Code",
    title: "登录后仍提示 Invalid API key",
    errorText: "Invalid API key · Please run /login",
    symptom: "OAuth 网页授权流程显示成功, 回到终端或 VS Code 插件后依然卡在未登录状态, 执行任意命令都报这个错。",
    causes: [
      "OAuth 登录成功但凭证没有真正写入本地 keychain/配置文件",
      "本地残留了旧的 ANTHROPIC_API_KEY 环境变量, 与订阅登录的 token 冲突",
      "VS Code 插件和终端 CLI 的认证状态没有互通",
    ],
    fixes: [
      "先检查是否有遗留环境变量: echo $ANTHROPIC_API_KEY , 有则 unset ANTHROPIC_API_KEY 后重试",
      "终端里先跑一次 claude, 输入 /login 完整走一遍认证, 成功后再打开编辑器插件(插件登录状态很多时候依赖终端先握手成功)",
      "仍失败执行 /logout 彻底清掉本地 token, 再 /login 重新授权",
      "极端情况删除本地配置目录重置: 删除 ~/.claude 和 ~/.config/claude-code 后重新安装登录(会丢失本地历史配置, 先确认无重要自定义设置)",
    ],
    cnNote: "这是官方仓库长期未完全解决的高频 bug, 与大陆网络本身无必然关系, 但大陆用户因为要挂代理走 OAuth 浏览器回调, 更容易撞上代理中途断线导致 token 没写入成功的情况, 建议全程保持代理稳定不要中途切换节点。",
    tags: ["claude-code", "登录", "OAuth", "401"],
  },
  {
    slug: "claude-code-credit-balance-too-low",
    tool: "Claude Code",
    title: "Credit balance is too low 报错",
    errorText: "Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.",
    symptom: "使用 API Key 方式调用时报错, 部分用户账户里明明还有余额或者是 Pro/Max 订阅账户依然触发。",
    causes: [
      "API Key 走的是按量计费的 Console 账单体系, 与 Claude Pro/Max 订阅是两套独立计费, 订阅额度不会自动供 API Key 使用",
      "Console 账户余额确实耗尽或从未充值",
      "登录状态混用: Claude Code 误用了旧的/别的组织下的 API Key 而非当前订阅登录",
    ],
    fixes: [
      "确认当前是用订阅登录还是 API Key: claude /status 查看认证方式",
      "若想用 Max/Pro 订阅额度, 确保没有设置 ANTHROPIC_API_KEY 环境变量, 用 /login 走订阅登录而非 API Key",
      "需要用 API Key 方式的, 去 console.anthropic.com/settings/billing 检查余额并充值",
      "充值后仍报错, 执行 /logout 再 /login 强制刷新一次认证状态",
    ],
    cnNote: "大陆用户给 console.anthropic.com 充值本身依赖境外信用卡/PayPal, 是很多人卡壳的第一道坎; 若长期无法完成境外支付, 使用支持支付宝/微信结算的国内中转网关是更现实的路径, 按官方费率转发无需处理外币账单。",
    tags: ["claude-code", "计费", "API-key", "400"],
  },
  {
    slug: "claude-code-overloaded-529",
    tool: "Claude Code",
    title: "Overloaded 529 服务过载",
    errorText: "API Error: Overloaded (529) — overloaded_error",
    symptom: "长任务或高峰时段(尤其模型刚发布/大版本更新后)频繁中断, 报错后当前任务直接终止, 没有自动重试。",
    causes: [
      "Anthropic 服务端整体负载过高, 官方模型容量不足",
      "本地网络抖动被误判成过载(常与真实 529 混淆, 需先排除代理不稳定)",
      "Claude Code 客户端对 529 没有做退避重试, 一次失败就中断整个任务",
    ],
    fixes: [
      "先确认不是代理问题: 直接 curl -x $HTTPS_PROXY https://api.anthropic.com 看是否连通正常",
      "手动重试, 官方目前对交互模式下 529 未做自动退避, 需要人工重新触发",
      "高峰期(工作日白天美西时间)提前避开或切到用量较低时段",
      "批量/脚本任务用 --print 模式配合 --fallback-model 指定降级模型, 交互模式该参数暂不支持",
      "频繁遇到可切换到有独立容量池的中转网关, 部分网关对 529 会自动切换上游节点重试",
    ],
    cnNote: "529 是官方服务端过载, 与是否在大陆无关, 但大陆用户因为要额外过一层代理, 更难判断到底是代理问题还是官方真过载, 建议先用 curl 直连代理确认再下结论。",
    tags: ["claude-code", "529", "overloaded", "限流"],
  },
  {
    slug: "claude-code-429-rate-limit",
    tool: "Claude Code",
    title: "429 Too Many Requests 限流",
    errorText: "API Error: Request rejected (429) · Rate limited / Number of concurrent connections has exceeded your rate limit",
    symptom: "并发开多个 session 或子代理(subagent)时报错, 部分场景是刚启动就报, 有的是用量面板明明还有额度也照样报。",
    causes: [
      "单个组织下所有 API Key 和会话共享同一限流池, 并行开多个窗口是在瓜分同一份额度而非叠加",
      "启动阶段客户端并发打了多个初始化请求导致瞬时触发限流",
      "实际是 529 过载被错误展示成 429(客户端展示层 bug)",
    ],
    fixes: [
      "减少同时运行的 Claude Code 会话/子代理数量, 串行执行",
      "稍等几十秒到几分钟后重试, 不要立刻连续重试(会加剧限流)",
      "claude /status 查看实际用量面板, 确认是否真的到额度上限还是展示误报",
      "用量确实经常触顶的账户, 联系 Anthropic sales 申请提额, 或改用有独立并发池的多账号/中转方案分摊负载",
    ],
    cnNote: "限流池按组织算, 和网络位置无关; 大陆用户若通过多个中转网关渠道分摊调用, 相当于绕开了单一组织限流池的天花板, 是缓解 429 的实用手段之一。",
    tags: ["claude-code", "429", "限流", "并发"],
  },
  {
    slug: "npm-econnreset-cert-issuer",
    tool: "npm / bun",
    title: "npm install 报 ECONNRESET 或证书错误",
    errorText: "npm ERR! request to https://registry.npmjs.org/xxx failed, reason: unable to get local issuer certificate",
    symptom: "公司网络、校园网或某些本地代理软件开启 HTTPS 检查时执行 npm/bun install 报证书或连接被重置。",
    causes: [
      "本地代理/防火墙对 HTTPS 做了中间人证书替换, Node 信任链里没有这个自签证书",
      "npm 配置的 registry 或 proxy 地址本身不可达, 触发连接重置",
      "Node.js 18+ 默认更严格的 TLS 校验, 老配置在新版本上不再兼容",
    ],
    fixes: [
      "先确认是否代理导致: npm config get proxy , 无代理需求就 npm config delete proxy 清掉残留配置",
      "改用国内镜像绕开证书拦截层: npm config set registry https://registry.npmmirror.com/",
      "确有自签证书需求, 把代理的 CA 证书导出后配置: npm config set cafile /path/to/proxy-ca.pem 或环境变量 export NODE_EXTRA_CA_CERTS=/path/to/proxy-ca.pem",
      "仅本地临时验证可用(不建议长期使用): npm config set strict-ssl false",
      "bun 用户改用 bunfig.toml 里的 [install] ca 或 cafile 字段指定证书路径, bun 目前没有等价于 NODE_EXTRA_CA_CERTS 的全局变量",
    ],
    cnNote: "国内镜像(npmmirror.com, 原淘宝源已下线)是首选方案, 无需代理即可提速; 如果是公司/校园强制 HTTPS 检查环境, 才需要额外处理证书信任问题, 两者是不同成因, 先分清楚再对症下药。",
    tags: ["npm", "bun", "证书", "ECONNRESET", "安装"],
  },
  {
    slug: "npm-etimedout-registry",
    tool: "npm",
    title: "npm install ETIMEDOUT 连接超时",
    errorText: "npm ERR! network request to https://registry.npmjs.org/xxx failed, reason: connect ETIMEDOUT",
    symptom: "不挂代理直接执行 npm install 时长时间无响应最终超时, 换网络(如热点)有时能通有时依然超时。",
    causes: [
      "registry.npmjs.org 在国内访问延迟高、丢包严重, 非完全屏蔽但体验极差",
      "本地网络对该域名的部分 CDN 节点路由异常",
    ],
    fixes: [
      "切换国内镜像源: npm config set registry https://registry.npmmirror.com/",
      "确认已生效: npm config get registry",
      "单次安装不改全局配置: npm install --registry=https://registry.npmmirror.com/",
      "bun 用户对应配置 bunfig.toml 里的 [install] registry = \"https://registry.npmmirror.com/\"",
      "某个包在镜像上还没同步完成导致的偶发失败, 稍等几分钟重试或先用官方源装这一个包",
    ],
    cnNote: "淘宝源旧域名 npm.taobao.org / registry.npm.taobao.org 已于 2022 年 6 月下线, 网上很多旧教程写的地址已失效, 认准 registry.npmmirror.com 才是当前维护中的镜像。",
    tags: ["npm", "ETIMEDOUT", "镜像", "安装"],
  },
  {
    slug: "cursor-connection-failed-check-network",
    tool: "Cursor",
    title: "Cursor 聊天报 Connection failed",
    errorText: "Connection failed. If the problem persists, please check your internet connection or VPN",
    symptom: "登录、账户和官网都能正常访问, 唯独 AI 对话/Agent 功能持续报这个错, 重启软件后短暂恢复很快又复现。",
    causes: [
      "Cursor 的模型请求走的是独立于登录鉴权的另一条网络链路, 该链路被拦截或不稳定",
      "本地代理软件的规则分流没有覆盖 Cursor 请求的域名/IP 段",
      "同一局域网内端口转发或本地防火墙规则冲突导致连接频繁中断",
    ],
    fixes: [
      "确认是否需要为 Cursor 单独配置代理: 在设置里检查 Http Proxy 相关选项, 部分版本需要手动填代理地址而非依赖系统全局代理",
      "代理软件切换成全局模式测试, 排除是否是分流规则遗漏了 Cursor 用的域名",
      "临时关闭 HTTP/2 支持后重启 Cursor 测试(部分用户反馈的社区已知规避方式)",
      "完全重启 Cursor 应用而非只是重连, 部分版本存在长连接卡死需要冷启动才能刷新",
      "稳定性要求高的场景改走国内可直连的中转网关配置到 Cursor 的自定义模型端点",
    ],
    cnNote: "该报错在 Cursor 官方论坛里全球用户都有反馈(非中国独有 bug), 但大陆用户因为多一层代理, 触发概率明显更高; 建议先用全局代理模式定位是否是分流规则问题, 再考虑换用中转网关方式接入。",
    tags: ["cursor", "网络", "连接失败", "代理"],
  },
  {
    slug: "claude-code-windows-eacces-permission",
    tool: "Claude Code",
    title: "Windows 安装报 EACCES / 权限拒绝",
    errorText: "npm ERR! code EACCES / spawn EACCES / Permission denied (os error 13)",
    symptom: "用 npm install -g 全局安装 Claude Code CLI 时报权限错误, 或用管理员权限强行安装后功能异常。",
    causes: [
      "npm 全局安装目录权限不属于当前用户, 常见于用管理员身份装过一次后普通用户再装冲突",
      "用 sudo/管理员权限安装产生了 root/管理员归属的文件, 后续更新和正常使用的用户没有写权限",
      "杀毒软件拦截了安装脚本释放的文件或配置写入",
    ],
    fixes: [
      "改用官方原生安装器而非 npm 全局安装(推荐路径, 一次性避开权限问题): PowerShell 执行 irm https://claude.ai/install.ps1 | iex",
      "PowerShell 执行策略被拦截时先放开: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned",
      "检查目标目录是否可写: 确认 npm 全局路径 npm config get prefix 对应目录当前用户有写权限, 不要用管理员权限硬装",
      "临时关闭杀毒软件实时防护重新安装, 成功后再开启防护并把安装目录加入白名单",
      "绝对不要用 sudo 或以管理员身份强行 npm install -g, 会产生权限归属混乱, 后续更新持续报错",
    ],
    cnNote: "此问题与网络无关, 纯本地环境问题, 大陆用户和其他地区用户遇到的原因完全一致, 用官方原生安装脚本可以规避掉 npm 全局安装带来的绝大多数权限坑。",
    tags: ["claude-code", "windows", "安装", "权限"],
  },
  {
    slug: "claude-code-organization-disabled",
    tool: "Claude Code",
    title: "This organization has been disabled",
    errorText: "This organization has been disabled",
    symptom: "已有正常订阅且 claude.ai 网页能正常用, 但 Claude Code CLI 里执行任意命令都报这个错, 看起来像账户被封但其实不是。",
    causes: [
      "本地残留了指向另一个(已被禁用/异常)组织的 ANTHROPIC_API_KEY 环境变量, 覆盖了正常的订阅登录状态",
      "认证上下文混用了 Console 组织和订阅账户两套体系",
    ],
    fixes: [
      "检查并清除环境变量: echo $ANTHROPIC_API_KEY , 有值则 unset ANTHROPIC_API_KEY",
      "检查 shell 配置文件(~/.bashrc, ~/.zshrc 等)里是否有历史遗留的 export ANTHROPIC_API_KEY=xxx , 有则删除对应行",
      "清除后执行 /logout 再 /login 用订阅方式重新登录",
      "确认无误后再检查 claude.ai 网页端账户设置里组织状态是否确实存在异常",
    ],
    cnNote: "这条报错文案容易被误读成账号被封, 实际绝大多数是本地环境变量冲突导致, 与网络位置无关; 大陆用户经常因为之前配过 API Key 中转方案而残留该变量, 排查时优先检查这里。",
    tags: ["claude-code", "认证", "环境变量", "403"],
  },
  {
    slug: "claude-code-socks-proxy-unsupported",
    tool: "Claude Code",
    title: "配置 SOCKS 代理不生效",
    errorText: "fetch failed / ECONNREFUSED (使用 SOCKS5 代理地址时)",
    symptom: "把 HTTPS_PROXY 设置成 socks5://127.0.0.1:1080 这样的地址后, Claude Code 依然连不上或报错, 换成 http:// 前缀就正常。",
    causes: [
      "Claude Code 官方明确不支持 SOCKS 代理, 只认 HTTP/HTTPS 代理协议",
      "很多代理软件默认只开放 SOCKS5 端口, 没有同时开 HTTP 混合端口",
    ],
    fixes: [
      "在代理软件里额外开启一个 HTTP/HTTPS 代理端口(大多数代理客户端如 Clash 系列都支持同时监听 SOCKS 和 HTTP 混合端口)",
      "确认实际监听的 HTTP 端口号后设置: export HTTPS_PROXY=http://127.0.0.1:7890 (端口号以代理软件面板显示为准, 而非直接照抄 SOCKS 端口)",
      "用 curl -x http://127.0.0.1:7890 -I https://api.anthropic.com 先验证这个 HTTP 端口本身能否正常代理",
      "需要跳过代理直连的域名(如内网服务)通过 NO_PROXY 环境变量单独排除",
    ],
    cnNote: "国内主流代理客户端(Clash 系、V2Ray 系等)通常都提供 HTTP 混合端口选项, 大陆用户配置 Claude Code 时切记不要直接把平时科学上网用的 SOCKS5 地址原样填进 HTTPS_PROXY, 这是最常见的踩坑点。",
    tags: ["claude-code", "socks", "代理", "配置"],
  },
  {
    slug: "claude-code-proxy-fingerprint-base-url",
    tool: "Claude Code",
    title: "自定义 ANTHROPIC_BASE_URL 中转后行为异常",
    errorText: "无显式报错, 表现为响应中日期格式/标点异常或被判定为可疑路由",
    symptom: "把 ANTHROPIC_BASE_URL 指向非官方中转网关后, 部分用户发现系统提示词里日期格式发生变化, 或怀疑请求被额外标记。",
    causes: [
      "官方客户端曾内置对 ANTHROPIC_BASE_URL 指向非官方域名的探测逻辑(2026 年 6 月已被曝光并承诺修复), 会根据代理域名和时区做隐蔽标记",
      "中转网关本身与上游 API 版本不完全兼容导致的正常功能差异, 与探测机制无关",
    ],
    fixes: [
      "升级到 Anthropic 修复后的最新版本 Claude Code(2.1.197 及以后), 移除相关探测代码",
      "检查当前版本: claude --version , 过旧版本建议直接升级: npm install -g @anthropic-ai/claude-code@latest 或重新运行官方安装脚本",
      "若通过中转网关使用, 优先选择明确声明协议兼容、无额外注入行为的中转方案",
      "怀疑响应异常时可用 --print 模式单独打印原始返回内容比对, 定位问题出在客户端还是网关",
    ],
    cnNote: "该事件是 2026 年 6 月公开曝光的真实争议(官方在系统提示词日期行里隐藏编码标记大陆相关代理), 并非空穴来风; 大陆用户使用中转网关接入时, 建议保持客户端为修复后的最新版本, 减少不必要的行为差异。",
    tags: ["claude-code", "中转", "隐私", "base-url"],
  },
  {
    slug: "claude-code-doctor-diagnostic-first-step",
    tool: "Claude Code",
    title: "不确定具体报错原因时的通用排查入口",
    errorText: "各类未分类的启动失败 / 命令无响应 / 配置异常",
    symptom: "Claude Code 表现异常但报错信息模糊, 不属于以上任何明确分类, 不知从何下手排查。",
    causes: [
      "本地配置文件损坏或版本不匹配",
      "环境变量冲突(代理、API Key、BASE_URL 等叠加设置)",
      "网络与认证问题混合, 单靠报错文案无法区分层级",
    ],
    fixes: [
      "第一步始终先跑: claude /doctor , 会列出当前网络、认证、配置层面的具体问题项",
      "其次跑 claude /status 确认当前登录方式(订阅 vs API Key)和用量情况",
      "怀疑是环境变量冲突, 用干净终端(不 source 任何自定义 profile)重新测试一次做对照",
      "整理不清的情况可执行 claude /feedback 生成诊断包并自动预填 GitHub issue 提交给官方",
    ],
    cnNote: "大陆用户排查时建议先用 /doctor 区分清楚是网络层(代理/地域封锁)还是认证层(token/环境变量)问题, 再对号入座查上面对应条目, 避免代理和认证问题混在一起互相干扰判断。",
    tags: ["claude-code", "诊断", "doctor", "排查"],
  },
];

export function getErrorEntry(slug: string): ErrorEntry | undefined {
  return ERROR_KB.find((e) => e.slug === slug);
}
