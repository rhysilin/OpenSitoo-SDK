# 应用页面 SDK

应用页面 SDK 是运行在应用界面中的 JavaScript 开发库，不是 Chrome、Edge 等浏览器软件。它通过平台提供的页面通道，让应用调用文本生成、图片生成、配置和任务查询等服务。Desktop 内嵌的应用页面由平台提供该通道；在其他宿主中运行时，需要宿主提供兼容通道。仅用普通浏览器打开页面，不会自动获得平台能力。

接口入口为 `@sitoo/sdk/ui`，静态应用也可使用开发工具包提供的 `client.js`。完整方法、参数和返回值见[应用页面 SDK 参考](/reference/ui)。

## 能力发现

`platform.getCapabilities()` 返回 protocolVersion、sdkVersion、appId、appVersion、features 和 limits。features 包含 configuration、resources、storage、imageTasks、textInference 和可选 attachments、attachmentUpload、agentConversations、agentDictation。可选功能使用前检查宿主返回值。配置/资源是否存在及模型能力权限来自已安装包；imageTasks 不代表模型已经配置，需另调用 `images.getCapabilities()`。textInference 表示宿主已开放接口且应用声明了文本权限，不代表当前已有可用模型。


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

下面是操作片段，`client` 由本页链接的[初始化模块](/guides/browser-client)建立；在应用页面执行，不是独立 Node.js 脚本。

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


## 在页面建立并释放客户端

前置条件：已按[静态应用教程](/getting-started/static-app)生成 payload/client.js，由 Desktop 安装并提供页面通道。下面是可直接保存为 `payload/probe.js` 的诊断模块；在 payload/index.html 的 body 中加入 `<pre id="probe"></pre>` 和 `<script type="module" src="./probe.js"></script>`。普通网页、文档站本身和共享能力页面使用不同通道，不要混用客户端。

```js
import { createAppClient, appErrorDetails } from './client.js';
const client = createAppClient();
const output = document.querySelector('#probe');
// 身份和限制来自宿主；应用不能自行指定账户或 appId。
try {
  const capabilities = await client.platform.getCapabilities();
  output.textContent = JSON.stringify(capabilities, null, 2);
} catch (error) {
  const safe = appErrorDetails(error);
  output.textContent = safe.code + '：' + safe.message;
}
window.addEventListener('pagehide', () => client.dispose(), { once: true });
```

成功时看到本应用 appId、sdkVersion、features 和 limits；若未提供通道，不会出现真实平台能力。不要用 TypeScript 泛型代替运行时校验。页面模块只初始化一个客户端；卸载时先停止自己的轮询和订阅，再 dispose。重新打开应创建新客户端并读取原任务，不能复用已释放实例。

后续指南的片段沿用此 `client` 上下文；下载[页面流程模块](/examples/app-page-flows.js)，放入 payload/app-page-flows.js 后导入指定函数。模块不自动执行收费请求，示例中的能力 ID 必须替换为本包声明的实际 ID。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
