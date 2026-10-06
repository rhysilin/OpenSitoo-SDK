# Sitoo API 参考手册

维护日期：2026-10-06。对应当前源码；App SDK 0.0.2，能力/任务契约 1。本文描述现有接口，不代表已发布公共 REST API。

## 1. 接口边界与入口

认证服务返回 HTTP 429 时，Desktop IPC 错误码为 RATE_LIMITED；错误信息区分限流与会话失效，有有效 Retry-After 时显示保守等待秒数，不自动重试。登录失败的 signed-out 事件保留 message，账户已连接时的限流不会作为 401 自动退出。New API 身份认证、刷新、OAuth 和凭据读取可能共享按 IP 的关键操作限流，外部身份页面登录成功不代表所有网关步骤已完成。

分组凭据已创建但读取失败时，后续主动重试复用尚未过期的记录，只重新读取凭据，不反复删除和新建。会话结束仍清理该记录；服务器实际限流策略由 New API 管理。

| 类型             | 入口                                                 | 调用方与状态                                                           |
| ---------------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| App SDK          | @pi-market/sdk、/host、/mcp                          | 应用声明与可信服务端；详见 [开发者手册](./33-app-sdk-developer-guide.md) |
| Desktop IPC      | window.piMarket                                      | 当前 Desktop 主窗口 renderer；不向第三方应用直接开放完整桥             |
| 应用 MCP         | POST http://127.0.0.1:<动态端口>/mcp                 | 平台绑定的可信 MCP 客户端，账户 token 鉴权                             |
| 生图私有 HTTP 桥 | POST http://127.0.0.1:<动态端口>/tool                | Runtime 扩展，不是公开生图 API                                         |
| 模型私有代理     | POST http://127.0.0.1:<动态端口>/v1/chat/completions | Runtime，真实模型凭据留在 Desktop                                      |
| 更新测试服务器   | GET/HEAD latest.yml、安装包、packages/catalog.json   | 本地验收用下载服务，不是专业应用发布管理 API                           |

`server/` 当前仅占位。登录、账单、模型调度使用外部 New API；其 /api 与 /v1 接口不是本仓库实现。没有现成的 /api/apps/install、资源包安装或 spkg REST 接口，不应据设计文档调用这些路径。

## 2. Desktop 约定

权威定义：preload.ts，执行处理：main.ts。DesktopApi 类型通过 `typeof desktopApi` 导出；返回数据类型以该文件引用的实际类型为准。

JS 调用形式为 `await window.piMarket.<模块>.<方法>(参数)`，不是 HTTP。下表省略 Promise：除事件订阅和 applications.images 外，方法均异步。? 表示可选参数；字符串方法名和大小写不能修改。

底层 IPC 响应为 `{ok:true,value:T}` 或 `{ok:false,error:{code,message}}`。preload 返回 value，失败保留 error.code。应用 apps:* 错误额外包含 retryable/action，preload 抛 AppSdkError，转发到隔离浏览器客户端时保留安全分类信息；不转发堆栈与原始宿主路径。不要解析中文错误文字作为稳定协议。void 成功可能是 undefined。

主进程只允许当前 mainWindow 的主 frame 调用，其他发送方返回 FORBIDDEN。此处保护可信 Desktop，不能当作第三方应用的身份沙盒。账户要求和参数校验由具体处理器执行。用户取消系统目录选择时部分接口正常返回 undefined，不是异常。

## 3. 应用与配置 API

| 方法                       | 参数                                                                                            | 返回                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------- |
| applications.list          | 无                                                                                              | RegisteredApp[]                         |
| applications.tasks         | appId:string                                                                                    | AppTask[]                               |
| applications.task          | appId:string,id:string                                                                          | AppTask                                 |
| applications.configuration | appId:string                                                                                    | AppConfigState                          |
| applications.configure     | `appId:string,revision:number,values:Record<string,unknown>,credentials?:Record<string,string>` | AppConfigState                          |
| applications.images        | appId:string                                                                                    | AppImages（同步绑定对象，内部方法异步） |

