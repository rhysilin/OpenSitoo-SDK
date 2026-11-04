# 通用服务接入

## 两个独立端口

可信宿主用 `references.issueModelProvider(scope, {infer, query?}, referenceId?)` 选择提供者，返回四维scope绑定的不可变UUID。infer沿用 `(prompt, context, requestId, signal?) => Promise<JsonValue>`；context由Broker绑定，执行必须经过当前授权和原任务的一次确认。

query为 `(prompt, scope, requestId, signal?) => Promise<JsonValue>`，只查原请求。scope是冻结的tenantId/environment/installationId/consumerAppId，不带应用可覆盖的模型名、URL或凭据。实现须按原scope、requestId、引用对应的不可变服务配置和prompt找结果，不能调用infer/generate、重新提交或重新记费。找不到、结果尚未知、上游不可用时抛错；不要返回一个虚构的成功值或终态错误。

回调在签发时选定；后续改写传入对象不会替换引用的回调。原issueModel(scope,infer,id?)兼容，相当于仅有infer的Provider；没有query时无法恢复上游结果，保持unknown。

`references.queryModel(scope, request, signal?)` 返回原JsonValue；要求原platform/infer请求及仅有referenceId/prompt的合法输入。跨scope、错误kind、缺失/撤销、取消、查询异常或查询期间撤销均抛 `Error('Original model result unavailable.')`，不暴露上游错误、路径或凭据，不回退infer。该低层方法不负责会话授权、任务指纹或输出schema，应用不得直接调用。


## 可搬运宿主模块

工具包中的service-host.mjs合并导出CapabilityBroker、CapabilityTasks、CapabilityReferences和createModelTaskQuery，模块外部依赖仅Node24内置模块，无仓库、Desktop、Pi或node_modules依赖；实际Guest执行还需同工具包的worker.mjs与quickjs.wasm侧车。使用同一模块导出的Broker/Tasks，保持不透明会话和审批凭证属于同一实现实例。

```js
import {
  CapabilityBroker,
  CapabilityTasks,
  CapabilityReferences,
  createModelTaskQuery,
} from './service-host.mjs';
// 只在可信宿主配置层创建/注册；scope、绑定、授予和Provider均来自该层。
const references = new CapabilityReferences();
const broker = new CapabilityBroker();
references.registerCapabilities(broker, trustedBindings);
const modelId = references.issueModelProvider(trustedScope, trustedProvider);
const tasks = new CapabilityTasks({
  path: trustedTaskDatabase,
  broker,
  allowEffects: true,
  query: createModelTaskQuery(references),
});
```

createModelTaskQuery(references):TaskQuery仅处理platform/infer，检查任务/原请求ID与当前精确绑定，再交给queryModel。Task管理器先复核会话、owner、当前授权、原请求/绑定指纹，并在查询后复核revision和输出；查询失败返回RESULT_UNKNOWN，保留原任务/pin。其他能力若需要查询，宿主明确组合自己的查询端口，不把未知能力送入此模型端口。工作区对应导出路径为 `@sitoo/capability-dev-host/services`。


## 已安装宿主服务（0.14.0）

声明包execution为host-service-v1、formatVersion为1；files必须为空、capabilities非空且不含source，其余字段沿用原接口/schema/权限/入口/delegates/effects。无模块路径、凭据、URL或代码载荷。声明摘要只认证接口包内容，不是原生实现代码摘要；实现由可信宿主另行提供，宿主版本/配置和生产实现来源保障分别管理。应用manifest显式声明依赖，可信操作者用原inspect/sign/publish/install方法发布安装；来源签名不等于授权，原授权账本仍分别按application/conversation及完整精确bindings授予。声明包可和Guest代码处于同一闭包；Guest依旧通过invoke委托，没有直接Provider权限。

references.createCapabilities({text,model})返回原引用服务的{declaration,execute}数组，描述器仅供可信注册，registerCapabilities沿用它。先用接口声明构建签名包，再用已验证包的真实bindings创建描述器；不能用临时摘要注册实际服务。

prepareInstalledHost(rootDirectory,config,broker,runtime,services=[])新增InstalledHostService数组，最多32项、只在v3启用。每项declaration和execute匹配签名安装计划的完整声明及精确capabilityId/packageId/version/sha256；初始化固定回调和声明快照。缺失、重复、多余实现或声明不一致均拒绝。纯Guest继续实际编译；接口声明不送入QuickJS。原授权、信任、租约获取及执行检查保持；unknown租约保护应用、Guest和原生接口包，无TTL释放。返回的validateCaller(caller)检查授权修订、当前信任与完整bindings，供可信原结果查询复核。

便携service-host.mjs同时导出安装/授权/签名/发布类、CapabilityRuntime、prepareInstalledHost和startDevelopmentHost，均为可信Node端口。HTTP宿主使用以下可选参数：

