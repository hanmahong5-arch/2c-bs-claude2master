// mcp-directory.ts — MCP Server 中文目录(单一信息源)
//
// 定位: 面向中国大陆用户的"MCP Server 装哪个 / 怎么配 / 大陆能不能直连"速查目录。
// 与其他库的分工: 雷达=发版动态, 教程=怎么用工具, 报错库=出错自救, 本目录=选型+接入。
// 内容规范:
// - 每条的 pkg / remote / install 均经官方 repo 或文档核实(sourceUrl), 查不到的字段宁缺毋滥;
// - cnDirect = "运行期服务端点大陆能否直连"(本地类 server 记 true, 海外托管端点记 false);
// - needsKey = 是否必须 API key/token 才能用;
// - note 记安全/归档/配置坑, 中性表述, 不夸大。

export type McpCategory =
  | "官方参考"
  | "编码与代码库"
  | "浏览器与网页"
  | "数据与后端"
  | "国内直连";

/** 分类展示顺序 */
export const MCP_CATEGORIES: McpCategory[] = [
  "官方参考",
  "编码与代码库",
  "浏览器与网页",
  "数据与后端",
  "国内直连",
];

export interface McpServer {
  /** kebab-case 唯一 slug, 路由 /mcp/<slug> */
  slug: string;
  /** 展示名 */
  name: string;
  /** 提供方中文 */
  vendor: string;
  category: McpCategory;
  /** 本地启动方式 / 托管接入方式 */
  runtime: "npx" | "uvx" | "docker" | "hosted";
  /** 主安装/启动命令(本地类); 托管类给接入说明 */
  install: string;
  /** 官方托管 remote endpoint, 无则空串 */
  remote: string;
  /** 是否需要 API key / token */
  needsKey: boolean;
  /** 运行期服务端点大陆能否直连 */
  cnDirect: boolean;
  /** 一句话功能 */
  descZh: string;
  /** 详情说明(为什么用 / 典型场景), 2-3 句 */
  detail: string;
  /** 注意事项(安全/归档/配置坑), 无则空串 */
  note: string;
  /** 官方 repo / 文档 URL */
  sourceUrl: string;
  tags: string[];
}