applications.images 的 getCapabilities、generate(request)、getTask(id)、listTasks、getArtifact(id) 分别返回 SitooImageCapabilities、SitooImageTask、SitooImageTask、SitooImageTask[]、`{mimeType:'image/png',dataUrl:string}`。需要应用声明 sitoo_image:generate；账户切换后旧绑定失效。当前可信窗口可传 appId，这不是不可信 UI 能自报身份的第三方授权方案。

静态应用新增以下受控桥。完整 window.piMarket 仅可信主窗口可用；应用 iframe 只能使用 SDK /ui 的窄接口，身份由主进程签发的随机会话绑定，不能自报 appId。

| 方法                              | 参数                                  | 返回及边界                                                                                                                                             |
| --------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| applications.market               | 无                                    | AppMarketState，签名目录、当前账户安装项、离线 warning                                                                                                 |
| applications.install              | id,digest,permissions:string[]        | InstalledApplication；重新核验市场摘要与用户确认的权限，再原子激活                                                                                     |
| applications.uninstall            | id                                    | void；阻止活跃任务，撤销会话，保留数据                                                                                                                 |
| applications.rollback             | id                                    | InstalledApplication；只切回上一已校验缓存包，无数据迁移                                                                                               |
| applications.open                 | id                                    | {token,url}；仅已安装应用，可撤销的账户绑定会话                                                                                                        |
| applications.close                | token                                 | void；关闭桥，不取消上游任务                                                                                                                           |
| applications.invoke               | token,capability,parameters,requestId | 绑定能力结果；schema 与身份校验，付费请求冻结参数并沿用幂等 ID                                                                                         |
| applications.imageOperation       | token,operation,taskId?               | operation 为 image-capabilities/image-tasks/image-task/image-artifact；只有生图权限可调用，仅本应用任务                                                |
| applications.platformCapabilities | token                                 | AppPlatformCapabilities；已安装包绑定的身份、SDK 版本、实际支持能力和配额                                                                              |
| applications.storage              | token,operation,input                 | AppDataRecord/null 或 AppDataPage；storage-get 接收 id，storage-list 接收分页对象，storage-put 接收 AppDataWrite，storage-delete 接收 id/revision 对象 |
| applications.resources            | token,packId?,resourceId?             | 本应用随包资源声明，或已校验文本和 snapshot；无任意文件路径访问                                                                                        |
| applications.sessionConfiguration | token,revision?,values?               | AppConfigState；本应用普通配置，revision 防陈旧覆盖，无凭据写入                                                                                        |
| applications.importDevelopment    | 无                                    | DevelopmentPackagePreview或undefined；只选取和校验文件，尚未安装；正式客户端禁止                                                                       |
| applications.installDevelopment   | token,permissions:string[]            | InstalledApplication；五分钟、账户绑定的一次性确认，权限须与已选择文件一致                                                                             |

明确 @ 命令仍走 workbench.send；已安装静态应用可以帮助和明确调用，自然语言 MCP 接入尚需通用应用路由。Host 的 approve/executeApproved 不暴露给第三方 UI。

服务器新增 GET/HEAD apps/metadata/{root,targets,snapshot,timestamp}.json、版本 root 元数据和 apps/targets/{catalog.json,sha256.spkg} 的固定安全路径。服务仅托管文件，不持有私钥。部署配置 appRepository.url/trustedRoot 由维护方提供，客户端禁止从远程自动建立初始信任。

AppTask 字段及状态、AppConfigState、参数转换、凭据和审批见 [SDK 手册](./33-app-sdk-developer-guide.md)。配置使用当前 revision 保存；credentials 省略保留、空字符串删除，响应只返回凭据是否配置。不能把密钥写入普通 values。

```ts
const api = window.piMarket;
const state = await api.applications.configuration('sitoo.materials');
await api.applications.configure(state.appId, state.revision, {
  ...state.values,
  prefix: '项目A_',
});
const tasks = await api.applications.tasks('sitoo.materials');
```

