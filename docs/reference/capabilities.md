# 能力 SDK

独立应用客户端；需要宿主提供 transport。参数、返回值和结构字段见下方 TypeScript 声明。安装与使用方式见[环境与工具](/getting-started/setup)，边界见[权限与确认](/guides/permissions)。


从 @sitoo/sdk/capabilities 导入，客户端需要可信宿主提供的 transport。返回 ProtocolValidation，业务错误通过 ok=false 判断；传输异常仍可能拒绝 Promise。完整页面及 CLI 使用见[共享教程](/getting-started/quickstart)。

## createCapabilityClient

transport 必填，由宿主提供 submit/get/cancel/list 和可选 artifact。客户端校验/快照输入输出，不创建权限。dispose 释放客户端；提交未知结果先查询原任务。 相关操作见[指南](/capabilities/pages)。

```ts
export declare function createCapabilityClient(transport: AppCapabilityTransport): Readonly<{
    submit(request: CapabilityRequest): Promise<ProtocolValidation<AppCapabilityTask>>;
    get: (taskId: string) => Promise<ProtocolValidation<AppCapabilityTask>>;
    cancel: (taskId: string) => Promise<ProtocolValidation<AppCapabilityTask>>;
    list: () => Promise<ProtocolValidation<AppCapabilityTask[]>>;
    artifact: (taskId: string) => Promise<ProtocolValidation<AppCapabilityArtifact>>;
    dispose(): void;
}>;
```

## CapabilityRequest

四字段 wire 请求：protocolVersion=1、requestId UUID、capabilityId namespace/name、input JSON。禁止额外身份、令牌、URL字段，完整限制见[协议](/capabilities/protocol)。 相关操作见[指南](/capabilities/pages)。

```ts
export interface CapabilityRequest {
    protocolVersion: 1;
    requestId: string;
    capabilityId: string;
    input: JsonValue;
}
```

## CapabilityResponse

响应关联原 requestId：success.value、accepted.task、error.error 三个互斥分支；accepted 不是业务完成。 相关操作见[指南](/capabilities/pages)。

```ts
export type CapabilityResponse = {
    protocolVersion: 1;
    requestId: string;
} & ({
    status: 'success';
    value: JsonValue;
} | {
    status: 'accepted';
    task: CapabilityTaskReference;
} | {
    status: 'error';
    error: CapabilityError;
});
```

## ProtocolValidation

成功 ok=true/value，失败 ok=false/error；先判断 ok，再读取对应分支。不是 HTTP 状态码或权限票据。 相关操作见[指南](/capabilities/pages)。

```ts
export type ProtocolValidation<T> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: CapabilityError;
};
```

## AppCapabilityTask

能力 SDK 原任务快照，binding 固定原包版本摘要，revision 是宿主修订，result/upstreamTask 可选，见[原任务恢复](/guides/tasks)。 相关操作见[指南](/capabilities/pages)。

```ts
export interface AppCapabilityTask extends CapabilityTaskReference {
    binding: {
        capabilityId: string;
        packageId: string;
        version: string;
        sha256: string;
    };
    revision: number;
    createdAt: string;
    updatedAt: string;
    result?: CapabilityResponse;
    upstreamTask?: CapabilityTaskReference;
}
```

## AppCapabilityTransport

可信传输适配器契约。submit 输入完整请求，get/cancel 参数为原 taskId，list 无参数，artifact 可选；不得让应用指定管理身份。 相关操作见[指南](/capabilities/pages)。

```ts
export interface AppCapabilityTransport {
    submit(request: CapabilityRequest): Promise<ProtocolValidation<AppCapabilityTask>>;
    get(taskId: string): Promise<ProtocolValidation<AppCapabilityTask>>;
    cancel(taskId: string): Promise<ProtocolValidation<AppCapabilityTask>>;
    list(): Promise<ProtocolValidation<AppCapabilityTask[]>>;
    artifact?(taskId: string): Promise<ProtocolValidation<AppCapabilityArtifact>>;
}
```

## AppCapabilityArtifact

原任务的 PNG mimeType/dataUrl；读取不生成，大小上限 16 MiB，缺少 transport.artifact 时返回不支持错误。 相关操作见[指南](/capabilities/pages)。

```ts
export interface AppCapabilityArtifact {
    mimeType: 'image/png';
    dataUrl: string;
}
```


## 客户端操作表

| 操作 | 参数 / 返回 | 生命周期与失败 |
| --- | --- | --- |
| submit(request) | 完整 CapabilityRequest → ProtocolValidation 的 AppCapabilityTask | 提交前保存 UUID；同 ID 同规范参数去重，改变输入冲突；成功快照仍可能 queued/needs-approval |
| get(taskId) | 原 UUID → 原任务快照 | 只读；result.status=success 才读取业务 value |
| list() | 无 → 本应用任务数组 | 宿主默认分页，不带过滤/管理身份参数 |
| cancel(taskId) | 原 UUID → 取消后的快照 | 已派发取消不保证副作用回滚，可能保留 pin |
| artifact(taskId) | 原已完成图片 UUID → PNG mimeType/dataUrl | 可选 transport 端口；未配置不能生成替代图片 |
| dispose() | 无 → void | 清理等待与监听；不自动 cancel 已有任务 |

完整可运行[共享应用教程](/getting-started/quickstart)生成的 app-a/client.mjs 和签名 payload 脚本均使用此接口。应用通过平台提供的 transport 消费原身份，不嵌入令牌。方法错误首先检查 ok=false 的固定 code；提交丢响应或 RESULT_UNKNOWN 保存原 requestId，并用 get/list 定位，不能以新的随机 ID 自动重发。输入与返回约束见[协议](/capabilities/protocol)，HTTP 层状态码见[HTTP 参考](/reference/http)。

---

[接口导航](/reference/) · [文档首页](/) · [支持范围](/getting-started/compatibility)