```js
await startDevelopmentHost({
  configPath,
  dataDirectory, // 原v3文件，消费者不携带grants或服务实现
  installedServices: references.createCapabilities(trustedSignedBindings),
  taskQuery: createModelTaskQuery(references),
  confirmationToken: trustedOperatorToken,
});
```

installedServices非空时必须提供独立64位小写十六进制操作者token，不能等于任何消费token；taskQuery若给出必须为函数。它们只从可信函数参数读取，不允许host.json/包/HTTP body选择执行器。引用owner与原可信policy一致；installationId沿用原根tenantId/accountId/applicationId/environment四元组JSON的SHA256，不从应用输入采用身份。

GET/POST原/v1/confirmations/:taskId仍需消费Bearer和X-Fixture-Confirmation独立凭据，POST仅revision；该历史header在开发宿主保留，不代表生产审批。无批准时submit只持久化needs-approval。原/v1/conversation/tools可发现已授权原生收费声明，prepare/propose可校验副作用计划但不执行或批准。taskQuery调用前后复核当前授权/信任/完整bindings，查询期间撤权不接受结果、保留unknown/pin；跨入口单独grants不自动继承。撤权后只读原任务查询沿用既有规则，上游查询不重跑。


## 持久引用接入（references0.5.0）

service-host.mjs同步导出CapabilityReferenceStore。可信宿主显式配置独立引用库并签发持久UUID；重开后必须按原Provider标识/修订显式绑定回调，应用仍只通过原SDK提交任务。默认内存API不迁移，回调与凭据不落库。真实参数、schema/预算、撤销和兼容规则只在[引用手册](/reference/references)维护。


## 持久原请求适配（宿主0.17.0）

从 `@sitoo/capability-dev-host/services` 或随包 `service-host.mjs` 导入 ModelRequestLedger、createDurableModelProvider。它们只供可信Node初始化层使用；不能把文件路径、scope、精确binding、Provider回调、URL或凭据交由包、应用、Guest或HTTP body配置。旧内存Provider及引用API保持，无自动迁移。

ModelRequestIdentity字段：scope为tenantId/environment/installationId/consumerAppId，entry为application/conversation/service，binding为原platform/infer的capabilityId/packageId/version/sha256，referenceId与requestId为合法UUID，prompt最多2000个Unicode码点，providerId为1–192字符的字母数字及`._:/-`标识，providerRevision为正安全整数。账户隔离依赖可信宿主原四元组根身份派生的installationId。库规范化并复制这些字段，不保存函数或密钥。

| 方法                             | 结果与约束                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| new ModelRequestLedger(filename) | 独立SQLite schema1，WAL与synchronous=FULL；已有其他表或版本拒绝，不迁移旧任务/引用库                                                                                                                               |
| reserve(identity)                | 返回`{created,record}`；事务先持久化原身份、规范化`{referenceId,prompt}` JSON的inputSha256及新upstreamRequestId，再允许首次infer。原owner/requestId相同但任一身份字段变化时抛错；相同身份返回原记录且created=false |
| read(scope,requestId)            | 原owner记录快照或undefined；record含全部identity、inputSha256、upstreamRequestId、status以及completed时的result                                                                                                    |
| complete(identity,result)        | 只为匹配的原身份保存首个合法wire JsonValue结果并返回结果；相同结果幂等，不同结果抛错；对象快照不共享数据库可变值                                                                                                   |
| close()                          | 关闭库；由可信宿主负责生命周期                                                                                                                                                                                     |

每库4096条历史记录，包含completed；没有TTL、删除或自动回收接口。记录status=dispatched表示持久占用了派发机会，**不证明上游实际执行**；complete只记录可信适配器提供的原结果，无法认证上游来源。数据库保存明文prompt及result，需宿主已有文件访问保护；本版本没有生产加密、配额或原生实现来源保障。SQLite写入失败时不执行infer；若上游执行后本地complete失败，原任务沿Tasks失败路径保持unknown，需要query核对，不能新派发。

```js
const ledger = new ModelRequestLedger(trustedLedgerPath);
const provider = createDurableModelProvider({
  ledger,
  references: referenceStore, // 持久引用存储
  scope: trustedScope,
  referenceId: originalModelId,
  binding: originalSignedModelBinding,
  upstream: {
    infer: (record, signal) => trustedInference(record, signal),
    query: (record, signal) => trustedOriginalLookup(record, signal),
  },
});
references.bindPersistentModelProvider(
  trustedScope,
  originalModelId,
  originalProviderId,
  originalProviderRevision,
  provider,
);
// 宿主配置同时保留安装、授权、租约与 createModelTaskQuery。
```

createDurableModelProvider要求活动且kind=model的持久引用，初始化固定原scope/binding及引用中的Provider标识/修订、infer/query两个函数。infer检查调用scope与执行包，reserve创建成功才调用upstream.infer；已有dispatched直接抛错，已有completed返回原结果，不会执行第二次。query检查原scope/requestId、prompt、引用、Provider和binding，仅向upstream.query传递原记录；已保存结果直接返回。缺失/异常/撤销/取消/冲突/超预算均抛Error；低层错误不作为公共协议，原References/Tasks继续转换FORBIDDEN或RESULT_UNKNOWN。