此示例在已登录 Desktop renderer 使用，不在普通浏览器/Node 使用。遇到并发配置错误先刷新，禁止静默覆盖。

## 4. 图像与作品 API

| 方法                 | 参数                                  | 返回                                        |
| -------------------- | ------------------------------------- | ------------------------------------------- |
| images.configuration | 无                                    | SitooImageConfiguration                     |
| images.configure     | value:SitooImageConfiguration         | SitooImageConfiguration                     |
| images.capabilities  | 无                                    | SitooImageCapabilities                      |
| images.models        | group?:string                         | {groups:{id,description}[],models:string[]} |
| images.generate      | request:SitooImageRequest             | SitooImageTask                              |
| images.tasks         | 无                                    | SitooImageTask[]                            |
| images.task          | id:string                             | SitooImageTask                              |
| images.artifact      | id:string                             | {mimeType:'image/png',dataUrl:string}       |
| works.configuration  | 无                                    | WorksConfiguration                          |
| works.pickDirectory  | revision:number                       | WorksConfiguration                          |
| works.list           | 无                                    | WorkItem[]                                  |
| works.pending        | 无                                    | SitooImageTask[]                            |
| works.preview        | id:string,full?:boolean（默认 false） | string（图像预览数据）                      |
| works.reveal         | id:string                             | void                                        |

SitooImageRequest：prompt 必填，可选 aspectRatio、resolution（1K/2K/4K）、references:string[]。数量/比例等实际能力先查询 capabilities；模型、分组和凭据通过平台配置，不放在 generate 参数中。generate 会审批、提交并返回任务，不承诺立即得到图片，也不能当作免费试用。

images.tasks 当前合并 desktop/chat 来源、按创建时间降序、最多 50 条；不是所有应用的全局任务列表。应用来源用 applications.images(appId)。images.artifact 的 id 当前是任务 ID，具体实现核对任务归属后读取产物，不传作品文件路径。

生成成功不等于保存成功。未知结果先查询原任务，禁止自动重提付费操作。无取消上游接口。作品只登记成功保存产物，失败任务不作为作品。

works.list 除当前账户内部索引外，会从已配置保存目录的 `图片/` 恢复本产品生成的 `.png.json` 元数据：校验文件类型、尺寸、PNG 标识、摘要和时间后补建索引。使用目录中实际文件位置，不信任元数据中的绝对路径；损坏、摘要不匹配或链接文件不导入。不扫描未配置目录，不搬迁或改写原图片。用户主动选择已有作品目录时，该目录中有效作品可在当前账户中重新展示。

WorksConfiguration 为 revision/directory。WorkItem 含 id/kind/filename/prompt/generatedAt/savedAt/model/group/referenceCount/caller/bytes/sha256，可选 resolution/aspectRatio/width/height/gatewayTaskId，见 works.ts。保存位置改变只影响后续保存，不自动搬迁旧作品；pickDirectory 由系统选择器授权。

## 5. 资料应用领域 API

| 方法              | 参数                                                                          | 返回                            |
| ----------------- | ----------------------------------------------------------------------------- | ------------------------------- |
| materials.list    | 无                                                                            | MaterialsRun[]                  |
| materials.create  | rules:MaterialsRules                                                          | MaterialsRun或undefined（取消） |
| materials.get     | id:string                                                                     | MaterialsRun                    |
| materials.scan    | id:string                                                                     | MaterialsRun                    |
| materials.update  | id:string,revision:number,rules?:MaterialsRules,edits?:{id,target,included}[] | MaterialsRun                    |
| materials.cancel  | id:string                                                                     | MaterialsRun                    |
| materials.preview | id:string,file:string                                                         | string                          |
| materials.deliver | id:string,revision:number                                                     | MaterialsRun或undefined（取消） |
| materials.open    | id:string                                                                     | void                            |

create 不接受目录路径，使用系统选择器。deliver 选输出目录并显示真实确认，再由主进程签票执行；不是无交互交付。scan 为异步任务，get 查询真实状态。领域 status 为 draft/scanning/review/delivering/completed/failed/cancelled，与通用 AppTask 分开。

