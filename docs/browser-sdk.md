# 浏览器 SDK 参考

SDK 0.0.5。适用于安装在 Desktop 中的静态应用界面；应用不能直接使用 `window.piMarket` 或宿主 `/host` 接口。

```ts
import { createAppClient, AppSdkError } from '@sitoo/sdk/ui';
const client = createAppClient();
const platform = await client.platform.getCapabilities();
if (platform.features.storage !== 1) throw new Error('请更新 Desktop');
```

无打包工具时可使用开发工具包的 `sitoo-app-client.js`，复制到应用 payload，通过本地 ES module 导入。

可并行读取初始化状态。Desktop 桥每个 iframe 会话执行最多 4 个请求，另允许最多 32 个排队；队列满返回 BUSY。关闭页面会丢弃未执行请求，不自动重试已经开始的操作。桥排队和模型生成任务并发限制分别生效；正常六项初始化读取无需应用自行串行。

## 能力发现

`platform.getCapabilities()` 返回 protocolVersion、sdkVersion、appId、appVersion、features 和 limits。features 包含 configuration、resources、storage、imageTasks、textInference。配置/资源是否存在及模型能力权限来自已安装包；imageTasks 不代表模型已经配置，需另调用 `images.getCapabilities()`。textInference 表示宿主已开放接口且应用声明了文本权限，不代表当前已有可用模型。

## 文本推理任务

SDK 0.0.5 的模型记录可含 outputTokenLimit 和 outputLimitSource（platform/model）。当前 New API 目录未提供可信模型输出上限，Desktop 显示 32768 的平台预算上限；这不是上游模型支持保证。任务新增 maxTokens、stopReason（completed/length/rejected/unknown）、errorCode（OUTPUT_LIMIT/INVALID_OUTPUT/UPSTREAM_REJECTED/RESULT_UNKNOWN）。失败时可含部分 text 和 usage，不能作为成功的 value 使用。用量是模型报告，不等于费用证明。旧任务缺失这些字段时不推断历史原因。

达到输出上限属于明确未完成，保留已收到的内容；结构化结果应在用户调整预算后，以新 requestId 主动重新生成完整结果，不拼接截断 JSON。对结果未知的任务先核对上游，再决定是否重新生成。平台不自动续写或重放；每个新请求都可能产生费用。

在 manifest 和对应能力中声明 `text:generate`，将 binding 设为 `text.generate`。使用 `invoke` 发起，结果为 AppTextTask；界面查询接口为 `text.listModels()`、`text.getTask(id)`、`text.listTasks()`。只能读取自身应用任务；无此权限时查询拒绝。模型列表只含当前账户已启用的 OpenAI 兼容平台模型，id 是不透明标识，name/group/price 用于展示；不开放自带服务或密钥。

```ts
const models = await client.text.listModels();
if (!models.length) throw new Error('请在 Desktop 设置中启用平台文本模型');
const requestId = crypto.randomUUID(); // 提交前写入草稿，超时后查询同一 ID。
const task = await client.invoke(
  'propose',
  {
    model: models[0].id,
    prompt: '概括用户提供的需求',
    maxTokens: 2048,
  },
  requestId,
);
const actual = await client.text.getTask(requestId);
```

AppTextRequest：model、prompt（1–8000 字符），可选 instructions（最多 8000 字符）、maxTokens（128–32768，默认 8192）、responseSchema（Draft-07 对象 schema，序列化最多 8000 字符）。应用能力 inputSchema 必须声明实际使用的字段；浏览器消息整体另有 20000 字符限制。单次输出最多 64000 UTF-8 字节。

这是经 Pi 官方 pi-ai 执行的单次、无工具文本补全，不是会话 Agent 接口。instructions 是本次任务规则，不修改对话的默认系统提示词。responseSchema 由宿主在返回后校验，不保证上游原生结构化输出；结果 JSON 不合法或不符合 schema 为 failed，不交付 value。只返回文本与可选 token usage，不暴露原始 reasoning 或密钥；price 是目录价格展示，实际账单以网关为准。

任务状态 running/completed/failed/unknown，含 id/appId/model/createdAt/updatedAt，成功可含 text/value/usage，失败含安全的 error。id 等于 requestId；同一 ID、规范参数和包摘要只执行一次，参数或包版本变化拒绝 REQUEST_CONFLICT。每账户最多 4 个并发、每应用最多 500 个留存文本任务。执行等待上限 90 秒；网络异常、退出或重启时结果不能确认则 unknown，不自动重试，可能已计费。页面关闭不取消任务；退出登录中断本机等待，不保证撤销上游费用。

使用 `getTask` 轮询原任务直到状态变化，不要不断调用生成接口。无需额外独立原生确认，安装时明确授权文本模型费用；生成图片仍沿用三模式审批。任务数据存放于账户隔离的 Desktop 本地业务目录（不是模型密钥保险库），卸载保留记录，当前没有任务删除或自动回收 API。

