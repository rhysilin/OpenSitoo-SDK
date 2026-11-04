# 能力代理

仅可信 Node.js 宿主使用；能力发现与路由。参数、返回值和结构字段见下方 TypeScript 声明。安装与使用方式见[环境与工具](/getting-started/setup)，边界见[权限与确认](/guides/permissions)。


可信 Node 代理，可从 capability-kit/service-host.mjs 导入。注册声明与执行器、创建可信 policy 会话后才可调用；应用不能伪造 session。完整可运行[无费用宿主示例](/support/examples)演示注册、执行和关闭。

## CapabilityRegistrationError

可信代理注册或会话构造的安全 Error，code 属协议错误集合；非法声明不得注册后继续运行。 相关操作见[指南](/capabilities/overview)。

```ts
export declare class CapabilityRegistrationError extends Error {
    readonly code: CapabilityErrorCode;
    constructor(code: CapabilityErrorCode);
}
```

## CapabilityBroker

注册/会话/准备/批准/执行/结果校验的可信代理，详细操作表见下方；不提供生产登录或跨进程 token。 相关操作见[指南](/capabilities/overview)。

```ts
export declare class CapabilityBroker {
    #private;
    constructor(options?: {
        onDiagnostic?: (value: CapabilityDiagnostic) => void | Promise<void>;
    });
    register(raw: CapabilityDeclaration, executor: CapabilityExecutor): void;
    createSession(raw: CapabilityCallerPolicy): CapabilitySession;
    revokeSession(session: CapabilitySession): void;
    getCaller(session: CapabilitySession): ProtocolValidation<CapabilityCallerPolicy>;
    prepare(session: CapabilitySession, raw: unknown, options?: {
        inspectEffects?: boolean;
    }): ProtocolValidation<{
        request: CapabilityRequest;
        binding: CapabilityBinding;
        effects: CapabilityDeclaration['effects'];
    }>;
    issueApproval(session: CapabilitySession, raw: unknown, ttlMs?: number): ProtocolValidation<{
        approval: CapabilityApproval;
        expiresAt: number;
    }>;
    validateResult(session: CapabilitySession, raw: unknown, output: unknown): ProtocolValidation<CapabilityResponse>;
    invoke(session: CapabilitySession, request: unknown, options?: CapabilityExecutionOptions): Promise<ProtocolValidation<CapabilityResponse>>;
}
```

## CapabilityBinding

原 capabilityId/packageId/version/sha256 精确绑定，后续查询与执行保持原摘要；应用不能自行选择可信版本。 相关操作见[指南](/capabilities/overview)。

```ts
export interface CapabilityBinding {
    capabilityId: string;
    packageId: string;
    version: string;
    sha256: string;
}
```

## CapabilityDeclaration

binding、接口版本、输入/输出 JSON Schema、permissions、allowedEntries、delegates 和 effects；收费/外部写入按可信确认规则，声明不能授权自己。 相关操作见[指南](/capabilities/overview)。

```ts
export interface CapabilityDeclaration {
    binding: CapabilityBinding;
    interfaceVersion: 1;
    inputSchema: boolean | {
        [key: string]: JsonValue;
    };
    outputSchema: boolean | {
        [key: string]: JsonValue;
    };
    permissions: readonly string[];
    allowedEntries: readonly CapabilityHostContext['entry'][];
    delegates: readonly string[];
    effects: {
        billable: boolean;
        externalWrite: boolean;
    };
}
```

## CapabilityCallerPolicy

可信 tenant/environment/installation/consumerApp/entry、grants 与精确 bindings；由宿主建立不可由应用 JSON 替代。 相关操作见[指南](/capabilities/overview)。

```ts
export interface CapabilityCallerPolicy {
    tenantId: string;
    environment: CapabilityHostContext['environment'];
    installationId: string;
    consumerAppId: string;
    entry: CapabilityHostContext['entry'];
    grants: readonly string[];
    bindings: readonly CapabilityBinding[];
}
```

## CapabilitySession

Broker 实例签发的内存不透明会话；不能序列化、复制 brand 或跨实现实例伪造。 相关操作见[指南](/capabilities/overview)。

