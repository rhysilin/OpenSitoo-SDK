# App SDK 更新记录

SDK 面向开发者的实际变化与开发者手册在同一批次更新。

## 0.0.5（2026-10-06）

- 文本任务新增安全 errorCode、stopReason、maxTokens，失败和截断保留已收到文本（最多 64000 UTF-8 字节）及模型报告用量；只有完整且结构通过的结果提供 value。不自动续写或重试。
- maxTokens 支持 128–32768，默认 8192；模型目录可声明 outputTokenLimit/outputLimitSource，提交前校验。当前平台通道提供平台预算上限，不声称网关已提供模型真实输出上限。
- 设计工作室 0.1.1 支持预算选择、部分内容查看及用户主动重新生成完整方案；需要 SDK >=0.0.5 的 Desktop，旧任务不伪造诊断信息。

## 0.0.4（2026-10-06）

- Desktop 桥修复批量初始化误报并发过多：保留 4 个执行槽，新增最多 32 个待执行请求的队列；不重放生成或写入。SDK 接口和版本不变，更新 Desktop 即可，无需重打应用包。

- 静态能力绑定新增 `text.generate`，须在 manifest 和能力声明 `text:generate`。Desktop 通过 Runtime Adapter 的 Pi 官方 pi-ai 接口执行单次文本推理；不开放 Agent 工具、任意网络、文件访问或模型凭据。
- 浏览器新增 `text.listModels/getTask/listTasks`。模型来自当前账户已启用的兼容平台模型，生成能力返回持久后台任务；任务 ID 等于 requestId，页面重开可查询。无流式事件或上游取消保证。
- 文本请求支持 prompt、instructions、maxTokens 与 Draft-07 responseSchema；宿主校验输出，结构错误为 failed，网络/中断结果为 unknown，不自动重试。同一请求 ID 与参数、包摘要绑定，账户与应用隔离。
- 新增独立设计工作室样例，使用两份随包行业资源、草稿存储、方案推理和共享生图；不增加设计专用 SDK 接口。新版能力需要 SDK >=0.0.4 与新版 Desktop；包格式和浏览器协议仍为 1，旧应用原接口保持兼容。

## 包命名迁移（2026-10-06）

- SDK 包统一为 `@sitoo/sdk`，子入口为 `/ui`、`/host`、`/mcp`；原 `@pi-market/sdk` 为历史名称，新开发工具与示例只使用新名称。
- 开发者需更新 package.json 依赖、源码 import 和 pnpm filter，再重新安装依赖；外部项目使用重新生成的开发工具包 SDK。
- 此次只调整包名，SDK 版本仍为 0.0.3，调用协议、能力契约与包格式不变。已打包静态应用无需仅因包名变化重新安装；再次构建时更新依赖与导入。

## 0.0.3（2026-10-06）

- /ui 新增 platform.getCapabilities：宿主 SDK 版本、应用身份、开放功能与容量限制；textInference 明确为未开放。
- /ui 新增账户/应用隔离 JSON 业务存储 get/list/put/delete，原子保存、revision 冲突、版本墓碑与尺寸/数量配额；不是凭据存储，不提供自动迁移。
- /ui 新增 images.listTasks，重新打开应用可查询自身任务。按 requestId 查询仍待开放。
- AppSdkError 保留 code/retryable/action；应用 IPC 到浏览器的错误传递统一，隐藏宿主路径与堆栈。dispose 后拒绝新调用。
- Markdown 手册生成 VitePress 开发者文档站，本地搜索，无需动态文档服务。
- 加法接口保持能力契约和包格式版本 1；固定 sdkRange=0.0.2 的应用评估后调整兼容范围并重新打包。旧 UI 客户端仍可调用原接口，但新版错误对象不再是单个字符串。
- 应用界面仍自行选型；Desktop 的 assistant-ui 风格不作为应用 SDK 约束。

## 0.0.2（2026-10-06）

- 静态 AppPackage 格式 1，包路径、能力绑定、尺寸与摘要声明。
- /ui 浏览器受控客户端；invoke、图像能力查询、任务查询及产物读取。
- 随包资源声明、兼容与内容摘要核验；只读资源桥，生图请求保存资源快照、版本和平台任务 ID。
- 应用普通配置的受控浏览器接口；有界任务轮询订阅，不自动重提失败/未知的付费请求。
- 可信 catalog 动态 add/remove 与 Host unregister。
- 图像 generate 新增可选 requestId，旧调用兼容；平台沿用原审批与持久幂等逻辑。
- 独立 SDK JavaScript/类型包、外部应用样例和 create/pack/check/init-market/publish 工具。
- Desktop 签名市场、静态安装/升级/回滚和隔离 iframe；不开放任意第三方后端。
- 固定 sdkRange=0.0.1 的应用需评估后更新兼容范围；能力契约版本仍 1。

## 0.0.1 当前基线（2026-10-06 整理）

此条整理现有实现，不表示以下功能在该日期新增。

- 根入口、/host、/mcp；private workspace 包。
- AppCatalog、RegisteredApp、能力契约版本 1，schema/semver 校验。
- 本地帮助、命令解析/格式化、MCP 能力桥。
- AppTask / AppOutput；Provider 负责持久化、执行与恢复。
- 账户配置、revision、主进程加密凭据。
- 绑定目标与账户的 60 秒一次性审批票据。
- AppImages 与共享平台生图配置。
- 资源包声明与快照；没有下载、解压、签名或实际内容核验器。
- defineApp / AppToolDefinition 已弃用；新应用用 AppCatalog / ApplicationProvider。旧领域 AppRunReference 保留，通用任务使用 AppTask。
- 新增开发者手册，修正 README 旧模板。安装器、通用调度器及第三方沙盒尚未实现。
