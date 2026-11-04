# 受控引用

仅可信 Node.js 宿主使用；受控资源与引用存储。参数、返回值和结构字段见下方 TypeScript 声明。安装与使用方式见[环境与工具](/getting-started/setup)，边界见[权限与确认](/guides/permissions)。


可信 Node 受控引用。应用拿到的是不透明 UUID，不是任意路径或 Provider 凭据。内存引用与显式持久引用分开；完整绑定、原结果查询与重开流程见[通用服务指南](/capabilities/services)。

## ReferenceScope

tenantId/environment/installationId/consumerAppId 四维引用所有者；application/conversation 共享原业务范围，入口授权仍独立。 相关操作见[指南](/capabilities/services)。

```ts
export type ReferenceScope = Pick<CapabilityHostContext, 'tenantId' | 'environment' | 'installationId' | 'consumerAppId'>;
```

## ModelInference

可信 infer 回调，prompt/context/requestId/signal 来自原请求，可能收费；不要在恢复路径调用。 相关操作见[指南](/capabilities/services)。

```ts
export type ModelInference = (prompt: string, context: Readonly<CapabilityHostContext>, requestId: string, signal?: AbortSignal) => Promise<JsonValue>;
```

## ModelQuery

可信原结果查询回调，prompt/scope/requestId 与原 Provider 绑定；不能重新提交或重新记费。 相关操作见[指南](/capabilities/services)。

```ts
export type ModelQuery = (prompt: string, scope: Readonly<ReferenceScope>, requestId: string, signal?: AbortSignal) => Promise<JsonValue>;
```

## ModelProvider

infer 必需，query 可选；缺 query 时无法自动恢复上游，保持 unknown。 相关操作见[指南](/capabilities/services)。

```ts
export interface ModelProvider {
    infer: ModelInference;
    query?: ModelQuery;
}
```

## CapabilityReferenceStore

独立 SQLite 持久引用 has/issue/read/list/revoke/close；回调与凭据不落库，参数和重绑见下方操作表。

```ts
export declare class CapabilityReferenceStore {
    #private;
    constructor(filename: string);
    has(referenceId: string): boolean;
    issue(scope: ReferenceScope, referenceId: string, payload: PersistentReferencePayload): string;
    read(scope: ReferenceScope, referenceId: string): Readonly<PersistentReference> | undefined;
    list(scope: ReferenceScope): readonly Readonly<PersistentReference>[];
    revoke(scope: ReferenceScope, referenceId: string): void;
    close(): void;
}
```

## PersistentReference

持久载荷 kind/text 或 providerId/providerRevision，加 referenceId/revision/revoked；scope 由存储方法限定而不包含在返回对象中。

```ts
export type PersistentReference = PersistentReferencePayload & {
    referenceId: string;
    revision: number;
    revoked: boolean;
};
```

## PersistentReferencePayload

text/model 两个互斥载荷：text 含 UTF-8 业务文本；model 含可信 providerId 和正整数 providerRevision，不保存秘密或函数。

```ts
export type PersistentReferencePayload = {
    kind: 'text';
    text: string;
} | {
    kind: 'model';
    providerId: string;
    providerRevision: number;
};
```

## CapabilityReferences

内存或显式持久引用管理；issueText/Model/Provider、revoke、register/createCapabilities 和 queryModel 均可信接口，scope 必须原归属。查询失败不能回退 infer，见[服务指南](/capabilities/services)。 相关操作见[指南](/capabilities/services)。

```ts
export declare class CapabilityReferences {
    #private;
    constructor(options?: {
        store?: CapabilityReferenceStore;
    });
    issuePersistentText(scope: ReferenceScope, text: string, referenceId?: string): string;
    issuePersistentModel(scope: ReferenceScope, providerId: string, providerRevision: number, referenceId?: string): string;
    bindPersistentModelProvider(scope: ReferenceScope, referenceId: string, providerId: string, providerRevision: number, provider: ModelProvider): void;
    revokePersistent(scope: ReferenceScope, referenceId: string): void;
    issueText(scope: ReferenceScope, text: string, referenceId?: string): string;
    issueModel(scope: ReferenceScope, infer: ModelInference, referenceId?: string): string;
    issueModelProvider(scope: ReferenceScope, provider: ModelProvider, referenceId?: string): string;
    queryModel(scope: ReferenceScope, request: CapabilityRequest, signal?: AbortSignal): Promise<JsonValue>;
    revoke(referenceId: string): void;
    registerCapabilities(broker: CapabilityBroker, bindings: {
        text: CapabilityBinding;
        model: CapabilityBinding;
    }): void;
    createCapabilities(bindings: {
        text: CapabilityBinding;
        model: CapabilityBinding;
    }): {
        declaration: CapabilityDeclaration;
        execute: CapabilityExecutor;
    }[];
}
```


## 签发、读取与持久重绑

| 方法组 | 参数与结果 | 处理 |
| --- | --- | --- |
| issueText(scope,text,id?) | 原四维 scope、UTF-8 文本，id 省略创建 UUID → UUID | 内存引用；文本最多 32 KiB；不提供任意路径 |
| issueModel/issueModelProvider | scope、infer 或 {infer,query?}、可选 UUID → UUID | 可信选择回调；query 缺失则 unknown 无法自动恢复 |
| revoke(id) | 原内存 UUID → void | 撤销引用，不撤回已发生服务行为 |
| issuePersistentText/Model | 需构造注入 store；scope、文本或 providerId/revision、可选 UUID → UUID | 显式持久化，不自动迁移内存引用；回调不存数据库 |
| bindPersistentModelProvider | 原 scope/UUID/providerId/revision/provider → void | 重开后精准重绑，改变 ID/revision 不作为旧结果来源 |
| revokePersistent | scope/UUID → void | 保留撤销记录；不循环重签原业务请求 |
| createCapabilities(bindings) | text/model 精确 bindings → declaration/execute 数组 | 从已验签安装的真实 bindings 创建描述器 |
| registerCapabilities(broker,bindings) | 同实例 broker 和 bindings → void | 可信注册 platform/read-text 与 platform/infer |
| queryModel(scope,request,signal?) | 原 platform/infer 请求、可选等待取消 → JsonValue | 只查询；找不到/撤销/异常抛固定 Original model result unavailable，不能回退 infer |

CapabilityReferenceStore(filename) 打开独立 SQLite；has(id) 查 UUID 是否已占用；issue(scope,id,payload) 写不可变原引用；read(scope,id) 返回原记录或 undefined；list(scope) 当前归属记录；revoke(scope,id) 保留撤销与递增修订；close 关闭。返回载荷只有 text 或 model，不包含函数、密钥或任意路径。错误用安全 Error，可信宿主不得输出底层 SQL/凭据。完整持久服务与成本恢复示例见[服务指南](/capabilities/services)，公开验证器见[完整示例](/support/examples)。

---

[接口导航](/reference/) · [文档首页](/) · [支持范围](/getting-started/compatibility)