```ts
export interface CapabilitySession {
    readonly [sessionBrand]: true;
}
```

## NestedCapabilityInvoke

Guest 委托的受控调用，仍由 Broker 按 delegates/grants/原绑定检查，不暴露 Node 服务函数。 相关操作见[指南](/capabilities/overview)。

```ts
export type NestedCapabilityInvoke = (request: unknown, options?: CapabilityExecutionOptions) => Promise<ProtocolValidation<CapabilityResponse>>;
```

## CapabilityExecutionOptions

signal 可选取消本机等待；approval 是可信同请求一次性票据，取消不承诺上游回滚。 相关操作见[指南](/capabilities/overview)。

```ts
export interface CapabilityExecutionOptions {
    signal?: AbortSignal;
    approval?: CapabilityApproval;
}
```

## CapabilityApproval

同 Broker 实例签发的一次性批准凭证，不可复制/持久化/由模型创建。 相关操作见[指南](/capabilities/overview)。

```ts
export interface CapabilityApproval {
    readonly [approvalBrand]: true;
}
```

## CapabilityExecutor

可信注册回调接收已校验 request、宿主 context、受控 invoke 与可选 signal/approval；返回未知值仍经 outputSchema/协议校验。 相关操作见[指南](/capabilities/overview)。

```ts
export type CapabilityExecutor = (request: CapabilityRequest, context: CapabilityHostContext, invoke: NestedCapabilityInvoke, options?: CapabilityExecutionOptions) => unknown | Promise<unknown>;
```

## CapabilityDiagnostic

安全诊断关联原/父 requestId、身份与 binding、嵌套 depth、outcome/code 和毫秒 durationMs；不放凭据或业务 payload。 相关操作见[指南](/capabilities/overview)。

```ts
export interface CapabilityDiagnostic {
    requestId: string;
    rootRequestId: string;
    parentRequestId?: string;
    capabilityId: string;
    tenantId: string;
    environment: CapabilityHostContext['environment'];
    installationId: string;
    consumerAppId: string;
    binding?: CapabilityBinding;
    depth: number;
    outcome: 'success' | 'accepted' | 'error';
    code?: CapabilityErrorCode;
    durationMs: number;
}
```


## 可信操作与默认值

| 方法 | 参数/返回 | 语义、失败与示例 |
| --- | --- | --- |
| register(raw,executor) | 精确 declaration 与可信 execute；返回 void | 校验绑定/schema/权限/入口/委托；非法或重复声明抛 CapabilityRegistrationError |
| createSession(policy) | 可信完整 policy → 不透明 session | 固定身份/grants/bindings；非法输入抛安全注册错误 |
| revokeSession(session) | 原实例 session；void | 禁用原会话；不回滚已发生副作用 |
| getCaller(session) | 原 session → ProtocolValidation 的 policy | 未知/已撤销 FORBIDDEN；不接受应用伪造对象 |
| prepare(session,request,{inspectEffects?}) | 完整请求 → request/binding/effects | 只验证不执行；inspectEffects 供可信预览，不授予收费批准 |
| issueApproval(session,request,ttlMs?) | 可信明确确认后签发 approval/expiresAt | 默认 30000 毫秒，范围 1–300000；同请求一次性凭证 |
| validateResult(session,request,output) | 原请求和未知输出 → CapabilityResponse | schema/原关联检查，不执行业务，拒绝无效输出 |
| invoke(session,request,options?) | options 的 signal?/approval? → Promise 的 CapabilityResponse 校验结果 | 当前身份/精确绑定/grants/委托和 effects 都校验，不自动批准 |

完整注册、会话、调用和释放见[无费用可信宿主示例](/support/examples)。ProtocolValidation 失败按 code 处理：FORBIDDEN 不伪造 session，INVALID_INPUT/OUTPUT 修正 schema/值，CONFLICT 核对原 ID/绑定，RESULT_UNKNOWN 查询原任务。直接 Broker invoke 没有持久去重账本，业务需要恢复时使用[CapabilityTasks](/reference/tasks)。

---

[接口导航](/reference/) · [文档首页](/) · [支持范围](/getting-started/compatibility)
