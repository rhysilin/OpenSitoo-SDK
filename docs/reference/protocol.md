# 协议类型

请求、响应、任务及协议校验。参数、返回值和结构字段见下方 TypeScript 声明。安装与使用方式见[环境与工具](/getting-started/setup)，边界见[权限与确认](/guides/permissions)。


独立发布工具内 protocol/index.js 可直接导入；包名入口仅用于已配置的工程，不承诺公开 npm。所有解析器返回 ProtocolValidation，纯校验不执行。完整可运行例子、预算和所有错误见[请求协议](/capabilities/protocol)。

## createCapabilityError

code 为固定错误码，返回安全 code/message；运行时未知 code 归 INTERNAL_ERROR，不透传上游秘密。 相关操作见[指南](/capabilities/protocol)。

```ts
export declare function createCapabilityError(code: CapabilityErrorCode): CapabilityError;
```

## parseCapabilityRequest

校验 unknown wire 请求，成功返回独立快照；错误 INVALID_INPUT/INCOMPATIBLE，不执行能力。 相关操作见[指南](/capabilities/protocol)。

```ts
export declare function parseCapabilityRequest(value: unknown): ProtocolValidation<CapabilityRequest>;
```

## parseCapabilityTaskReference

只校验原任务引用的结构、状态和关联字段，不查数据库或赋予查询权。 相关操作见[指南](/capabilities/protocol)。

```ts
export declare function parseCapabilityTaskReference(value: unknown): ProtocolValidation<CapabilityTaskReference>;
```

## parseCapabilityResponse

校验 unknown 响应，可选 expectedRequest 做关联校验；省略时不核对原请求。非法响应 INVALID_OUTPUT，结构和预算详见[协议](/capabilities/protocol)。 相关操作见[指南](/capabilities/protocol)。

```ts
export declare function parseCapabilityResponse(value: unknown, expectedRequest?: CapabilityRequest): ProtocolValidation<CapabilityResponse>;
```

## requestSchema

固定 wire 请求 JSON Schema，不包含所有字节预算/关联检查；应使用 parseCapabilityRequest。 相关操作见[指南](/capabilities/protocol)。

```ts
export declare const requestSchema: WireSchema;
```

## responseSchema

固定响应 JSON Schema，额外关联和预算由 parseCapabilityResponse 检查。 相关操作见[指南](/capabilities/protocol)。

```ts
export declare const responseSchema: WireSchema;
```

## taskReferenceSchema

固定任务引用 JSON Schema，不提供数据库状态机。 相关操作见[指南](/capabilities/protocol)。

```ts
export declare const taskReferenceSchema: WireSchema;
```

## PROTOCOL_LIMITS

requestBytes=65536、responseBytes=131072、depth=32、nodes=8192；包含 envelope 和 UTF-8 转义，不按字符数计算字节。 相关操作见[指南](/capabilities/protocol)。

```ts
export declare const PROTOCOL_LIMITS: Readonly<{
    requestBytes: number;
    responseBytes: number;
    maxDepth: 32;
    maxNodes: 8192;
}>;
```

## JsonValue

合法 JSON 的 null/boolean/number/string/数组/对象；排除函数、循环、undefined、NaN/Infinity 和二进制对象。 相关操作见[指南](/capabilities/protocol)。

```ts
export type JsonValue = null | boolean | number | string | JsonValue[] | {
    [key: string]: JsonValue;
};
```

## PROTOCOL_VERSION

当前 wire 版本 1；与 SDK SemVer 或数据库 schema 分开。 相关操作见[指南](/capabilities/protocol)。

```ts
export declare const PROTOCOL_VERSION: 1;
```

## TASK_STATUSES

协议允许的八个状态词，状态改变由持久任务协调器完成。 相关操作见[指南](/capabilities/protocol)。

```ts
export declare const TASK_STATUSES: readonly [
    "queued",
    "running",
    "needs-input",
    "needs-approval",
    "completed",
    "failed",
    "cancelled",
    "unknown"
];
```

## CapabilityTaskStatus

queued/running/needs-input/needs-approval/completed/failed/cancelled/unknown；unknown 不表示未执行。 相关操作见[指南](/capabilities/protocol)。

```ts
export type CapabilityTaskStatus = (typeof TASK_STATUSES)[number];
```

## ERROR_MESSAGES

固定错误码到安全英文消息映射；客户端可按 code 本地化，不插入上游原错误文本。 相关操作见[指南](/capabilities/protocol)。

```ts
export declare const ERROR_MESSAGES: Readonly<{
    readonly UNAUTHENTICATED: "Authentication is required.";
    readonly FORBIDDEN: "The capability is not authorized.";
    readonly INVALID_INPUT: "The request is invalid.";
    readonly INVALID_OUTPUT: "The capability response is invalid.";
    readonly INCOMPATIBLE: "The protocol or capability is incompatible.";
    readonly CONFLICT: "The request conflicts with an existing request.";
    readonly LIMIT_EXCEEDED: "The request exceeds a platform limit.";
    readonly UNAVAILABLE: "The capability is unavailable.";
    readonly RESULT_UNKNOWN: "The result is unknown. Query the original task.";
    readonly CANCELLED: "Execution was cancelled.";
    readonly INTERNAL_ERROR: "The capability could not complete the request.";
}>;
```

## CapabilityErrorCode

协议固定错误集合，完整处理见[错误与限制](/capabilities/protocol)。 相关操作见[指南](/capabilities/protocol)。

```ts
export type CapabilityErrorCode = keyof typeof ERROR_MESSAGES;
```

## CapabilityError

固定 code/message 对；拒绝 stack/details 等额外字段。 相关操作见[指南](/capabilities/protocol)。

```ts
export interface CapabilityError {
    code: CapabilityErrorCode;
    message: string;
}
```

## CapabilityRequest

四字段 wire 请求：protocolVersion=1、requestId UUID、capabilityId namespace/name、input JSON。禁止额外身份、令牌、URL字段，完整限制见[协议](/capabilities/protocol)。 相关操作见[指南](/capabilities/protocol)。

```ts
export interface CapabilityRequest {
    protocolVersion: 1;
    requestId: string;
    capabilityId: string;
    input: JsonValue;
}
```

## CapabilityTaskReference

taskId/requestId/capabilityId/status 原任务引用，不是授权票据，不能切换应用所有者。 相关操作见[指南](/capabilities/protocol)。

```ts
export interface CapabilityTaskReference {
    taskId: string;
    requestId: string;
    capabilityId: string;
    status: CapabilityTaskStatus;
}
```

## CapabilityResponse

响应关联原 requestId：success.value、accepted.task、error.error 三个互斥分支；accepted 不是业务完成。 相关操作见[指南](/capabilities/protocol)。

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

成功 ok=true/value，失败 ok=false/error；先判断 ok，再读取对应分支。不是 HTTP 状态码或权限票据。 相关操作见[指南](/capabilities/protocol)。

```ts
export type ProtocolValidation<T> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: CapabilityError;
};
```

---

[接口导航](/reference/) · [文档首页](/) · [支持范围](/getting-started/compatibility)
