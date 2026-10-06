# Sitoo App SDK 开发者手册

维护日期：2026-10-06。适用 SDK：`@sitoo/sdk@0.0.5`。能力、任务、资源包声明契约版本：1。

包命名已统一为 `@sitoo/sdk`。从历史 `@pi-market/sdk` 迁移时，同时修改 package.json 依赖、源码 import（包括 `/ui`、`/host`、`/mcp`）及 pnpm filter，重新安装依赖。外部项目使用新版开发工具包中的 SDK。此次不改变 SDK 0.0.3 的协议、能力契约或应用包格式；旧名称不作为新的导入别名提供。

在线阅读源见[开发者文档站](./index.md)，浏览器接入见[浏览器 SDK 参考](./browser-sdk.md)，兼容规范见[标准](./standards.md)。新增能力发现、业务 JSON 存储、图像任务列表与结构化 AppSdkError。本文的可信 Host 接口不能直接暴露给第三方应用。

本文依据实际源码。版本以 package.json 为准，公开行为变更同步更新本手册和 [更新记录](./sdk-changelog.md)，见 维护规则。

## 1. 阅读路线与支持范围

新应用先读 2–5 节，再按需阅读任务、配置、审批、MCP 和生图。完整参考是资料应用的 契约、命令、服务、任务转换、MCP 服务。

| 状态           | 能力                                                                              |
| -------------- | --------------------------------------------------------------------------------- |
| 已实现         | catalog、schema、帮助/命令、任务校验、配置、审批票据、MCP 桥、平台生图接口        |
| 应用负责       | 业务服务、任务持久化、执行/取消/恢复、产物核验、领域安全、独立 UI                 |
| 平台集成者接线 | 注册 Provider、React 路由、IPC、账户服务和可信审批入口                            |
| 已接入首版     | 静态 spkg、签名市场、安装/更新/回滚、隔离 UI、浏览器客户端、平台能力绑定          |
| 设计中         | 第三方后端 OS 沙盒、完整通用调度器、自动迁移、独立资源包市场与完整 Agent 能力代理 |

可信后端仍需仓库内接线。静态 UI 应用可独立打包、上架、安装，不修改 Desktop；只允许首版已列出的平台能力。工作区 SDK 仍 private；开发工具输出独立 npm 目录包和无依赖浏览器 client，不表示已发布公共 npm。完整步骤见 [开发工具快速开始](./35-developer-kit-quickstart.md)。

## 2. 模块与依赖

根目录要求 Node >=24，使用 pnpm workspace、ESM 和严格 TypeScript。应用依赖声明 `"@sitoo/sdk": "workspace:*"`，沿用仓库 tsconfig；实际运行需支持当前 TypeScript 源码入口。

| 入口            | 用途与边界                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------ |
| @sitoo/sdk      | manifest、契约、任务/产物、catalog、命令/schema、配置声明、资源包/图像类型；无 Host 文件存储 API |
| @sitoo/sdk/host | ApplicationHost、ApplicationProvider、AppApprovalTarget、AppConfigState；仅可信服务端/主进程     |
| @sitoo/sdk/mcp  | registerAppCapabilities；使用官方 MCP SDK 的可信服务端桥                                         |
| @sitoo/sdk/ui   | createAppClient；只在平台的隔离应用 iframe 内使用，不暴露完整 Desktop API                        |

浏览器消费声明，权威 schema 校验在服务端，勿为此放开 unsafe-eval。应用不导入 `@earendil-works/*` 或 Desktop 内部 Runtime，不维护第二份 Agent loop。

建议 contract.ts 声明、service.ts 业务、commands.ts 调用桥、tasks.ts 通用视图、host.ts 可信集成。声明文件不导入业务文件系统。React/assistant-ui 工作先读 UI 指导。

## 3. 最小接入示例

这是无文件/付费操作的服务端教学示例。固定账户仅用于演示；生产使用真实账户 scope。UI 路由和业务持久化需另接入。

