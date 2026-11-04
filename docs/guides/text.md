# 文本任务

## 文本推理任务

SDK 0.0.6 的模型记录可含 outputTokenLimit 和 outputLimitSource（platform/model）。当前 New API 目录未提供可信模型输出上限，Desktop 显示 32768 的平台预算上限；这不是上游模型支持保证。任务新增 maxTokens、stopReason（completed/length/rejected/unknown）、errorCode（OUTPUT_LIMIT/INVALID_OUTPUT/UPSTREAM_REJECTED/RESULT_UNKNOWN）。失败时可含部分 text 和 usage，不能作为成功的 value 使用。用量是模型报告，不等于费用证明。旧任务缺失这些字段时不推断历史原因。

达到输出上限属于明确未完成，保留已收到的内容；结构化结果应在用户调整预算后，以新 requestId 主动重新生成完整结果，不拼接截断 JSON。对结果未知的任务先核对上游，再决定是否重新生成。平台不自动续写或重放；每个新请求都可能产生费用。

在 manifest 和对应能力中声明 `text:generate`，将 binding 设为 `text.generate`。使用 `invoke` 发起，结果为 AppTextTask；界面查询接口为 `text.listModels()`、`text.getTask(id)`、`text.listTasks()`。只能读取自身应用任务；无此权限时查询拒绝。模型列表只含当前账户已启用的 OpenAI 兼容平台模型，id 是不透明标识，name/group/price 用于展示；不开放自带服务或密钥。

下面是操作片段，`client` 由本页链接的[初始化模块](/guides/browser-client)建立；在应用页面执行，不是独立 Node.js 脚本。

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


## 用户触发、保存原请求、查询结果

这是页面模块中的操作片段，沿用[初始化上下文](/guides/browser-client)。模型需由账户操作者先在 Desktop 设置启用；应用作者在 `sitoo-app.json` 的 manifest 与 `propose` 能力中加入 text:generate，bindings.propose=text.generate，并在 inputSchema 声明 model、prompt、maxTokens。权限变化后重新打包安装并确认费用权限。

```js
import { submitText } from './app-page-flows.js';
// 此函数只绑定到用户点击，不在页面加载或重连时调用。
async function generateText(client, prompt, selectedModel) {
  const requestId = crypto.randomUUID();
  await client.storage.put({ id: 'text-' + requestId, revision: 0, version: 1,
    value: { requestId, prompt, model: selectedModel } });
  const { current } = await submitText(client, 'propose',
    { model: selectedModel, prompt, maxTokens: 2048 }, requestId);
  // 超出本地等待窗口仍返回原状态；随后继续 getTask，不重新生成。
  if (current.status !== 'completed') return { requestId, status: current.status };
  return { requestId, text: current.text, value: current.value };
}
```

先调用 text.listModels 展示 name/group/price，让用户选取合法 id。成功判定是原任务 status=completed；失败的部分 text 只供展示未完成原因。REVISION_CONFLICT 表示原记录需合并；REQUEST_CONFLICT 表示同 ID 的内容不一致；unknown/TIMEOUT 进入[原任务恢复](/guides/tasks)。不要捕获所有错误后自动再调用 generateText。

测试可由可信宿主提供无费用 Provider，但它只证明适配与状态处理；真实模型输出、账单和视觉能力需在有费用授权的环境另行验证。[页面 SDK 参考](/reference/ui)给出全部查询方法。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