MaterialsRules 必填 title（1–80）、groupBy（type/original）、deduplicate:boolean、prefix（<=40，字母数字下划线连字符）、requiredExtensions:string[]（最多20，格式如 .pdf）。更新 edits 最多500，revision 必须最新。MaterialsRun/MaterialsFile 完整字段见 service.ts；预览、交付与打开均经过业务权限检查。

## 6. 对话工作台 API

| 方法                         | 参数                                                                            | 返回                 |
| ---------------------------- | ------------------------------------------------------------------------------- | -------------------- |
| workbench.getState           | 无                                                                              | WorkbenchState       |
| workbench.newSession         | 无                                                                              | void                 |
| workbench.openSession        | id:string                                                                       | void                 |
| workbench.updateSession      | id:string,action:rename/archive/unarchive/delete,name?:string                   | void                 |
| workbench.send               | text:string,images?:WorkbenchImage[],application?:{appId,command,hasExtraInput} | void                 |
| workbench.resend             | id:string,text?:string,images?:WorkbenchImage[]                                 | void                 |
| workbench.abort              | 无                                                                              | void                 |
| workbench.selectModel        | id:string                                                                       | void                 |
| workbench.setReasoningEffort | effort:ReasoningEffort                                                          | void                 |
| workbench.setApprovalMode    | mode:manual/auto/full                                                           | void                 |
| workbench.answerDialog       | id:string,response:{cancelled?,confirmed?,value?}                               | void                 |
| workbench.selectProject      | 无                                                                              | void                 |
| workbench.projectChanges     | 无                                                                              | ProjectReview        |
| workbench.projectDiff        | filename:string                                                                 | ProjectDiff          |
| workbench.runTest            | command:string                                                                  | void                 |
| workbench.onEvent            | listener:(WorkbenchEvent)=>void                                                 | 取消订阅函数（同步） |

send/resend/runTest 的 void 表示请求已交给处理器，不表示模型回复、测试或外部任务完成。用 getState/onEvent 查看实际状态。runTest 会执行命令，不能拿任意字符串作无副作用示例。忙碌/待审批时切换模式受限制。abort 不保证上游付费任务取消。

应用明确命令示例：

```ts
await window.piMarket.workbench.send('', undefined, {
  appId: 'sitoo.materials',
  command: 'help',
  hasExtraInput: false,
});
const unsubscribe = window.piMarket.workbench.onEvent((event) => console.log(event));
// 组件卸载时调用 unsubscribe()，避免重复事件处理。
```

事件和消息类型以 workbench-types.ts 的实际联合类型为准，按 type 分支处理，不将原始事件日志直接作为用户交付内容。

## 7. Runtime 设置与扩展市场

| 方法                            | 参数                                    | 返回               |
| ------------------------------- | --------------------------------------- | ------------------ |
| capabilities.getState           | 无                                      | CapabilityState    |
| capabilities.update             | key:CapabilityKey,enabled:boolean       | CapabilityState    |
| capabilities.apply              | 无                                      | CapabilityState    |
| capabilities.configure          | configuration:RuntimeConfiguration      | CapabilityState    |
| capabilities.mcpAuthentication  | action:login/logout/cancel,name?:string | void               |
| capabilities.pickPath           | kind:shell/skill/prompt                 | string或undefined  |
| packages.getState/refresh/apply | 无                                      | PackageMarketState |
| packages.install/remove         | id:string                               | PackageMarketState |
| packages.setEnabled             | id:string,enabled:boolean               | PackageMarketState |

packages 是 Pi Runtime 扩展市场，不是专业应用 spkg 安装 API。配置保存与实际应用状态分别检查；apply 可能重连运行时，不能把保存成功等同当前会话已启用。类型见 capability-settings.ts、package-market.ts。

## 8. 账户、模型、更新与桌面

