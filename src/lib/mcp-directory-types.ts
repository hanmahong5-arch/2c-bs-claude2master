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