```ts
import {
  AppCatalog,
  appHelp,
  parseAppCommand,
  type AppInvocationContract,
  type RegisteredApp,
} from '@sitoo/sdk';
import { ApplicationHost, type ApplicationProvider } from '@sitoo/sdk/host';

const contract: AppInvocationContract = {
  contractVersion: 1,
  appId: 'example.hello',
  name: '问候示例',
  version: '0.1.1',
  description: '演示确定性调用。',
  uiEntry: 'hello',
  help: '输入 问候 name="小明"；输入 help 查看帮助。',
  capabilities: [
    {
      id: 'greet',
      name: '问候',
      aliases: ['hello'],
      description: '返回问候，不产生外部副作用。',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['name'],
        properties: { name: { type: 'string', minLength: 1, maxLength: 40 } },
      },
      examples: ['问候 name="小明"'],
      permissions: [],
      requiresTask: false,
      requiresConfirmation: false,
    },
  ],
};
const registration: RegisteredApp = {
  manifest: {
    id: contract.appId,
    name: contract.name,
    version: contract.version,
    sdkRange: '>=0.0.1 <1.0.0',
    aiRuntime: 'none',
    permissions: [],
    ui: { entry: contract.uiEntry },
  },
  invocation: contract,
};
const provider: ApplicationProvider = {
  async invoke(input) {
    const parsed = parseAppCommand(contract, input);
    if (parsed.kind === 'natural') return undefined;
    if (parsed.kind === 'help') return appHelp(contract, parsed.ability?.id);
    return { appId: contract.appId, status: 'success', text: `你好，${parsed.parameters.name}！` };
  },
  async listTasks() {
    return [];
  },
  async getTask() {
    throw new Error('示例没有任务。');
  },
};
const host = new ApplicationHost(new AppCatalog([registration]), '.cache/sdk-guide-example', () =>
  'a'.repeat(64),
);
host.register(contract.appId, provider);
console.log(await host.invoke(contract.appId, '问候 name="小明"'));
console.log(await host.invoke(contract.appId, 'help'));
```

运行应输出 success 问候及帮助；空 name、未知参数和重复参数应拒绝。本例不使用配置存储，不创建目录。将代码保存到 SDK 目录的临时 `.ts` 文件，可由当前 Node 运行；不要将固定演示身份用于产品。

真实 Desktop 集成步骤：

1. 在 app-catalog.ts 注册 RegisteredApp。
2. 在 main.ts 账户服务初始化链注册 Provider，绑定当前账户数据。
3. 给 uiEntry 注册 React 路由与打开应用入口。当前是路由标识，不是动态加载 HTML。
4. 复用现有列表/任务/配置 IPC；新增 UI 桥定义明确类型、preload 接口与主进程校验。
5. 模型调用另接 MCP 服务与运行时配置。catalog 不自动创建 UI 或启动 MCP。

## 4. 注册与声明

RegisteredApp 为 manifest、invocation、可选 configuration。AppCatalog 校验 semver/SDK 范围、ID、重复 ID、契约版本、能力别名及 manifest/契约 ID、版本和 UI 一致性；不执行应用或安装依赖。

| 字段                | 当前含义                                                |
| ------------------- | ------------------------------------------------------- |
| id / appId          | 稳定 ID，不使用显示名称作为身份                         |
| version / sdkRange  | semver 版本与范围；0.0.1 阶段不承诺未来完全兼容         |
| aiRuntime           | 类型支持 pi/custom/none；声明不自动启动执行器或模型通道 |
| permissions         | 字符串声明；Host 没有完整权限代理或 OS 沙盒             |
| packageDependencies | 类型已有 Pi 包依赖描述；应用依赖的自动下载/启用尚未实现 |
| ui / uiEntry        | 当前编译期入口，须相互一致                              |

能力必填 id/name/aliases/description/inputSchema/examples/permissions/requiresTask/requiresConfirmation。至少一项能力，schema 为 object 且有 properties。推荐 additionalProperties=false，明确 required、长度及数量限额。

requiresTask 不自动创建任务或强制完整状态机；业务服务检查归属。requiresConfirmation 可拦截 Host 的明确命令，但不能保护绕过 Host 的未检查业务函数。

## 5. 命令、帮助与自然语言

- @ 应用后为空、help、帮助返回本地帮助；`能力 帮助` 查看单项。
- 明确命令为 `能力 key=value`，含空格字符串用双引号；布尔 true/false，数值普通十进制，对象/数组使用 JSON。
- 参数键当前只支持字母开头的字母数字，不用下划线/连字符。输入上限 10000 字符。
- parseAppCommand 返回 help、command 或 natural。command.parameters **仍为字符串**，虽校验时进行了类型转换，业务层仍须转换，不能把 `"false"` 当真值。
- 解析时临时去掉 required 中 task，允许应用提示选任务；应用必须检查缺失/重名，不能默认选第一项。
- formatAppCommand 对结构化参数做完整 schema 校验并转义；复杂 JSON 优先使用它生成命令。
- natural 不是已发起模型请求，Provider 通常返回 undefined，交现有路由处理；不能直接作为 shell 命令。

工具函数：validateAppSchema(schema)、validateAppValue(schema,value)、parseAppCommand(contract,input)、formatAppCommand(contract,abilityId,parameters)、appHelp(contract,abilityId?)。

