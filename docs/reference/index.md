# 接口导航

## 选择接口层

| 接口 | 调用方 | 入口 |
| --- | --- | --- |
| App SDK | 静态应用契约与平台集成 | [SDK](sdk)、[应用页面 SDK](ui) |
| 能力SDK | 隔离页面或独立消费程序 | [能力客户端](capabilities) |
| 开发HTTP | 本地已授权消费身份 | [路由参考](http) |
| 可信Node接口 | 宿主集成与管理 | [安装包](packages)、[任务](tasks)、[服务](services) |
| MCP | 可信宿主连接标准MCP服务 | [适配](mcp) |
| 开发者中心HTTP | 受邀开发者/组织管理者及受限工具凭据 | [身份与组织](/center/identity)、[路由参考](/reference/developer-center) |
| CLI | 开发者构建/发布及可信操作者 | [命令](cli) |

没有向应用开放生产REST网关、任意Desktop管理API或平台登录凭据。可信Node接口不是可在业务iframe中使用的权限。类型声明不赋予运行权限。


## 按任务找参考

| 我想做的事 | 首选指南 → 方法参考 |
| --- | --- |
| 编写静态页面、查模型与存草稿 | [页面 SDK](/guides/browser-client) → [ui](/reference/ui)与[SDK 类型](/reference/sdk) |
| 编写签名共享应用与对话 | [共享教程](/getting-started/quickstart)、[共享对话](/capabilities/conversation) → [客户端](/reference/capabilities)、[HTTP](/reference/http) |
| 管理签名、安装、更新、授权与数据 | [发布维护](/publishing/installations) → [包接口](/reference/packages)、[CLI](/reference/cli) |
| 集成可信运行器与原任务 | [完整宿主示例](/support/examples) → [Broker](/reference/broker)、[Runtime](/reference/runtime)、[Tasks](/reference/tasks) |
| 集成原 Provider/产物恢复 | [服务接入](/capabilities/services) → [References](/reference/references)、[Services](/reference/services) |
| 集成既有应用宿主或 MCP | [应用契约](/guides/contracts) → [可信宿主](/reference/sdk-host)、[MCP](/reference/mcp) |

每个导出保留准确发布声明及中文语义；可选 `?` 字段与联合分支以声明为准，默认/单位/状态与错误见操作表及链接的权威指南。只读查询、准备/预览、明确批准和业务执行分别说明；类型或成功 HTTP 响应不赋予权限。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)

项目创建、不可变提交、审核与独立签名测试发布见[开发者中心HTTP](/reference/developer-center)及[项目与测试发布](/center/publishing)。
