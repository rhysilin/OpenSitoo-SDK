# 服务宿主

可搬运 service-host.mjs 的公开导出；仅可信 Node.js 宿主使用。参数、返回值和结构字段见下方 TypeScript 声明。安装与使用方式见[环境与工具](/getting-started/setup)，边界见[权限与确认](/guides/permissions)。

导入公开 capability-kit/service-host.mjs，或已配置工程的 @sitoo/capability-dev-host/services。仅可信 Node 初始化层；精确 bindings、scope、Provider 和数据库不接受消费页面输入。完整步骤与变量来源见[服务接入](/capabilities/services)。

## createModelTaskQuery

由同一 references 实例创建 TaskQuery，仅处理原 platform/infer，校验原任务/请求关联并 queryModel，不重跑。 相关操作见[指南](/capabilities/services)。

```ts
export declare function createModelTaskQuery(references: CapabilityReferences): TaskQuery;
```

## CapabilityBroker

注册/会话/准备/批准/执行/结果校验的可信代理，详细操作表见下方；不提供生产登录或跨进程 token。 相关操作见[指南](/capabilities/services)。

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

## CapabilityTasks

可信先持久化后执行的任务协调器；maxTasks 默认 10000、范围 1–1000000，allowEffects 默认 false，显式开启后副作用需确认，不自动恢复业务。