## 6. Provider、任务与产物

ApplicationProvider 必需 invoke(input)、listTasks()、getTask(id)，可选 executeApproved(target)。Host 提供 register(appId,provider)、invoke(appId,input)、listTasks(appId)、getTask(appId,id)。

AppCommandReply 为 appId/status/text，可附 runId/revision；status 为 success/processing/needs-input/needs-approval，表示调用结果，不代替持久任务状态。

AppTask 必含 id/appId/appVersion/contractVersion=1/title/revision（正整数）/status/updatedAt/artifacts；status 为 draft、queued、running、needs-input、needs-approval、completed、failed、cancelled。可附 phase/progress/error/resourceSnapshots。

AppOutput 必含 id/kind/resource，resource 为 local-file、local-directory 或 url，可附 name/mediaType/bytes/sha256。描述不授予文件权限、不保证文件或 URL 有效；真实生成、核验并保存后才报告交付成功。

Host 验证格式、归属、请求任务 ID 与列表重复 ID；持久化、领域状态机、版本迁移、幂等、取消/恢复和文件摘要由业务服务实现。账户在异步调用结束后变化，不证明副作用未发生，查询真实任务，不能直接重跑。

旧 AppRunReference/AppRunStatus/AppArtifact 保留资料领域兼容。新应用用 AppTask/AppOutput；scanning/review/delivering 等领域阶段映射为 phase，不塞进通用 status。

## 7. 配置与凭据

configuration 声明 version/schema/defaults，可选 fields（placeholder/options）与 credentialSlots（id/label/required）。defaults 必须符合 schema。通用表单仅支持基础字段，复杂对象需专用 UI。

Host.configuration(appId) 返回 AppConfigState（appId/version/revision/values/credentials）；credentials 只含布尔配置状态。Host.saveConfiguration(appId,revision,values,credentials?) 保存；revision 过期刷新后再编辑，不能覆盖。

存储在 Host.root 下 `<scope>/<appId>/configuration.json`，Desktop 使用 userData/applications。scope 为真实账户对应的 64 位小写十六进制标识，首次未保存 revision=0。

Desktop 注入 safeStorage crypto。凭据省略 slot 保留、空字符串删除、非空加密保存；未声明字段或无安全存储拒绝。required 为声明，业务执行仍需检查凭据是否存在。

Host.credential(appId,slot) 只用于可信服务端，不给 renderer/模型。配置损坏或 version 不兼容时拒绝覆盖；没有自动迁移器，修改 defaults 不替换已保存值。

## 8. 审批与安全

当前图像能力已接入 Runtime 三模式；requiresConfirmation 的应用明确命令返回 needs-approval，引导可信 UI 审阅。不能宣称所有 Provider 都自动接入独立评审模型。

AppApprovalTarget 为 appId/capabilityId/taskId/revision/payload。可信入口审阅真实参数后调用 Host.approve(target) 获得票据，再 Host.executeApproved(target,ticket)。任务必须处于 needs-approval，能力声明 requiresConfirmation，revision 匹配。

票据绑定账户与完整目标，有效 60 秒、一次消费；参数变化/重放拒绝。账户切换平台调用 host.approvals.revoke()；取消仍由业务服务处理。当前指纹基于 JSON.stringify，保持目标结构与序列化顺序，不随意重组。

AppApprovalLedger 是宿主内部机制，issue/consume 不暴露为应用或模型工具。payload 包含所有真实执行参数，服务执行前复验。模型 approved=true、资源文本、MCP 注解和 manifest 声明不能替代授权。

Host 面向可信内置 Provider，不是第三方安全沙盒。目录/链接/网络/付费/幂等保护需真实服务实现；安装权限与 OS 沙盒见 设计框架。

## 9. MCP 接入

registerAppCapabilities(server,contract,invoke) 在官方 McpServer 注册 get_capabilities 与 invoke_capability。后者接受 id 和结构化 parameters，校验/格式化后调用同一服务，返回文本及 structuredContent。

invoke 绑定经过授权的服务入口；桥不提供认证、HTTP 服务、传输或审批。每应用独立 server 或明确适配路由，不在同 server 重复注册这些同名工具。

MCP 调用需保留 needs-approval，不能签票或绕过服务门禁。网络层另处理鉴权、loopback、Host/Origin、请求限额、账户与 token 失效。资料应用 host.ts 提供参考；annotations 只是提示。

## 10. sitoo_image 共享图像能力