export const MCP_SERVERS: McpServer[] = [
  // ── 官方参考(Anthropic 维护的 7 个 reference server) ──
  {
    slug: "filesystem",
    name: "Filesystem",
    vendor: "官方参考",
    category: "官方参考",
    runtime: "npx",
    install: "npx -y @modelcontextprotocol/server-filesystem <允许访问的目录>",
    remote: "",
    needsKey: false,
    cnDirect: true,
    descZh: "带目录白名单的安全本地文件读写。",
    detail:
      "给模型受控的本地文件操作能力: 读、写、移动、检索, 只能碰你在参数里显式授权的目录。是最多人安装的 MCP server 之一。注意: Claude Code 已内置文件工具, 通常无需再装它。",
    note: "至少配置一个允许目录, 否则初始化报错; 授权目录即最小权限边界, 不要图省事直接给整个磁盘根。",
    sourceUrl: "https://github.com/modelcontextprotocol/servers",
    tags: ["官方", "文件", "本地"],
  },
  {
    slug: "fetch",
    name: "Fetch",
    vendor: "官方参考",
    category: "官方参考",
    runtime: "uvx",
    install: "uvx mcp-server-fetch",
    remote: "",
    needsKey: false,
    cnDirect: true,
    descZh: "抓取网页并转 Markdown 供模型高效阅读。",
    detail:
      "把任意 URL 的网页正文抓下来、转成精简 Markdown 再喂给模型, 省 token 且更好读。适合让模型现场查文档、读文章。",
    note: "可访问内网 IP 有 SSRF 风险, 生产环境注意隔离; 默认遵守 robots.txt; Windows 下中文乱码可设 PYTHONIOENCODING=utf-8。",
    sourceUrl: "https://github.com/modelcontextprotocol/servers",
    tags: ["官方", "网页", "抓取"],
  },
  {
    slug: "memory",
    name: "Memory",
    vendor: "官方参考",
    category: "官方参考",
    runtime: "npx",
    install: "npx -y @modelcontextprotocol/server-memory",
    remote: "",
    needsKey: false,
    cnDirect: true,
    descZh: "基于知识图谱的持久化记忆。",
    detail:
      "用知识图谱(实体+关系)记住跨会话的信息, 让模型在多次对话间保留上下文。存储落在本地 JSONL 文件。",
    note: "可用 MEMORY_FILE_PATH 自定义存储路径; 旧 docker 部署升级时需删除缓存的 index.js。",
    sourceUrl: "https://github.com/modelcontextprotocol/servers",
    tags: ["官方", "记忆", "知识图谱"],
  },
  {
    slug: "sequential-thinking",
    name: "Sequential Thinking",
    vendor: "官方参考",
    category: "官方参考",
    runtime: "npx",
    install: "npx -y @modelcontextprotocol/server-sequential-thinking",
    remote: "",
    needsKey: false,
    cnDirect: true,
    descZh: "结构化分步推理, 支持修订与分支。",
    detail:
      "把复杂问题拆成一串可回溯、可修订、可分支的思考步骤, 让模型的推理过程更有条理。适合规划、多步分析类任务。",
    note: "包内目录名为 sequentialthinking(无连字符); 可设 DISABLE_THOUGHT_LOGGING=true 关闭思考日志。",
    sourceUrl: "https://github.com/modelcontextprotocol/servers",
    tags: ["官方", "推理", "规划"],
  },
  {
    slug: "git",
    name: "Git",
    vendor: "官方参考",
    category: "官方参考",
    runtime: "uvx",
    install: "uvx mcp-server-git --repository <仓库路径>",
    remote: "",
    needsKey: false,
    cnDirect: true,
    descZh: "读取、搜索与操作本地 Git 仓库。",
    detail:
      "让模型直接对本地 Git 仓库做 status/diff/log/commit 等操作, 无需你手动复制粘贴代码状态。",
    note: "官方 README 声明处于早期开发, 工具集可能变动; 给写权限前确认仓库已备份。",
    sourceUrl: "https://github.com/modelcontextprotocol/servers",
    tags: ["官方", "git", "版本控制"],
  },
  {
    slug: "time",
    name: "Time",
    vendor: "官方参考",
    category: "官方参考",
    runtime: "uvx",
    install: "uvx mcp-server-time",
    remote: "",
    needsKey: false,
    cnDirect: true,
    descZh: "当前时间查询与 IANA 时区换算。",
    detail:
      "给模型一个可靠的「现在几点」和跨时区换算能力, 弥补大模型没有实时时钟的短板。",
    note: "自动检测系统时区, 可用 --local-timezone 覆盖。",
    sourceUrl: "https://github.com/modelcontextprotocol/servers",
    tags: ["官方", "时间", "时区"],
  },
  {
    slug: "everything",
    name: "Everything",
    vendor: "官方参考",
    category: "官方参考",
    runtime: "npx",
    install: "npx -y @modelcontextprotocol/server-everything",
    remote: "",
    needsKey: false,
    cnDirect: true,
    descZh: "覆盖协议全特性的参考测试 server。",
    detail:
      "把 MCP 协议的 prompts/resources/tools 全部特性演示一遍, 是给 MCP 客户端开发者做集成测试用的样板, 不是日常生产工具。",
    note: "官方明确它非实用 server, 仅供开发者测试客户端实现。",
    sourceUrl: "https://github.com/modelcontextprotocol/servers",
    tags: ["官方", "测试", "开发"],
  },

  // ── 编码与代码库 ──
  {
    slug: "github",
    name: "GitHub",
    vendor: "GitHub",
    category: "编码与代码库",
    runtime: "docker",
    install: "docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server",
    remote: "https://api.githubcopilot.com/mcp/",
    needsKey: true,
    cnDirect: false,
    descZh: "读代码、管理 issue/PR、自动化仓库工作流。",
    detail:
      "官方 GitHub MCP: 让模型跨组织搜代码、读写 issue 与 PR、评论、触发工作流。以写代码为生的开发者通常第一个装它。本地跑 docker 镜像, 也有官方托管 remote。",
    note: "本地为 docker 镜像非 npm 包; 需 GitHub PAT 或 OAuth; 托管端点 api.githubcopilot.com 大陆访问不稳定, 建议配好代理再用。",
    sourceUrl: "https://github.com/github/github-mcp-server",
    tags: ["编码", "github", "官方", "需key"],
  },
  {
    slug: "context7",
    name: "Context7",
    vendor: "Upstash",
    category: "编码与代码库",
    runtime: "npx",
    install: "npx -y @upstash/context7-mcp",
    remote: "https://mcp.context7.com/mcp",
    needsKey: true,
    cnDirect: false,
    descZh: "拉取最新版本化库文档进上下文, 防 API 幻觉。",
    detail:
      "把版本锁定的官方文档实时注入提示词, 让模型不再凭记忆编造过时或不存在的 API。和 GitHub MCP 是公认的编码必备组合。",
    note: "有免费 key(context7.com/dashboard), 无 key 也能用但会限流; 托管端点在海外, 大陆直连不稳定。",
    sourceUrl: "https://github.com/upstash/context7",
    tags: ["编码", "文档", "防幻觉"],
  },
  {
    slug: "sentry",
    name: "Sentry",
    vendor: "Sentry",
    category: "编码与代码库",
    runtime: "hosted",
    install: "官方推荐托管接入, stdio 备选: npx @sentry/mcp-server@latest",
    remote: "https://mcp.sentry.dev",
    needsKey: true,
    cnDirect: false,
    descZh: "自然语言查询报错、trace 与性能数据。",
    detail:
      "用大白话问「最近哪个接口报错最多」「这条异常的堆栈是什么」, 直接从 Sentry 拉出错误、追踪与性能数据。官方主推托管 remote(OAuth)。",
    note: "stdio 备选需 Sentry User Auth Token; 托管端点在海外。",
    sourceUrl: "https://github.com/getsentry/sentry-mcp",
    tags: ["编码", "监控", "报错", "需key"],
  },
  {
    slug: "cloudflare",
    name: "Cloudflare",
    vendor: "Cloudflare",
    category: "编码与代码库",
    runtime: "hosted",
    install: "无原生 remote 支持的客户端用: npx mcp-remote https://<service>.mcp.cloudflare.com/mcp",
    remote: "https://<service>.mcp.cloudflare.com/mcp",
    needsKey: true,
    cnDirect: false,
    descZh: "官方 hosted server 群: Workers/可观测/DNS 等。",
    detail:
      "不是单个 server, 而是按服务拆成多个托管端点(docs、bindings、observability 等), 让模型管理 Cloudflare 资源、查日志、部署 Worker。",
    note: "按服务分端点, 需要哪块连哪个; 无 docker 镜像; 老客户端用 mcp-remote 桥接; 端点在海外。",
    sourceUrl: "https://github.com/cloudflare/mcp-server-cloudflare",
    tags: ["编码", "cloudflare", "运维", "需key"],
  },

  // ── 浏览器与网页 ──
  {
    slug: "playwright",
    name: "Playwright",
    vendor: "Microsoft",
    category: "浏览器与网页",
    runtime: "npx",
    install: "npx @playwright/mcp@latest",
    remote: "",
    needsKey: false,
    cnDirect: true,
    descZh: "基于无障碍快照的浏览器自动化。",
    detail:
      "让模型操作真实浏览器: 点击、填表、导航、抓数据。用可访问性结构树而非截图, 执行更快、更省 token、交互更准。生态里流量最高的 server 之一。",
    note: "另有 docker 镜像 mcr.microsoft.com/playwright/mcp; 控制的是本地浏览器, 无外部托管端点。",
    sourceUrl: "https://github.com/microsoft/playwright-mcp",
    tags: ["浏览器", "自动化", "测试", "官方"],
  },
  {
    slug: "chrome-devtools",
    name: "Chrome DevTools",
    vendor: "Google Chrome",
    category: "浏览器与网页",
    runtime: "npx",
    install: "npx -y chrome-devtools-mcp@latest",
    remote: "",
    needsKey: false,
    cnDirect: true,
    descZh: "驱动并检查真实 Chrome: 调试与性能分析。",
    detail:
      "把 Chrome 开发者工具的能力开放给模型: 自动化操作、抓网络请求、跑性能 trace、定位前端问题。适合调试和性能优化场景。",
    note: "trace 默认上报 Google CrUX, 可加 --no-performance-crux 关闭; 控制本地 Chrome, 无外部托管端点。",
    sourceUrl: "https://github.com/ChromeDevTools/chrome-devtools-mcp",
    tags: ["浏览器", "调试", "性能", "官方"],
  },
  {
    slug: "brave-search",
    name: "Brave Search",
    vendor: "Brave",
    category: "浏览器与网页",
    runtime: "npx",
    install: "npx -y @brave/brave-search-mcp-server",
    remote: "",
    needsKey: true,
    cnDirect: false,
    descZh: "网页/本地/图片/视频/新闻检索与 AI 摘要。",
    detail:
      "给模型独立于大厂的实时网络搜索能力, 覆盖网页、本地商户、图片、视频、新闻多种检索, 并带 AI 摘要。取代了官方已归档的旧版搜索 server。",
    note: "必需 BRAVE_API_KEY 环境变量; 另有 docker 镜像 docker.io/mcp/brave-search; 2.x 有迁移文档; 服务端在海外。",
    sourceUrl: "https://github.com/brave/brave-search-mcp-server",
    tags: ["搜索", "网页", "需key"],
  },
  {
    slug: "firecrawl",
    name: "Firecrawl",
    vendor: "Firecrawl",
    category: "浏览器与网页",
    runtime: "npx",
    install: "npx -y firecrawl-mcp",
    remote: "https://mcp.firecrawl.dev/v2/mcp",
    needsKey: false,
    cnDirect: false,
    descZh: "网页搜索/抓取/交互, 返回结构化数据。",
    detail:
      "把整站抓取、搜索、页面交互打包成 agent 友好的结构化数据(适合喂 RAG 或做数据管道)。免费档可无 key 试用, 全功能需 API key。",
    note: "keyless 免费档限流; 全功能需 API key; 托管端点在海外。",
    sourceUrl: "https://github.com/firecrawl/firecrawl-mcp-server",
    tags: ["抓取", "搜索", "数据"],
  },

  // ── 数据与后端 ──
  {
    slug: "supabase",
    name: "Supabase",
    vendor: "Supabase",
    category: "数据与后端",
    runtime: "npx",
    install: "npx -y @supabase/mcp-server-supabase",
    remote: "https://mcp.supabase.com/mcp",
    needsKey: true,
    cnDirect: false,
    descZh: "管理 Supabase 项目: 查库、执行 SQL、部署函数。",
    detail:
      "让模型直接操作 Supabase 后端: 查询数据库、跑 SQL、部署边缘函数、管理分支。适合全栈开发时把数据库操作交给模型。",
    note: "另有托管版(OAuth 登录); Supabase 为海外服务, 大陆直连不稳定, 建议配代理。",
    sourceUrl: "https://github.com/supabase-community/supabase-mcp",
    tags: ["数据库", "后端", "需key"],
  },
  {
    slug: "postgres",
    name: "Postgres MCP Pro",
    vendor: "Crystal DBA",
    category: "数据与后端",
    runtime: "uvx",
    install: "uvx postgres-mcp --access-mode restricted",
    remote: "",
    needsKey: false,
    cnDirect: true,
    descZh: "Postgres 调优: 索引建议、EXPLAIN 分析、健康检查。",
    detail:
      "面向 Postgres 的深度助手: 索引调优、执行计划分析、数据库健康检查, 还能按需限制为只读或读写。连自建库尤其顺手。",
    note: "仅需数据库连接串, 无外部 API 依赖; PyPI 大陆可走镜像加速。",
    sourceUrl: "https://github.com/crystaldba/postgres-mcp",
    tags: ["数据库", "postgres", "调优"],
  },
  {
    slug: "notion",
    name: "Notion",
    vendor: "Notion",
    category: "数据与后端",
    runtime: "npx",
    install: "npx -y @notionhq/notion-mcp-server",
    remote: "",
    needsKey: true,
    cnDirect: false,
    descZh: "查询数据库、创建/编辑页面、搜索内容。",
    detail:
      "官方 Notion MCP: 让模型读写你的 Notion 工作区——查数据库、建页面、改内容、全局搜索。适合把 Notion 当知识库或任务面板联动。",
    note: "官方推荐远程托管版, 本地包声明未来可能弃用; Notion 大陆访问不稳定。",
    sourceUrl: "https://github.com/makenotion/notion-mcp-server",
    tags: ["协作", "文档", "需key"],
  },
  {
    slug: "stripe",
    name: "Stripe",
    vendor: "Stripe",
    category: "数据与后端",
    runtime: "npx",
    install: "npx -y @stripe/mcp",
    remote: "https://mcp.stripe.com",
    needsKey: true,
    cnDirect: false,
    descZh: "调用 Stripe: 客户、商品、支付、退款、发票。",
    detail:
      "官方 agent-toolkit 里的 MCP, 让模型操作 Stripe 的客户、商品、支付、退款、发票等对象。适合把订单/账单流程交给模型辅助处理。",
    note: "需 STRIPE_SECRET_KEY(建议用 restricted key 控权); 有托管版(OAuth); Stripe 不支持中国大陆主体开户。",
    sourceUrl: "https://github.com/stripe/agent-toolkit",
    tags: ["支付", "海外", "需key"],
  },

  // ── 国内直连 ──
  {
    slug: "amap",
    name: "高德地图 MCP",
    vendor: "高德开放平台",
    category: "国内直连",
    runtime: "hosted",
    install: "托管接入 https://mcp.amap.com/mcp?key=<高德key>, 或本地: npx -y @amap/amap-maps-mcp-server",
    remote: "https://mcp.amap.com/mcp?key=<高德key>",
    needsKey: true,
    cnDirect: true,
    descZh: "地理编码、POI 搜索、路径规划、天气等 12 项。",
    detail:
      "高德官方出行 MCP, 一次接入拿到地理编码、POI 搜索、路径规划、天气、IP 定位等十余项能力。国内地图/出行场景的直连首选。",
    note: "大陆直连友好; 需注册高德开放平台开发者(实名认证)并创建 Web 服务 Key。",
    sourceUrl: "https://lbs.amap.com/api/mcp-server/gettingstarted",
    tags: ["国内", "地图", "出行", "需key"],
  },
  {
    slug: "alipay",
    name: "支付宝 MCP",
    vendor: "支付宝开放平台",
    category: "国内直连",
    runtime: "npx",
    install: "npx -y @alipay/mcp-server-alipay",
    remote: "",
    needsKey: true,
    cnDirect: true,
    descZh: "创建手机/网页支付订单、查单、退款。",
    detail:
      "支付宝官方 MCP: 让模型创建手机/电脑网站支付订单、查询交易、发起与查询退款。把收款流程接进 agent 的国内直连方案。",
    note: "须为支付宝开放平台收款商户(企业实名+开通网站支付), 配 AP_APP_ID/AP_APP_KEY 等 env; 官方建议申请 MCP 场景受限密钥, 私钥切勿托管三方。",
    sourceUrl: "https://www.npmjs.com/package/@alipay/mcp-server-alipay",
    tags: ["国内", "支付", "官方", "需key"],
  },
  {
    slug: "minimax",
    name: "MiniMax MCP",
    vendor: "MiniMax",
    category: "国内直连",
    runtime: "uvx",
    install: "uvx minimax-mcp",
    remote: "",
    needsKey: true,
    cnDirect: true,
    descZh: "文本转语音、声音克隆、视频与图像生成。",
    detail:
      "MiniMax 官方 MCP, 把语音合成、声音克隆、视频与图像生成的多模态能力开放给模型。国内做内容生成的直连选项。",
    note: "国内版 key 取自 platform.minimaxi.com, host 须配 https://api.minimaxi.com(与国际版 minimax.io 不互通, 错配会报 invalid api key); 另有 JS 版。",
    sourceUrl: "https://github.com/MiniMax-AI/MiniMax-MCP",
    tags: ["国内", "语音", "多模态", "需key"],
  },
];

export function getMcpServer(slug: string): McpServer | undefined {
  return MCP_SERVERS.find((s) => s.slug === slug);
}