| 方法                                    | 参数                                         | 返回                                                                               |
| --------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------- |
| auth.getState/login/logout/refresh      | 无                                           | AuthState                                                                          |
| auth.credentials                        | 无                                           | ModelCredentialSummary[]：group,name,status,expiresAt；无密钥                      |
| auth.connectCredentials                 | groups:string[]                              | void；1–100 个不重复分组，空字符串表示默认通道；已有有效凭据直接复用，其余批量获取 |
| auth.clearCredentials                   | groups:string[]                              | void；只清除本地副本并保留清除标记，取消所选分组请求，不撤销服务端令牌             |
| auth.checkConnection                    | 无                                           | void                                                                               |
| auth.onChange                           | listener:(AuthState)=>void                   | 取消订阅函数                                                                       |
| platform.list                           | 无                                           | PlatformGroup[]                                                                    |
| platform.update                         | group:string,enabled:boolean,models:string[] | void                                                                               |
| providers.list                          | 无                                           | ProviderInfo[]                                                                     |
| providers.login                         | id:string,method:oauth/api_key               | void                                                                               |
| providers.answer                        | id:string,value:string                       | void                                                                               |
| providers.cancel/openBrowser            | 无                                           | void                                                                               |
| providers.remove                        | id:string                                    | void                                                                               |
| providers.addCustom                     | input:CustomProviderInput                    | void                                                                               |
| providers.onEvent                       | listener:(ProviderAuthEvent)=>void           | 取消订阅函数                                                                       |
| updates.getState/check/download/install | 无                                           | UpdateState                                                                        |
| updates.onChange                        | listener:(UpdateState)=>void                 | 取消订阅函数                                                                       |
| desktop.getConfiguration                | 无                                           | desktopConfiguration                                                               |
| desktop.downloadImage                   | source:string                                | boolean                                                                            |
| desktop.showMenu                        | name:string,x:number,y:number                | void                                                                               |
| desktop.setTitleTheme                   | theme:string                                 | void                                                                               |
| desktop.onCommand                       | listener:(string)=>void                      | 取消订阅函数                                                                       |

平台凭据与登录会话分别管理。login 只完成身份认证，不读取模型 Key；refresh 只更新账户。logout 不撤销用户令牌，本地加密副本保留。connectCredentials 优先复用账户已有令牌，必要时创建长期有效、受账户余额约束的令牌；不修改已有令牌配置。凭据查询仅在主窗口可用，第三方应用没有访问权限，不属于 App SDK 公共契约。

凭据状态为 saved/pending/cleared/invalid/expired；saved 仅表示本地已保存，不证明实时网关可用。expiresAt=-1 表示无自动过期。首次缺失可按需获取，cleared/invalid/expired 必须明确 connectCredentials；清除后不会自动下载回来。模型网关 HTTP 401 将对应凭据标记 invalid，保留账户登录且不自动重放；429、网络错误、5xx、额度/权限类失败不删除密钥。批量创建结果不确定时返回 CREDENTIAL_PENDING，先核对 New API；确认后可清除本地标记并重新连接。存储异常 CREDENTIAL_STORAGE_FAILED 不降级为明文。官方批量接口 /api/token/batch/keys 是第三方 New API 接口，本仓库不新增公共 HTTP 服务。

AuthState 为 signed-out/signing-in/authenticated，authenticated 含 AccountSummary，不返回登录 token。providers 受编译版本限制，平台版不能靠调用 API 开启扩展版权限。updates.install 会进入实际更新流程，不作示例调用。

事件订阅立即返回解除函数，React effect 清理时调用。账户/更新数据详见 auth-types.ts、update-types.ts，Provider 类型见 provider-types.ts。

## 9. 应用 MCP HTTP 协议

资料服务来自 host.ts，动态 loopback 地址与 token 由平台 getBinding 获取，不固定端口或给普通网页暴露。`Authorization: Bearer <token>`，Content-Type: application/json，客户端按官方 Streamable HTTP 协商 Accept，调用 initialize 后再 list/call 工具。

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

## 10. 私有 Runtime HTTP 桥

这些接口只记录给平台维护者排查，第三方应用使用 SDK 能力，不依赖动态 token 或桥实现。