## 项目与草稿存储

| 方法                                       | 返回与行为                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| `storage.get(id)`                          | AppDataRecord 或 null；已删除记录返回 deleted=true 的墓碑                 |
| `storage.list({cursor?,limit?})`           | items 元数据列表和可选 nextCursor；默认 50，最多 100，不包含 value 或墓碑 |
| `storage.put({id,revision,version,value})` | 保存完整 JSON 对象并返回新记录；创建 revision=0，修改使用当前 revision    |
| `storage.delete(id,revision)`              | 删除业务值，返回 revision 递增的墓碑                                      |

记录含 id、revision、version、updatedAt、value、deleted。id 为 1–100 位字母/数字/下划线/连字符，首位字母或数字；保留标识 constructor/prototype 不可用。version 为应用数据结构正整数版本，平台不自动转换。列表按 id 字典序，cursor 是上一页最后一个 id，不是快照分页。

单次写入 JSON（含 id/revision/version/value）最多 16 KiB UTF-8；每账户每应用的存储文件最多 8 MiB、1000 个记录（含墓碑）。无需文件权限，但只能访问自身空间。value 必须是 JSON 对象，不支持二进制、循环对象或凭据；较大资源使用平台产物接口。

```ts
const previous = await client.storage.get('project-1');
const saved = await client.storage.put({
  id: 'project-1',
  revision: previous?.revision ?? 0,
  version: 1,
  value: { brief: '电影海报', taskIds: [] },
});
// 下次修改必须使用 saved.revision；不要自动覆盖冲突。
```

修改原子保存、串行并发校验。页面关闭和账户切换使会话失效；已提交的写入可能已经持久化，重新打开后应读取记录确认。卸载保留业务数据，应用应在卸载前提供清除入口。

## 生图与任务恢复

`invoke(capability, parameters, requestId?)` 调用包中已绑定能力，泛型返回类型由开发者提供，宿主以 schema 校验参数。生图仍由平台统一配置模型、执行审批和保存作品。

`images.getCapabilities()` 查询真实图像配置；`images.listTasks()` 只返回当前应用的任务，供重开恢复。`getTask(taskId)` 查询原任务，`watchTask(taskId,onTask,onError?)` 每两秒轮询，最多十分钟，返回停止订阅函数。`getArtifact(taskId)` 返回已保存 PNG 的 mimeType/dataUrl。

先生成并保存稳定 requestId，再提交付费调用，成功后保存 taskId。超时先查 `images.listTasks()` 和已有任务；当前未提供按 requestId 直接查询的浏览器接口，不要更换 ID 自动重提。取消订阅与 dispose 不取消上游任务；图像上游取消能力目前为 false。

## 配置与资源

`configuration.get()` 与 `save(revision,values)` 用于应用配置，不能代替项目存储。`resources.list()` 获取随包资源；`read(packId,resourceId)` 获取允许的文本内容与不可变 snapshot（最多 64 KB）。这些接口沿用 SDK 0.0.2 的行为。

## 错误与关闭

失败抛出 AppSdkError：code、message、retryable、action。浏览器 RPC 超时 120 秒；TIMEOUT 表示结果未知，不表示上游失败。retryable 仅为错误分类信息，不是自动重试付费操作的授权。

| code                              | 处理                                          |
| --------------------------------- | --------------------------------------------- |
| REVISION_CONFLICT                 | 重新读取并让用户合并；action=resolve-conflict |
| SESSION_CHANGED / DISPOSED        | 重新打开应用；action=reload                   |
| LOGIN_REQUIRED                    | 登录；action=login                            |
| INVALID_DATA                      | 修改参数或缩减数据                            |
| STORAGE_LIMIT                     | 整理存储；本版墓碑仍计入配额                  |
| STORAGE_FAILED                    | 保留当前草稿，检查宿主存储                    |
| TIMEOUT                           | 查询原任务；action=query-task                 |
| BUSY                              | 查询可稍后重试；生成仍须先核对原请求          |
| FORBIDDEN / UNSUPPORTED_OPERATION | 检查权限或宿主能力                            |

其他宿主错误保留合法 code，message 使用安全的通用说明，不暴露路径、堆栈或凭据。

```ts
try {
  await client.storage.put({ id: 'draft', revision: 0, version: 1, value: {} });
} catch (error) {
  if (error instanceof AppSdkError && error.code === 'REVISION_CONFLICT') {
    const latest = await client.storage.get('draft');
    // 提示用户合并 latest，不能静默覆盖。
  }
}
// 页面卸载时释放监听和轮询；dispose 之后不可再调用。
client.dispose();
```

升级/卸载遇到实际平台调用、running 文本任务或未结束的生图任务时返回 APP_TASKS_ACTIVE。无 gatewayTaskId 的 unknown 生图记录不再永久阻止卸载或升级；仍保留历史记录和配置/作品，不表示远程任务被取消或未计费。有上游 ID 的 unknown 任务仍受保护，须先核对终态。
