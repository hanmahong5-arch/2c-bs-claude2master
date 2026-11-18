import { MCP_SERVERS_PART1 } from "./mcp-directory-part1";
import { MCP_SERVERS_PART2 } from "./mcp-directory-part2";
import {
  MCP_CATEGORIES,
  type McpCategory,
  type McpServer,
} from "./mcp-directory-types";

export { MCP_CATEGORIES, type McpCategory, type McpServer };

export const MCP_SERVERS: McpServer[] = [
  ...MCP_SERVERS_PART1,
  ...MCP_SERVERS_PART2,
];

export function getMcpServer(slug: string): McpServer | undefined {
  return MCP_SERVERS.find((s) => s.slug === slug);
}