生图 /tool：动态地址、账户 Bearer token、准确 Host、拒绝 Origin；仅 POST，正文最多800 KiB。操作为 capabilities、generate（requestId:string，<=300；request:SitooImageRequest）、status（id:string）。requestId 用于原任务幂等，不为同一逻辑动作随意更换。

成功200返回能力或任务对象；鉴权失败401；方法/路径/Host/Origin 不合规403；超限413；解析/业务调用失败400，正文 `{error:消息}`。wait 是 Runtime 扩展对 status 的等待逻辑，不是该 HTTP 桥的 operation。

模型代理：Bearer 代理会话 token（不同于持久化的 New API Key）、无 Origin、只 POST；路径 /v1/chat/completions 或 /v1/desktop-newapi-<24位小写hex>/chat/completions。正文上限16 MiB，转发上游流式响应；它不是任意 URL 代理。完整错误行为见 model-proxy.ts，生图见 sitoo-image-host.ts。

## 11. 本地更新与目录下载

serve-desktop-updates.mjs 只用于本地更新验收，默认 loopback 18680（可指定）。无认证，不作为生产发布管理后端。

| 路径                                                 | 方法     | 响应                                           |
| ---------------------------------------------------- | -------- | ---------------------------------------------- |
| /latest.yml                                          | GET/HEAD | electron-updater 版本清单                      |
| /Pi-Market[-Extended]-x.y.z-x64-setup.exe[.blockmap] | GET/HEAD | 允许名称的文件，支持单个 bytes=start-end Range |
| /packages/catalog.json                               | GET/HEAD | Runtime 扩展目录，文件缺失404                  |
| /__stats                                             | GET      | 验收下载统计，非生产监控 API                   |

未知文件404、不支持方法405、非法Range416；目录与清单 no-store，安装文件缓存一小时。没有 POST 上传、审核或专业应用目录接口。目录部署配置见 扩展市场 与 更新配置。

## 12. 版本、维护与验证

### 浏览器 SDK 0.0.3 与宿主私有桥

应用公开接口为 `createAppClient()`，详见[浏览器 SDK](./browser-sdk.md)。platform.getCapabilities、storage.get/list/put/delete、images.listTasks 均已接入；文本推理尚未开放。内部对应 IPC `apps:platform-capabilities(token)` 和 `apps:storage(token,operation,input)`，token 由主进程创建并绑定当前账户、已安装应用与包摘要，应用不能自行传入 appId 或 scope。浏览器只传数据，可信父页面持有 token 并调用私有 IPC。

存储输入使用 JSON；get 输入 id，list 输入 cursor/limit，put 输入 id/revision/version/value，delete 输入 id/revision。revision 乐观并发检查、原子保存、删除墓碑及配额在宿主执行。单写 16 KiB、单应用单账户 8 MiB/1000 记录、分页最多 100；卸载保留，普通业务存储不加密，不接受路径或凭据槽位。

浏览器错误为 AppSdkError(code,message,retryable,action)，消息不暴露原始路径/堆栈；TIMEOUT 表示提交结果可能未知，不能自动重提付费请求。Account 变化或关闭会话后拒绝调用；已提交的写入须重开查询确认。没有新增公开 HTTP API。

SDK API 按 SDK/契约版本管理；Desktop IPC 和私有桥目前是同客户端内部契约，不承诺不同客户端版本间稳定。未来公共 HTTP API 实现后增加独立版本、OpenAPI/schema、认证、限流与兼容策略，当前不生成虚构 OpenAPI。

公开方法/路由/参数/鉴权/状态改变时，同批更新本手册；API 原因引发 SDK 变化还须同步 SDK 手册和 CHANGELOG。维护入口见根 AGENTS。新接口说明权限、返回时机、取消、幂等、副作用和失败，不把网络200写成任务完成。

文档验证核对源码入口、方法清单、链接及示例；行为变更运行相关 SDK、桌面、MCP 和桥测试。不要为验证手册实际发送付费生图、执行任意 shell 或发起更新安装。本次文档编写不是所有接口端到端验收。
