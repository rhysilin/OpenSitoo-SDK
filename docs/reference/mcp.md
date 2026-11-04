# MCP 适配

仅可信 Node.js 宿主使用；应用能力到 MCP 工具的适配。参数、返回值和结构字段见下方 TypeScript 声明。安装与使用方式见[环境与工具](/getting-started/setup)，边界见[权限与确认](/guides/permissions)。


从 @sitoo/sdk/mcp 导入，仅可信宿主；需要集成方创建官方 McpServer 和 ApplicationProvider。此函数注册工具，不创建认证服务或批准票据。

## registerAppCapabilities

向官方 MCP server 注册本应用的帮助和调用工具，contract 为已校验契约，invoke 是宿主绑定回调；返回 void。只注册适配，不建立认证、目录授权或用户批准。 相关操作见[指南](/guides/contracts)。

```ts
export declare function registerAppCapabilities(server: McpServer, contract: AppInvocationContract, invoke: (input: string) => Promise<AppCommandReply | undefined>): void;
```



## 应用 MCP HTTP 协议


资料应用 MCP 服务的 loopback 地址与令牌由可信平台提供，不固定端口，也不向普通网页暴露。请求使用 `Authorization: Bearer <token>` 与 `Content-Type: application/json`，按 Streamable HTTP 协商 Accept，初始化后再列出和调用工具。

当前是无服务端 session ID 的 Streamable HTTP，POST /mcp；不存在专用 GET /tasks REST。未认证/账户不匹配 401；路径/Host/Origin 不符 403；认证通过但非 POST 405；传输内部失败可能 500。拒绝带 Origin 的浏览器请求，不能直接从网页 fetch。

通用工具 get_capabilities({id?})、invoke_capability({id,parameters})；parameters 序列化长度上限10000。调用示例（初始化后的官方 MCP client）：

```ts
await client.callTool({ name: 'get_capabilities', arguments: { id: 'scan' } });
await client.callTool({
  name: 'invoke_capability',
  arguments: { id: 'scan', parameters: { task: existingTaskId } },
});
```

资料领域工具：

| 工具             | 参数                                | 行为                                   |
| ---------------- | ----------------------------------- | -------------------------------------- |
| list_tasks       | {}                                  | 当前账户任务摘要，最多30               |
| get_task         | id:UUID,offset?:整数>=0,limit?:1–30 | 默认 offset=0/limit=20，返回文件分页   |
| scan_task        | id:UUID                             | 异步扫描已授权目录                     |
| update_plan      | id,revision:正整数,rules?,edits?    | 修改方案，最多500 edits                |
| request_delivery | id,revision                         | 返回 requiresUserApproval，不批准/执行 |
| cancel_task      | id                                  | 请求停止，保留原文件和已有输出         |

MCP 调用结果 content 包含 text，通用 invoke 还有 structuredContent；工具错误查看 isError，不能只判断 HTTP 200。HTTP 错误与业务工具错误不是同一层。MCP 不提供创建目录授权或签票工具。


## SDK 适配器调用上下文

下面是可信初始化片段；server 是已经创建的官方 @modelcontextprotocol/sdk McpServer，contract 是 AppCatalog 中的 invocation，provider 是该应用可信 ApplicationProvider。它们由宿主配置，不接受模型输入。

```js
import { registerAppCapabilities } from '@sitoo/sdk/mcp';
// 只把调用分派绑定到此应用；批准票据签发仍留在可信主界面。
function attachApplication(server, contract, provider) {
  registerAppCapabilities(server, contract, input => provider.invoke(input));
}
```

registerAppCapabilities 返回 void；注册后通过官方 MCP client initialize/listTools 查看帮助/调用工具，callTool 检查 isError 与 content/structuredContent，不以 HTTP 200 当作业务成功。认证与 transport 由集成方建立；本适配器不建立外网网关，也不替资料领域工具创建目录授权。只读 get_task 与明确批准后的交付执行分开。

---

[接口导航](/reference/) · [文档首页](/) · [支持范围](/getting-started/compatibility)