声明 manifest.permissions 含 `sitoo_image:generate`。平台 host.registerImages(provider) 注册唯一提供者，可信应用用 host.images(appId) 获得绑定身份的 AppImages；第三方 UI 不能直接获取 Host。

| 方法                    | 行为                                                                     |
| ----------------------- | ------------------------------------------------------------------------ |
| getCapabilities()       | 获取 enabled/configured、模型/比例/尺寸/参考图上限                       |
| generate(request)       | prompt 必填；可选 aspectRatio/resolution=1K或2K或4K/references；返回任务 |
| getTask(id)/listTasks() | 查询应用归属任务，不重新提交                                             |
| getArtifact(id)         | 返回 PNG dataUrl，大图按需读取                                           |

模型/凭据由平台配置，request 不接受任意模型/密钥。Host 检查身份和声明权限，实际限额、审批、参考图安全由提供者处理。

SitooImageTask 有 submitting/queued/running/unknown 等专用状态，不等同 AppTask。未知结果先核对，不能自动重试收费请求。cancellation=false，取消等待不是取消上游。completed 不保证作品已保存，结合 artifacts.stored/archived 判断。

confirmBeforeGenerate 为遗留字段，不能绕过审批模式。详见 图像能力。

## 11. 行业资源包

appResourcePackSchema.parse/safeParse 校验 AppResourcePack。字段为 contractVersion=1、id/version、targetAppId/appVersionRange、name/description/industries/license、可选 source、resources。

资源项含 id/kind/path/sha256/license，可选 attribution；kind 为 design-rule/style/reference/template/font/delivery-spec/checklist。路径用 `/`，拒绝穿越/冒号/反斜线、重复 ID 和大小写重复路径；包版本目前限普通 x.y.z。

仅校验声明，不核验实际文件哈希、不验证签名、不下载解压、不自动检查目标版本。调用方另用 semver 检查兼容。AppResourceSnapshot 为 packId/version/sha256，记录真实任务选择。

包不增加权限和执行入口；素材许可逐项核查，业务文本不能覆盖系统规则。只按任务读取所需规则，安装整包本身不占对话 Token。

## 12. 常见错误

AppContractError.code 可供程序处理，以下是当前常见值，不是永久完整枚举。

| 错误码                                                       | 处理                                                 |
| ------------------------------------------------------------ | ---------------------------------------------------- |
| INCOMPATIBLE_APP/INVALID_APP/INVALID_CAPABILITY              | 修正版本、ID、契约和 schema                          |
| UNKNOWN_APP/APP_UNAVAILABLE                                  | 检查 catalog 与 Provider，声明存在不代表执行器已加载 |
| UNKNOWN_CAPABILITY/INVALID_PARAMETERS                        | 展示帮助及合法示例，不猜参数                         |
| LOGIN_REQUIRED/SESSION_CHANGED                               | 核对 scope，账户切换后重新绑定并查询真实结果         |
| INVALID_TASK                                                 | 检查格式、归属、ID 和状态                            |
| STALE_PLAN/APPROVAL_REQUIRED/INVALID_APPROVAL                | 重读方案重新审阅，不重放票据                         |
| NO_CONFIGURATION/INVALID_CONFIGURATION/CONFIGURATION_VERSION | 核对声明/文件/版本，保留原数据                       |
| STALE_CONFIGURATION/INVALID_CREDENTIAL/CREDENTIAL_STORAGE    | 刷新配置、检查 slot 与安全存储，禁止明文回退         |
| PERMISSION_REQUIRED/CAPABILITY_UNAVAILABLE                   | 检查生图权限及平台提供者                             |

业务错误需应用定义。不要吞异常后报 success，也不要把 SDK 参数拒绝误判成任务未收费或未执行。

## 13. 验证与交付

仓库根目录运行：

```powershell
node node_modules/pnpm/bin/pnpm.cjs --filter @sitoo/sdk typecheck
node node_modules/pnpm/bin/pnpm.cjs --filter @sitoo/sdk test
```

应用另外检查业务类型和测试：独立 UI/@ 同任务、缺任务/重名/revision 变化、跨账户、授权拒绝、票据重放、取消/重启、失败产物、收费和交付幂等。用真实临时文件、模拟费用通道及故障场景；模拟测试不代表真实上游验收。

资料链路可参考 `node scripts/verify-materials.ts`，不是任意新应用的通用验证器。桌面接线执行相关 Desktop 回归，代码交付按根 AGENTS 验证、提交、启动。

开发工具已提供 create/pack/check/init-market/publish。安装、更新、回滚和卸载通过 Desktop 市场 UI 完成；参见快速开始。不是公开 REST 接口或公共 npm 发布服务。

