# 图片与产物

## 生图与任务恢复

`invoke(capability, parameters, requestId?)` 调用包中已绑定能力，泛型返回类型由开发者提供，宿主以 schema 校验参数。生图仍由平台统一配置模型、执行审批和保存作品。

`images.getCapabilities()` 查询真实图像配置；`images.listTasks()` 只返回当前应用的任务，供重开恢复。`getTask(taskId)` 查询原任务，`watchTask(taskId,onTask,onError?)` 每两秒轮询，最多十分钟，返回停止订阅函数。`getArtifact(taskId)` 返回已保存 PNG 的 mimeType/dataUrl。

先生成并保存稳定 requestId，再提交付费调用，成功后保存 taskId。超时先查 `images.listTasks()` 和已有任务；当前未提供按 requestId 直接查询的浏览器接口，不要更换 ID 自动重提。取消订阅与 dispose 不取消上游任务；图像上游取消能力目前为 false。


## 配置、提交、显示图片

适用于已安装静态应用：manifest 和对应能力都声明 `sitoo_image:generate`，例如能力 ID `generate` 绑定 images.generate；inputSchema 声明 prompt、aspectRatio、resolution 和实际使用的可选字段。可信操作者在平台设置图像模型及审批模式；页面不接受 apiKey 或上游地址。

以下为[初始化上下文](/guides/browser-client)中的点击处理片段，使用下载的 app-page-flows.js。`render` 为应用传入的展示函数，接收任务快照；`showError` 接收安全错误，不能展示堆栈。

```js
import { submitImage, watchImage, readImage } from './app-page-flows.js';
async function startImage(client, prompt, render, showError) {
  const requestId = crypto.randomUUID();
  // 先落盘再提交；响应丢失也保留关联，不生成另一个请求。
  await client.storage.put({ id: 'image-' + requestId, revision: 0, version: 1,
    value: { requestId, prompt } });
  const task = await submitImage(client, 'generate', { prompt }, requestId);
  render(task);
  const stopWatching = watchImage(client, task.id, render, showError);
  return { taskId: task.id, stopWatching,
    loadArtifact: () => readImage(client, task.id) };
}
```

调用前用 images.getCapabilities 展示 enabled/configured、model、resolutions、aspectRatios 和 maxReferences。不可用时提示配置或授权，不发送请求。返回的 task.id 保存到原草稿；completed 后调用 loadArtifact，得到 image/png 的 dataUrl，可赋给 img.src。产物未保存或状态非完成时不得显示“已交付”。

| 状态 | 界面行为 |
| --- | --- |
| needs-approval | 等待可信审批；不让页面或模型自行批准 |
| submitting / queued / running | 显示进度，查询原 taskId |
| completed | 读取已保存产物并展示 |
| failed / cancelled | 展示明确结果，不推断费用已退回 |
| unknown | 保留原关联，用任务列表和可信宿主核对 |

退出页面时调用 stopWatching，再 dispose。cancellation=false 表示没有上游取消接口；停止轮询不会撤销已派发任务。提交超时且没有 taskId 时先查 images.listTasks，当前没有页面 requestId 直查接口；无法确定关联时交给可信操作者处理，不猜测重发。更多限制见[SDK 类型](/reference/sdk)和[恢复指南](/guides/tasks)。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
