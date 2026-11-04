# 请求与响应协议

## 入口与方法

公共入口不导入 Pi、Electron、Node 或 Desktop。浏览器构建需要 TextEncoder；Node 验证采用项目要求的 Node >=24。

| 导出                                                                           | 已实现的作用                                                        |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                                                             | 当前 wire 版本 `1`                                                  |
| `PROTOCOL_LIMITS`                                                              | 不可修改的字节、深度、节点上限                                      |
| `TASK_STATUSES` / `ERROR_MESSAGES`                                             | 状态与固定安全错误消息                                              |
| `requestSchema` / `responseSchema` / `taskReferenceSchema`                     | 不可修改的 JSON Schema 结构描述，内部仅解释固定 wire 词汇           |
| `parseCapabilityRequest(value: unknown)`                                       | 返回 `ProtocolValidation<CapabilityRequest>`，不接收身份或凭据      |
| `parseCapabilityTaskReference(value: unknown)`                                 | 返回 `ProtocolValidation<CapabilityTaskReference>`，只校验引用结构  |
| `parseCapabilityResponse(value: unknown, expectedRequest?: CapabilityRequest)` | 返回 `ProtocolValidation<CapabilityResponse>`；可额外匹配原请求关联 |
| `createCapabilityError(code: CapabilityErrorCode)`                             | 固定安全消息；运行时未知码归为 `INTERNAL_ERROR`                     |

`ProtocolValidation<T>` 为 `{ ok: true, value: T }` 或 `{ ok: false, error: { code, message } }`。成功值是 JSON 快照，不保留调用者对象引用；非法输入返回错误，不透传原异常。

`@sitoo/capability-protocol/host` 只导出 `CapabilityHostContext` 类型：tenantId、environment、installationId、consumerAppId、entry、resolvedPackage（packageId/version/sha256）、grants、delegation。公共入口不重导出它，也不提供从用户输入创建可信身份的方法。持有类型或导入 `/host` 不代表拥有权限；实际信任由[能力代理](/reference/broker)的可信会话绑定。


## 请求

```ts
import { parseCapabilityRequest } from '@sitoo/capability-protocol';

const result = parseCapabilityRequest({
  protocolVersion: 1,
  requestId: '019c7714-3b77-74d1-9866-e1f484aae2ab',
  capabilityId: 'publisher-core/text.normalize',
  input: { text: '海报文案' },
});
```

此为工作区使用方式，不是已发布 npm 安装指令。四个字段均必需，顶层不允许其他字段。requestId 接受 RFC 变体且版本位 1–8 的 UUID 字符串，比较关联时按原字符串精确匹配；不接受 nil UUID。capabilityId 采用 `namespace/name`：namespace 为小写字母开头、小写字母/数字/连字符、最多 63 字符；name 为小写字母开头、小写字母/数字/点/连字符、最多 127 字符。拒绝 URL、路径穿越及任意目标地址。最终发布者注册与名称归属校验在后续阶段实现。


## 响应与任务

响应共同字段为 protocolVersion 与 requestId，只接受以下三个分支，各分支不允许额外字段：

```json
{
  "protocolVersion": 1,
  "requestId": "019c7714-3b77-74d1-9866-e1f484aae2ab",
  "status": "success",
  "value": null
}
```

```json
{
  "protocolVersion": 1,
  "requestId": "019c7714-3b77-74d1-9866-e1f484aae2ab",
  "status": "accepted",
  "task": {
    "taskId": "task-1",
    "requestId": "019c7714-3b77-74d1-9866-e1f484aae2ab",
    "capabilityId": "publisher-core/text.normalize",
    "status": "queued"
  }
}
```

```json
{
  "protocolVersion": 1,
  "requestId": "019c7714-3b77-74d1-9866-e1f484aae2ab",
  "status": "error",
  "error": {
    "code": "RESULT_UNKNOWN",
    "message": "The result is unknown. Query the original task."
  }
}
```

任务 taskId 为最多 128 字符的字母/数字开头、字母/数字/点/下划线/连字符字符串。状态为 queued/running/needs-input/needs-approval/completed/failed/cancelled/unknown；它们是可解析的状态声明，协议解析器自身不提供状态机；[持久任务服务](/reference/tasks)负责实际状态和存储。外层响应 requestId 必须匹配 task.requestId；传入已解析的 expectedRequest 时，还要求响应 requestId 与 task.capabilityId 匹配原请求。该关联检查不替代租户、授权、版本绑定或请求去重。


## 错误与限制

错误码：UNAUTHENTICATED、FORBIDDEN、INVALID_INPUT、INVALID_OUTPUT、INCOMPATIBLE、CONFLICT、LIMIT_EXCEEDED、UNAVAILABLE、RESULT_UNKNOWN、CANCELLED、INTERNAL_ERROR。错误分支只接受 ERROR_MESSAGES 的对应固定消息，不接受任意上游文本、额外 stack/details 或重新提交建议；产品层可按 code 本地化。通用 parse 校验失败为 INVALID_INPUT/INVALID_OUTPUT；整数请求版本不等于 1 返回 INCOMPATIBLE。上限失败当前归入结构校验错误；LIMIT_EXCEEDED 留给代理的运行限额，不冒充已经实现的配额服务。

完整请求 UTF-8 JSON 最多 64 KiB，响应/单独任务引用最多 128 KiB；根深度为 0、最多 32 层，最多 8192 个 JSON 值节点。编码后检查字节（包含转义与 envelope），因此多字节文本不能按字符数冒充字节预算。导出的标准结构 schema 不涵盖这些全局预算或跨字段关联，调用方应使用解析方法。

拒绝 undefined、函数、symbol、BigInt、NaN/Infinity、非普通对象、循环、稀疏数组、隐藏字段及访问器；不调用应用提供的 toJSON。接口处理 JSON 数据，不是隔离任意 JavaScript Proxy 的安全沙盒。不会自动重试、发出收费请求或从 unknown 推断副作用未发生。


## 从公开工具执行协议校验

上面的包名导入适用于已配置 workspace 的集成工程，不是 npm 发布承诺。独立项目使用下载工具的 protocol/index.js：保存下面为 C:/Sitoo/check-request.mjs，保证 capability-kit 在其同级目录。

```js
import { parseCapabilityRequest, parseCapabilityResponse } from './capability-kit/protocol/index.js';
const parsed = parseCapabilityRequest({ protocolVersion: 1,
  requestId: '019c7714-3b77-74d1-9866-e1f484aae2ab',
  capabilityId: 'starter-core/normalize', input: { text: ' hello ' } });
if (!parsed.ok) throw new Error(parsed.error.code);
// expectedRequest 校验关联，不创建任务，也不授予执行身份。
const reply = parseCapabilityResponse({ protocolVersion: 1,
  requestId: parsed.value.requestId, status: 'success', value: { text: 'HELLO' } }, parsed.value);
console.log(JSON.stringify(reply));
```

执行 node C:/Sitoo/check-request.mjs，预期 ok=true 且 value.status=success；把 protocolVersion 改为 2 则请求校验 INCOMPATIBLE。真实执行还需已授权安装和宿主，见[共享应用教程](/getting-started/quickstart)。success 表示响应分支，不替代业务 outputSchema 检查；accepted 表示收到任务引用，应查询原任务。

---

[文档首页](/) · [接口参考](/reference/) · [支持范围](/getting-started/compatibility)