### 13.1 静态包与浏览器契约

`AppPackage` / `appPackageSchema` / `validateAppPackage` / `safeAppPath` 由根入口导出。包格式版本 1，execution 必须 static-platform；`files` 声明普通文件摘要和尺寸，`bindings` 绑定能力到 text.echo、text.generate 或 images.generate。具体限制见快速开始。应用不能通过声明新增宿主工具或安装依赖；图像权限由平台执行，requiresConfirmation 不替代平台审批。

`createAppClient()` 返回 platform、storage、invoke、text、images、resources、configuration、dispose。invoke 参数为 capability、符合能力 schema 的 parameters、可选 UUID requestId；返回绑定能力结果，拒绝时抛 Error。图像结果是现有 SitooImageTask，按同一请求 ID 幂等；不要将提交结果当成已交付。images.getCapabilities/getTask/getArtifact 只访问本应用获准的配置与任务，watchTask 提供每两秒的有界轮询订阅（不是服务端事件）。resources.list/read 读取随包声明与最多 64 KB 的已校验文本，返回版本和 SHA-256 快照。configuration.get/save 使用声明式 schema、revision 和账户独立配置，不支持第三方凭据槽。dispose 撤销监听和未完成请求，不取消上游付费任务。

`AppCatalog.add/remove` 和 `ApplicationHost.unregister` 供可信宿主激活/停用包，不向应用 UI 授权。AppImages.generate 以及 AppImageProvider.generate 新增可选 requestId，旧代码不传仍兼容。0.0.2 为新增接口；旧包声明 sdkRange 必须包含 0.0.2，固定 0.0.1 的包需要明确更新兼容范围。

### 13.2 平台文本推理（0.0.5）

manifest 和能力均声明 `text:generate`，binding 使用 `text.generate`。浏览器通过 invoke 提交 AppTextRequest，返回 AppTextTask；text.listModels/getTask/listTasks 查询已启用模型和本应用任务。根入口导出 AppTextRequest/AppTextTask/AppTextModel 类型；AppTextProvider 是可信宿主适配契约，不直接提供给浏览器。

Desktop 使用 Runtime Adapter 的 Pi 官方 pi-ai 单次补全，通过已有账户通道注入凭据，无工具、无独立 Agent 会话。应用自己组装领域需求与资源规则，SDK 不包含设计、海报等业务模板。实际 JSON Schema 输出核验、请求 ID 去重、并发、失败恢复和账户边界是通用平台职责。详细参数、限制、计费与 unknown 处理见[浏览器 SDK](./browser-sdk.md)。

SDK 0.0.5 支持 128–32768 的输出预算，默认 8192，提交前按目录声明的有效上限校验。当前平台无法确认上游模型真实输出上限，目录明确标记平台预算。任务保留安全结束原因、错误分类、部分内容及用量；达到上限和结构不合规属于明确失败，不再统一归为 unknown。只有完整结构才可交付。应用应允许用户查看部分内容、调整预算后主动重新生成完整结果，不自动拼接 JSON 或重复收费。

浏览器客户端可并行读取初始化状态；Desktop 桥每会话最多执行 4 个请求，最多排队 32 个，队列满才返回 BUSY。关闭页面会丢弃尚未执行的请求；不会重试已经开始的生成或写入。SDK 仍为 0.0.5，无需重新打包应用即可获得新版 Desktop 的桥修复。

需要新版 Desktop 和 SDK >=0.0.5；旧应用原有能力兼容，包格式与浏览器协议不变。设计工作室的外部应用验证说明见[设计应用开发与使用](./37-design-studio.md)。

## 14. 手册持续更新

公共 API/行为变更同批更新手册和 CHANGELOG；版本变化明确旧写法、新写法、兼容影响与数据迁移。类型存在但行为未实现继续标记，完成后再更新支持范围。示例改动验证类型与执行，行为改动运行有效测试。

规则已写入 SDK AGENTS，属于后续开发要求；目前没有自动 CI 文档一致性检查器，不能承诺自动生成手册。

弃用迁移：defineApp/tools → RegisteredApp/catalog 与能力契约/Provider；旧领域任务映射 AppTask；UI、MCP、审批需要真实接线，仅替换类型不足以完成迁移。

升级/卸载遇到实际平台调用、running 文本任务或未结束的生图任务时返回 APP_TASKS_ACTIVE。无 gatewayTaskId 的 unknown 生图记录不再永久阻止卸载或升级；仍保留历史记录和配置/作品，不表示远程任务被取消或未计费。有上游 ID 的 unknown 任务仍受保护，须先核对终态。