上游两函数必须使用record.upstreamRequestId关联同一原请求，query绝不执行infer、生成、重提交或重新记费。记录在网络派发前存在时即可查询；上游查不到意味着证据不足，不能补跑。该通用库不提供具体模型网络连接器，也不担保跨平台恰好一次执行；它保证本地原请求最多尝试一次infer，牺牲未派发原请求的自动重试来保留未知状态。

低层query只有四维scope，不单独认证登录/入口/授权；Tasks验证原请求、任务指纹与入口，v3 installed.validateCaller在query前后复核授权修订、签名信任及完整bindings。查询期间撤权即使库已保存原结果，也不能完成原任务或释放pin；显式重新授权并重建宿主后再次reconcile才可接受原结果。引用撤销则在库complete前再次检查，不接受返回。保留unknown时更新、卸载和回收继续遵循原完整租约，不能绕过pin。

可信Node导出 `imageCapabilityDeclaration(binding)` 与 `createImageService({binding,store,ledger,upstream})`；binding必须是platform/generate-image，返回declaration/execute/query。声明接受{referenceId,prompt}，提示词1–2000字符；权限model:infer及resource:read，billable，页面/对话/service入口，不能委托收费操作。输出仅{imageTaskId,artifactId}，不得放URL/凭据/大图片。受控引用沿原kind:model、image/<配置SHA256>/修订1持久存储，配置由账户用户明确选择，应用只持有UUID。

图片服务复用 ModelRequestLedger，以 platform/generate-image 精确绑定保存原任务关联。图片配置摘要绑定账户选择的模型、分组、画幅与分辨率，配置变化时旧引用不能提交新任务；历史结果仍可只读查询。

startDevelopmentHost提供可信taskArtifact(task,scope)端口，仅已完成原platform/generate-image任务、当前resource:read与原安装授权/信任/完整绑定复核后调用，返回{mimeType:image/png,dataUrl}，前后校验，最多16MiB图片。应用不能注册回调或选择本机路径。读取不释放其他unknown任务pin，不重试生成。缺失缓存保留原结果，稍后只查/缓存，不生产第二次副作用。


## 集成步骤与变量来源

上述代码是可信宿主初始化片段，不可复制到应用页面直接执行。trustedBindings 来自已验签包与完整安装计划，trustedScope 由宿主消费身份派生，trustedProvider 由宿主维护者实现，trustedTaskDatabase 是其私有任务库路径，trustedOperatorToken 是独立随机凭据。缺任何一项不能用消费请求 body 补齐。参数结构见[服务宿主参考](/reference/services)。

1. 发布并安装 host-service-v1 接口声明，与应用依赖一同验签。
2. 用原精确 bindings 构造服务描述器，匹配 declaration 与 execute；原生回调从可信配置绑定。
3. 分别授予入口并提供独立操作者确认通道，提交后只持久化 needs-approval。
4. 展示原确认计划，由操作者批准原 revision，再执行一次副作用。
5. 持久引用重开后按原 Provider ID/revision 重绑；unknown 只 query 原请求，缺查询能力则保留 unknown，不调用 infer 补跑。
6. 图片任务 completed 后读取原产物；缓存失败只重试读取/缓存，不再次生成。结构化请求服务复用可信平台文本/图片实现，应用不能传任意 URL。

可取得的无费用服务验证器和调用方式见[完整示例](/support/examples)。演示 Provider 不是可用于生产的网关账号配置。一般应用作者只用能力 SDK 提交本包授权能力，不管理 references、Ledger 或 Provider。


## 可信操作者页面

前置条件：宿主维护者已启用可信服务和独立 confirmationToken，消费者使用自己应用/入口的 Bearer；两个凭据不能相同。普通共享回显教程没有副作用，也不需要人工批准，不能拿它的消费 token 当操作者凭据。

1. 打开实际宿主 URL 的 /development/operator；在 Desktop 开发窗口也可点击“打开任务确认与核对”。
2. 输入本应用对应入口消费令牌和宿主维护者私下提供的独立操作者密钥，连接后输入框清空，凭据只留在模块内存。
3. 刷新原任务，选择 needs-approval 项；查看 capability/package/version/hash、完整参数与 revision。
4. 仅在用户明确同意本次业务与费用后点击“确认本次调用”，页面使用原 GET/POST confirmations 与原 revision。
5. 原任务 unknown 时可点击“核对原结果”，只 POST 原 reconcile；查询失败仍保留 unknown，不执行 infer。
6. 响应丢失或授权变化先刷新原任务，不能新建请求代替确认。离开或断开清除窗口凭据/显示，原业务不自动取消。

该页面是开发操作者界面，不加载业务代码，不把密钥传入 iframe/SDK，不提供生产管理 API。失败定位与两个头的准确语义见[HTTP 参考](/reference/http)。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
