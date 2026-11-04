# 应用对话

## 应用 Agent 对话（SDK 0.0.7 起）

先检查 `features.agentConversations` 并声明 `text:generate` 权限。`client.agent.open({ model, instructions, reasoningEffort? })` 打开或恢复当前应用的需求对话，模型 ID 取自 `text.listModels()`；推理强度从 SDK 0.0.8 起支持，以宿主返回的 `reasoningLevels` 为准。

`agent.send({ requestId, text, context?, attachments? })` 接受消息后返回快照，不表示回复完成；使用 `getState()` 串行查询更新，`stop()` 停止文本回复，空闲时 `reset()` 创建新会话。requestId 使用 UUID；未知结果先查询原会话，不生成新 ID 自动重发。账户/应用身份由宿主绑定。

对话没有文件、命令、MCP、生图或工作台执行工具。方案展示与表单回填由应用负责，生成操作由用户明确触发。输入限制、状态、请求冲突与恢复规则见 [API 参考](/reference/)的“应用 Agent 会话”部分。


## 输入附件与语音（SDK 0.0.8）

`attachments.uploadImages(images)` 接收 `AppImageUpload[]` 并返回 `AppAttachment[]`；须检查 `features.attachmentUpload`。应用将选择、粘贴或拖拽图片标准化为受限 PNG data URL，宿主再次验证并保存。现有 `importImages()` 和 `get(id)` 继续可用；上传不代表执行了模型请求。

`agent.dictation.getState/start/stop` 提供语音转写文字；须检查 `features.agentDictation`。该接口依赖可信宿主、系统麦克风和语音服务，iframe 不直接获得麦克风或执行权限，识别结果不自动发送。容量、状态与错误语义见 [API 参考](/reference/)的“应用输入附件与语音”部分。


## 发起一轮应用对话

前置条件与文本任务相同：已安装应用声明 text:generate，账户启用了模型，platform.features.agentConversations 为真。此流程不走共享能力工具目录；两种对话的用途比较见[共享能力对话](/capabilities/conversation)。

以下是页面操作片段，沿用[初始化上下文](/guides/browser-client)，modelId 来自用户选中的 text.listModels 记录，text 来自输入框。保存 requestId 后只在用户发送时执行。

```js
import { sendAgentTurn } from './app-page-flows.js';
async function sendTurn(client, modelId, text) {
  const requestId = crypto.randomUUID();
  await client.storage.put({ id: 'turn-' + requestId, revision: 0, version: 1,
    value: { requestId, text } });
  return sendAgentTurn(client, { model: modelId, instructions: '帮助整理用户需求' },
    { requestId, text });
}
```

返回 state.messages 中 role=assistant 的 text 用于展示。status=running 表示仍需 getState；ready 表示会话可以接受下一轮，error 展示安全 error；closed 表示未打开。使用相同配置 open 可以恢复当前应用会话，修改配置需按照宿主状态处理，不假定重开即重新计费生成。推理强度只选择 state.reasoningLevels 支持的项。

用户停止回复时调用 agent.stop，然后 getState 确认；空闲时 agent.reset 开始新会话。页面离开只释放客户端，不承诺上游取消。响应丢失先读取 getState/messages，不用新 UUID 自动重发。语音 start/stop/getState 只返回 idle/starting/running/ended 的转写状态；把识别 text 回填输入框，让用户确认后主动发送。附图导入见[附件指南](/guides/resources)。完整类型及状态见[App SDK](/reference/sdk)与[页面 SDK](/reference/ui)。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
