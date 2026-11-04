import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AppInvocationContract, AppCommandReply } from './index.js';
/** Public MCP SDK bridge; discover the same schemas used by @ commands and app help. */
export declare function registerAppCapabilities(server: McpServer, contract: AppInvocationContract, invoke: (input: string) => Promise<AppCommandReply | undefined>): void;