```ts
export declare class CapabilityTasks {
    #private;
    readonly broker: CapabilityBroker;
    constructor(options: {
        path: string;
        broker: CapabilityBroker;
        query?: TaskQuery;
        maxTasks?: number;
        allowEffects?: boolean;
        packageLeases?: TaskPackageLeases;
        scheduling?: Partial<TaskSchedulingLimits>;
        sharedQuotaPath?: string;
        accountKey?: (caller: Readonly<CapabilityCallerPolicy>) => string;
    });
    get(session: CapabilitySession, id: string): ProtocolValidation<DurableTask>;
    list(session: CapabilitySession, options?: {
        limit?: number;
        offset?: number;
    }): ProtocolValidation<DurableTask[]>;
    submit(session: CapabilitySession, raw: unknown): ProtocolValidation<DurableTask>;
    getConfirmation(session: CapabilitySession, id: string): ProtocolValidation<{
        taskId: string;
        revision: number;
        request: CapabilityRequest;
        binding: CapabilityBinding;
    }>;
    approve(session: CapabilitySession, id: string, revision: number): ProtocolValidation<DurableTask>;
    cancel(session: CapabilitySession, id: string): ProtocolValidation<DurableTask>;
    reconcile(session: CapabilitySession, id: string): Promise<ProtocolValidation<DurableTask>>;
    close(): void;
}
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

## ModelRequestLedger

持久原请求 reserve/read/complete/close。reserve 必须先于上游派发，同 ID 改身份冲突；无法证明完成时保留 dispatched，重开不自动生成。

```ts
export declare class ModelRequestLedger {
    #private;
    constructor(filename: string);
    read(scope: ReferenceScope, requestId: string): Readonly<ModelRequestRecord> | undefined;
    reserve(identity: ModelRequestIdentity): {
        created: boolean;
        record: Readonly<ModelRequestRecord>;
    };
    complete(identity: ModelRequestIdentity, result: JsonValue): JsonValue;
    close(): void;
}
```

## createDurableModelProvider

将可信 Ledger 与 upstream infer/query 组合成 ModelProvider；首次占用后执行，恢复只查原身份。回调/秘密不入库。 相关操作见[指南](/capabilities/services)。

```ts
export declare function createDurableModelProvider(options: {
    ledger: ModelRequestLedger;
    references: CapabilityReferenceStore;
    scope: ReferenceScope;
    referenceId: string;
    binding: CapabilityBinding;
    upstream: DurableModelUpstream;
}): ModelProvider;
```

## createImageService

把可信图片 Provider 与原模型账本、产物查询组合为 InstalledHostService；生成与读取端口分离，参数见[服务指南](/capabilities/services)。 相关操作见[指南](/capabilities/services)。

```ts
export declare function createImageService(options: {
    binding: CapabilityBinding;
    store: CapabilityReferenceStore;
    ledger: ModelRequestLedger;
    upstream: DurableModelUpstream;
}): {
    declaration: CapabilityDeclaration;
    execute: CapabilityExecutor;
    query: TaskQuery;
};
```

## imageCapabilityDeclaration

构建 platform/generate-image 原生接口声明；binding 来自签名安装原闭包，不是随意 placeholder 摘要。 相关操作见[指南](/capabilities/services)。

```ts
export declare function imageCapabilityDeclaration(binding: CapabilityBinding): CapabilityDeclaration;
```

## createRequestService

把可信结构化文本/图片 Provider 绑定到声明的原请求策略；不让应用选择任意 URL，原结果恢复只 query。 相关操作见[指南](/capabilities/services)。

```ts
export declare function createRequestService(options: {
    binding: CapabilityBinding;
    store: CapabilityReferenceStore;
    ledger: ModelRequestLedger;
    upstream: DurableModelUpstream;
}): {
    declaration: CapabilityDeclaration;
    execute: CapabilityExecutor;
    query: TaskQuery;
};
```

## requestCapabilityDeclaration

构建 platform/text-request 或 platform/image-request 结构化原请求声明；effects/权限与可信策略一致，执行实现由可信宿主提供。

```ts
export declare function requestCapabilityDeclaration(binding: CapabilityBinding): CapabilityDeclaration;
```

## ImageArtifact

已保存图片 PNG dataUrl 与 mimeType，用于原 taskArtifact 查询，不生成第二张。 相关操作见[指南](/capabilities/services)。

```ts
export interface ImageArtifact {
    mimeType: 'image/png';
    dataUrl: string;
}
```

## TaskArtifactQuery

原 completed 图像任务与四维 scope 的可信产物查询回调；复核归属与当前授权，不执行副作用。 相关操作见[指南](/capabilities/services)。

```ts
export type TaskArtifactQuery = (task: Readonly<DurableTask>, scope: Readonly<ReferenceScope>) => Promise<ImageArtifact>;
```

## ModelRequestIdentity

原 scope/entry/binding/referenceId/requestId/prompt/providerId/providerRevision，精确规范化占用身份，不可由应用更换 Provider。 相关操作见[指南](/capabilities/services)。

```ts
export interface ModelRequestIdentity {
    scope: ReferenceScope;
    entry: 'application' | 'conversation' | 'service';
    binding: CapabilityBinding;
    referenceId: string;
    providerId: string;
    providerRevision: number;
    requestId: string;
    prompt: string;
}
```

## ModelRequestRecord

原 identity、执行状态与可选 result；账本结果以原查询核对，不从超时推断未计费。 相关操作见[指南](/capabilities/services)。

```ts
export interface ModelRequestRecord extends ModelRequestIdentity {
    inputSha256: string;
    upstreamRequestId: string;
    status: 'dispatched' | 'completed';
    result?: JsonValue;
}
```

## DurableModelUpstream

可信 infer/query 上游适配； query 只按原 requestId 和不可变配置查询，不生成。 相关操作见[指南](/capabilities/services)。

```ts
export interface DurableModelUpstream {
    infer(record: Readonly<ModelRequestRecord>, signal?: AbortSignal): Promise<JsonValue>;
    query(record: Readonly<ModelRequestRecord>, signal?: AbortSignal): Promise<JsonValue>;
}
```

## CapabilityRuntime

构造合并并验证 limits；checkSource 编译真实包装器但不执行业务；createExecutor 校验原源码摘要并返回执行器；activeRuns 为当前运行数。CPU/等待中断不证明副作用未发生。 相关操作见[指南](/capabilities/services)。

```ts
export declare class CapabilityRuntime {
    #private;
    constructor(options?: {
        limits?: Partial<RuntimeLimits>;
        onState?: (event: RuntimeEvent) => void | Promise<void>;
    });
    get activeRuns(): number;
    checkSource({ source, sourceSha256 }: {
        source: string;
        sourceSha256: string;
    }, options?: {
        signal?: AbortSignal;
    }): Promise<ProtocolValidation<null>>;
    createExecutor({ source, sourceSha256, }: {
        source: string;
        sourceSha256: string;
    }): CapabilityExecutor;
}
```

## prepareInstalledHost

可信 v3 安装加载、验签授权与编译，传同实现实例 broker/runtime；services 为精确匹配的可信回调。返回 consumers、原租约和授权/资源检查端口，须 close。 相关操作见[指南](/capabilities/services)。

```ts
export declare function prepareInstalledHost(rootDirectory: string, raw: InstalledDevelopmentHostConfig | AuthorizedDevelopmentHostConfig, broker: CapabilityBroker, runtime: CapabilityRuntime, services?: readonly InstalledHostService[]): Promise<{
    consumers: any[];
    leases: TaskPackageLeases;
    authorized: (token: string) => boolean;
    application: (token: string) => {
        ok: false;
        error: import("@sitoo/capability-protocol").CapabilityError;
    } | {
        ok: true;
        value: {
            applicationId: string;
            packageId: string;
            version: string;
            sha256: string;
            entry: string;
            files: {
                path: string;
                bytes: number;
                sha256: string;
                source: string;
            }[];
        };
    };
    conversation: (token: string) => {
        ok: false;
        error: import("@sitoo/capability-protocol").CapabilityError;
    } | {
        ok: true;
        value: {
            planSha256: string;
            tools: CapabilityDeclaration[];
        };
    };
    accountKey: (caller: CapabilityCallerPolicy) => string;
    validateCaller: (caller: CapabilityCallerPolicy) => boolean;
    close: () => void;
}>;
```

## startDevelopmentHost

可信启动本机 HTTP，configPath/dataDirectory 必填；可选 planner/services/query/artifact/独立confirmationToken 来自可信配置，返回 url 与异步 close。不开放生产身份。 相关操作见[指南](/capabilities/services)。

```ts
export declare function startDevelopmentHost(options: {
    configPath: string;
    dataDirectory: string;
    sharedQuotaPath?: string;
    conversationPlanner?: ConversationPlanner;
    conversationPlanningTimeoutMs?: number;
    installedServices?: readonly InstalledHostService[];
    taskQuery?: TaskQuery;
    taskArtifact?: TaskArtifactQuery;
    confirmationToken?: string;
}): Promise<{
    url: string;
    close(): Promise<void>;
}>;
```

## InstalledHostService

签名原声明 declaration 与可信 execute 配对，缺失/多余/内容不一致拒绝；应用声明不能提供原生模块路径。 相关操作见[指南](/capabilities/services)。

```ts
export interface InstalledHostService {
    declaration: CapabilityDeclaration;
    execute: CapabilityExecutor;
}
```

## CapabilityInstallationStore

原子安装、更新、卸载、权限预检及租约管理；每个方法的参数/返回/幂等/失败见[初装](/publishing/installations)与[生命周期](/publishing/lifecycle)。只读模式不迁移旧 schema，也不允许写入；close 幂等。 相关操作见[指南](/capabilities/services)。

```ts
export declare class CapabilityInstallationStore {
    #private;
    constructor(path: string, root: CapabilityInstallationRoot, options?: {
        readOnly?: boolean;
    });
    prepare(requestId: string, roots: unknown, references: unknown, releases: CapabilityReleaseStore, trust: CapabilityPackageTrust, now?: number): ProtocolValidation<CapabilityInstallationTransaction>;
    prepareUpdate(requestId: string, roots: unknown, references: unknown, releases: CapabilityReleaseStore, trust: CapabilityPackageTrust, now?: number): ProtocolValidation<CapabilityInstallationTransaction>;
    prepareUninstall(requestId: string): ProtocolValidation<CapabilityInstallationTransaction>;
    commitUninstall(requestId: string): ProtocolValidation<CapabilityInstallationTransaction>;
    commit(requestId: string, releases: CapabilityReleaseStore, trust: CapabilityPackageTrust, now?: number): ProtocolValidation<CapabilityInstallationTransaction>;
    reviewUpdate(requestId: string, policy: CapabilityUpdatePolicy, releases: CapabilityReleaseStore, trust: CapabilityPackageTrust, now?: number): ProtocolValidation<CapabilityUpdateReview>;
    commitAuthorizedUpdate(requestId: string, policy: CapabilityUpdatePolicy, reviewSha256: string, releases: CapabilityReleaseStore, trust: CapabilityPackageTrust, now?: number): ProtocolValidation<CapabilityInstallationTransaction>;
    status(requestId: string): ProtocolValidation<CapabilityInstallationTransaction>;
    abort(requestId: string): ProtocolValidation<CapabilityInstallationTransaction>;
    pending(): ProtocolValidation<readonly CapabilityInstallationTransaction[]>;
    load(trust: CapabilityPackageTrust, now?: number): ProtocolValidation<{
        plan: CapabilityDependencyPlan;
        packages: readonly TrustedCapabilityPackage[];
    }>;
    acquireLease(taskId: string, requestId: string, bindings: readonly CapabilityBinding[], trust: CapabilityPackageTrust, now?: number): ProtocolValidation<CapabilityPackageLease>;
    getLease(taskId: string): ProtocolValidation<CapabilityPackageLease>;
    activeLeases(): ProtocolValidation<readonly CapabilityPackageLease[]>;
    releaseLease(taskId: string): ProtocolValidation<CapabilityPackageLease>;
    loadLease(taskId: string, trust: CapabilityPackageTrust, now?: number): ProtocolValidation<{
        plan: CapabilityDependencyPlan;
        packages: readonly TrustedCapabilityPackage[];
    }>;
    leaseInventory(): ProtocolValidation<{
        records: number;
        active: number;
        references: number;
    }>;
    collectUnused(): ProtocolValidation<{
        removed: number;
        retained: number;
    }>;
    inventory(): ProtocolValidation<{
        packages: number;
        roots: number;
        references: number;
        transactions: number;
    }>;
    close(): void;
}
```

## CapabilityAuthorizationStore

按可信 root+entry 的授权账本，read/status 只查，set 显式比较 expectedRevision；readOnly 只开已有库且拒写。参数、收据和恢复见[入口授权](/publishing/authorization)。 相关操作见[指南](/capabilities/services)。

```ts
export declare class CapabilityAuthorizationStore {
    #private;
    constructor(path: string, root: CapabilityInstallationRoot, entry: CapabilityCallerPolicy['entry'], options?: {
        readOnly?: boolean;
    });
    read(): ProtocolValidation<CapabilityAuthorization | null>;
    status(requestId: string): ProtocolValidation<CapabilityAuthorizationReceipt | null>;
    set(requestId: string, expectedRevision: number, raw: CapabilityAuthorizationPolicy, status?: CapabilityAuthorization['status']): ProtocolValidation<CapabilityAuthorizationReceipt>;
    close(): void;
}
```

## CapabilityPackageTrust

构造时固定可信公钥数组；verify(pkg,attestation,now?) 重验来源/环境/时间/撤销，now 默认 Date.now，不能由应用指定。 相关操作见[指南](/capabilities/services)。

```ts
export declare class CapabilityPackageTrust {
    #private;
    constructor(raw: readonly TrustedPackageKey[]);
    verify(pkg: VerifiedCapabilityPackage, raw: unknown, now?: number): ProtocolValidation<TrustedCapabilityPackage>;
}
```

## CapabilityReleaseStore

离线不可变发布库。publish 相同四维发布身份不能改内容；get 要精确 reference，当前重新验签；readOnly 不创建/发布，close 幂等。流程见[签名发布](/publishing/signatures)。 相关操作见[指南](/capabilities/services)。

```ts
export declare class CapabilityReleaseStore {
    #private;
    constructor(path: string, options?: {
        readOnly?: boolean;
    });
    publish(pkg: VerifiedCapabilityPackage, attestation: PackageAttestation, trust: CapabilityPackageTrust, now?: number): ProtocolValidation<{
        packageId: string;
        version: string;
        sha256: string;
        environment: Environment;
    }>;
    get(reference: {
        packageId: string;
        version: string;
        sha256: string;
        environment: Environment;
    }, trust: CapabilityPackageTrust, now?: number): ProtocolValidation<TrustedCapabilityPackage>;
    close(): void;
}
```

## verifyCapabilityPackage

manifestJson 是原清单文本，files 为真实 Map 的原字节；成功返回冻结校验快照，不验签授权。失败、预算和格式见[目录包](/capabilities/packages)。 相关操作见[指南](/capabilities/services)。

```ts
export declare function verifyCapabilityPackage(manifestJson: string, files: ReadonlyMap<string, Uint8Array>): ProtocolValidation<VerifiedCapabilityPackage>;
```

## signCapabilityPackage

已校验 pkg、可信 KeyObject Ed25519 私钥和 metadata 必填，返回署名 ProtocolValidation；不发布、不安装，私钥不进入结果。 相关操作见[指南](/capabilities/services)。

```ts
export declare function signCapabilityPackage(pkg: VerifiedCapabilityPackage, privateKey: KeyObject, options: PackageSigningMetadata): ProtocolValidation<Readonly<PackageAttestation>>;
```



## 可信服务参数与关闭

| 入口 | 必需参数与结果 | 恢复/失败 |
| --- | --- | --- |
| ModelRequestLedger(filename) | 私有独立库；reserve(identity) → created/record；read(scope,requestId) → record/undefined；complete(identity,result) → JsonValue | 先 reserve；相同请求只复用原记录，改 identity 冲突；close 关闭。库只记 dispatched/completed，不制造上游 unknown 终态 |
| createDurableModelProvider(options) | ledger/references/scope/referenceId/binding/upstream → ModelProvider | 原引用 Provider 标识/修订匹配；未知只 query，不 infer |
| imageCapabilityDeclaration(binding) | 签名原 platform/generate-image binding → 声明 | 不传临时 hash 或调用者选择的执行器 |
| requestCapabilityDeclaration(binding) | 签名原 platform/text-request 或 platform/image-request binding → 声明 | 同源策略由可信 Provider 控制，不让 input 指定任意 URL |
| createImageService/createRequestService | binding/store/ledger/upstream → declaration/execute/query | 均为可信接口；重复原请求不产生第二次副作用 |
| prepareInstalledHost(rootDirectory,config,broker,runtime,services?) | v3 config 与同实例 broker/runtime；services 默认 [] → consumers/leases/授权检查/资源查询/close | 精确声明匹配、真实 Guest 编译、有效信任授权，初始化失败拒绝运行 |
| startDevelopmentHost(options) | configPath/dataDirectory；可选 sharedQuotaPath、planner、planningTimeout、services、taskQuery、taskArtifact、confirmationToken → url/close | 只监听 loopback；plain serve 无模型；可信 installedServices 非空须独立操作者 token |
| createModelTaskQuery(references) | 原引用实例 → TaskQuery | 只处理 platform/infer，原结果查询失败保留 unknown |

startDevelopmentHost 的 planner 默认未启用，规划等待默认 5000 毫秒（允许 5000–30000）；使用模型 CLI 时显式为 30000 毫秒。不同于 RPC 和业务执行超时。`close()` 为 Promise，调用者 await 才表示本机关闭流程结束，不表示上游取消。可运行无收费基础宿主见[完整示例](/support/examples)；持久模型/图片/请求验证器在相同下载工具内，其 fixture 只证明适配，不证明生产 Provider 或费用结算。

本页重导出的 Broker/Tasks/References/Runtime/Package 类使用同一实现实例，具体方法语义分别见[代理](/reference/broker)、[任务](/reference/tasks)、[引用](/reference/references)、[执行器](/reference/runtime)、[包管理](/reference/packages)。不复制实例凭证跨模块混用。

源码开发宿主0.22.0提供可信`sharedQuotaPath`，serve进程环境`SITOO_TASK_QUOTA_PATH`转交同名选项。消费HTTP不能设置，未声明则保留局部模式；共享任务库启用后拒绝缺失/替换绑定。范围与schema兼容见[持久任务](/reference/tasks)。新公开工具ZIP尚未发布，既有下载契约保持。

---

[接口导航](/reference/) · [文档首页](/) · [支持范围](/getting-started/compatibility)
