# 浏览器 SDK 参考

SDK 0.0.3。适用于安装在 Desktop 中的静态应用界面；应用不能直接使用 `window.piMarket` 或宿主 `/host` 接口。

```ts
import { createAppClient, AppSdkError } from '@pi-market/sdk/ui';
const client = createAppClient();
const platform = await client.platform.getCapabilities();
if (platform.features.storage !== 1) throw new Error('请更新 Desktop');
```

无打包工具时可使用开发工具包的 `sitoo-app-client.js`，复制到应用 payload，通过本地 ES module 导入。

## 能力发现

`platform.getCapabilities()` 返回 protocolVersion、sdkVersion、appId、appVersion、features 和 limits。features 包含 configuration、resources、storage、imageTasks、textInference。配置/资源是否存在、图像权限来自已安装包；imageTasks 不代表模型已经配置，需另调用 `images.getCapabilities()`。本版 textInference 固定 false。

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
