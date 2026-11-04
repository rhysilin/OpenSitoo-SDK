# 包管理接口

仅可信 Node.js 宿主使用；签名、安装、授权与数据迁移。参数、返回值和结构字段见下方 TypeScript 声明。安装与使用方式见[环境与工具](/getting-started/setup)，边界见[权限与确认](/guides/permissions)。


可信 Node 模块；独立工具可以通过 capability-kit/service-host.mjs 使用其重导出，CLI 覆盖其余管理操作。初始化的路径和根由操作者提供；所有存储类及时 close。签名、安装、授权和数据分别管理，指南见[安装事务](/publishing/installations)。

## verifyCapabilityPackage

manifestJson 是原清单文本，files 为真实 Map 的原字节；成功返回冻结校验快照，不验签授权。失败、预算和格式见[目录包](/capabilities/packages)。 相关操作见[指南](/publishing/installations)。

```ts
export declare function verifyCapabilityPackage(manifestJson: string, files: ReadonlyMap<string, Uint8Array>): ProtocolValidation<VerifiedCapabilityPackage>;
```

## readCapabilityPackage

directory 是可信操作者选择的目录；异步受限读取后做内容校验，错误不返回路径；不执行源码。 相关操作见[指南](/publishing/installations)。

```ts
export declare function readCapabilityPackage(directory: string): Promise<ProtocolValidation<VerifiedCapabilityPackage>>;
```

## resolveCapabilityDependencies

roots 为需求数组，catalog 只接本模块校验实例；确定性解析完整闭包或整体失败，不返回半计划。范围、循环和预算见[目录包](/capabilities/packages)。 相关操作见[指南](/publishing/installations)。

```ts
export declare function resolveCapabilityDependencies(roots: unknown, catalog: readonly VerifiedCapabilityPackage[]): ProtocolValidation<CapabilityDependencyPlan>;
```

## CapabilityDataMigrationStore

独立 JSON 后端 initialize/read/write/prepare/status/pending/commit/abort/rollback/close；所有参数、状态、失败与可执行演练见[数据迁移](/publishing/migrations)。不自动接 App SDK storage。 相关操作见[指南](/publishing/installations)。

```ts
export declare class CapabilityDataMigrationStore {
    #private;
    constructor(path: string, root: CapabilityInstallationRoot);
    initialize(dataVersion: number, value: unknown): ProtocolValidation<CapabilityDataSnapshot>;
    read(): ProtocolValidation<CapabilityDataSnapshot>;
    write(expectedRevision: number, expectedDataVersion: number, value: unknown): ProtocolValidation<CapabilityDataSnapshot>;
    prepare(requestId: string, expectedRevision: number, targetVersion: number, value: unknown): ProtocolValidation<CapabilityDataMigration>;
    status(requestId: string): ProtocolValidation<CapabilityDataMigration>;
    pending(): ProtocolValidation<readonly CapabilityDataMigration[]>;
    commit(requestId: string): ProtocolValidation<CapabilityDataMigration>;
    abort(requestId: string): ProtocolValidation<CapabilityDataMigration>;
    rollback(requestId: string): ProtocolValidation<CapabilityDataMigration>;
    close(): void;
}
```

## DATA_MIGRATION_LIMITS

整库根/迁移/版本预算，终态仍计账本；value 使用协议 JSON 限制，见[迁移](/publishing/migrations)。 相关操作见[指南](/publishing/installations)。

```ts
export declare const DATA_MIGRATION_LIMITS: Readonly<{
    roots: 128;
    records: 512;
    version: 2147483647;
    revision: 2147483647;
}>;
```

## CapabilityAuthorizationStore

按可信 root+entry 的授权账本，read/status 只查，set 显式比较 expectedRevision；readOnly 只开已有库且拒写。参数、收据和恢复见[入口授权](/publishing/authorization)。 相关操作见[指南](/publishing/installations)。

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

## AUTHORIZATION_LIMITS

授权整库 384 scope、1024 终身收据、revision 最大 2147483647；不自动淘汰。 相关操作见[指南](/publishing/installations)。

```ts
export declare const AUTHORIZATION_LIMITS: Readonly<{
    scopes: 384;
    records: 1024;
    revision: 2147483647;
}>;
```

## CapabilityAuthorizationPolicy

entry、grants、完整精确 bindings；声明权限不是 grants，最多 64 个权限/绑定，不能从消费 HTTP 建立。 相关操作见[指南](/publishing/installations)。

```ts
export type CapabilityAuthorizationPolicy = Pick<CapabilityCallerPolicy, 'entry' | 'grants' | 'bindings'>;
```

## CapabilityAuthorization

当前 revision、active/revoked 和 policy；revoked 使用空 grants，原 bindings 供审计。 相关操作见[指南](/publishing/installations)。

```ts
export interface CapabilityAuthorization {
    revision: number;
    status: 'active' | 'revoked';
    policy: CapabilityAuthorizationPolicy;
}
```

## CapabilityAuthorizationReceipt

原 requestId/expectedRevision/authorization 历史收据，不代表当前授权仍有效。 相关操作见[指南](/publishing/installations)。

```ts
export interface CapabilityAuthorizationReceipt {
    requestId: string;
    expectedRevision: number;
    authorization: CapabilityAuthorization;
}
```

## CapabilityDataSnapshot

dataVersion 为业务数据格式正整数，revision 为并发修订，value 完整 JSON；不同于包 SemVer。 相关操作见[指南](/publishing/installations)。

```ts
export interface CapabilityDataSnapshot {
    dataVersion: number;
    revision: number;
    value: JsonValue;
}
```

## CapabilityDataMigration

原请求、prepared/committed/aborted/rolledBack 和 before/after 快照；历史 after 不代表当前数据。 相关操作见[指南](/publishing/installations)。

```ts
export interface CapabilityDataMigration {
    requestId: string;
    status: 'prepared' | 'committed' | 'aborted' | 'rolledBack';
    before: CapabilityDataSnapshot;
    after: CapabilityDataSnapshot;
}
```

## CapabilityPackageTrust

构造时固定可信公钥数组；verify(pkg,attestation,now?) 重验来源/环境/时间/撤销，now 默认 Date.now，不能由应用指定。 相关操作见[指南](/publishing/installations)。

```ts
export declare class CapabilityPackageTrust {
    #private;
    constructor(raw: readonly TrustedPackageKey[]);
    verify(pkg: VerifiedCapabilityPackage, raw: unknown, now?: number): ProtocolValidation<TrustedCapabilityPackage>;
}
```

## signCapabilityPackage

已校验 pkg、可信 KeyObject Ed25519 私钥和 metadata 必填，返回署名 ProtocolValidation；不发布、不安装，私钥不进入结果。 相关操作见[指南](/publishing/installations)。

```ts
export declare function signCapabilityPackage(pkg: VerifiedCapabilityPackage, privateKey: KeyObject, options: PackageSigningMetadata): ProtocolValidation<Readonly<PackageAttestation>>;
```

## SIGNATURE_LIMITS

签名、公钥、发布记录与署名配额的固定上限；大小以字节/文本长度规则计，见[签名](/publishing/signatures)。 相关操作见[指南](/publishing/installations)。

```ts
export declare const SIGNATURE_LIMITS: Readonly<{
    keys: 32;
    attestationBytes: 4096;
    maxValidityMs: number;
}>;
```

## PackageSigningMetadata

keyId/environment/issuedAt/expiresAt；时间为 Unix 毫秒，署名区间不能超过可信公钥区间。 相关操作见[指南](/publishing/installations)。

```ts
export interface PackageSigningMetadata {
    keyId: string;
    environment: Environment;
    issuedAt: number;
    expiresAt: number;
}
```

## PackageAttestation

签名封装绑定精确 packageId/version/sha256 与环境、keyId/时间，signature 为规范 Ed25519 编码；不包含私钥。 相关操作见[指南](/publishing/installations)。

```ts
export interface PackageAttestation extends PackageSigningMetadata {
    formatVersion: 1;
    packageId: string;
    version: string;
    sha256: string;
    signature: string;
}
```

## TrustedPackageKey

操作者提供 keyId/namespace/environments/publicKeyPem/notBefore/notAfter/revoked；SPKI Ed25519 公钥不能从不可信包自动采纳。 相关操作见[指南](/publishing/installations)。

```ts
export interface TrustedPackageKey {
    keyId: string;
    namespace: string;
    environments: Environment[];
    publicKeyPem: string;
    notBefore: number;
    notAfter: number;
    revoked: boolean;
}
```

## TrustedCapabilityPackage

当前可信校验后的 package 与 attestation。序列化 JSON 不是可信对象，必须内容校验与验签重建。 相关操作见[指南](/publishing/installations)。

```ts
export interface TrustedCapabilityPackage {
    readonly package: VerifiedCapabilityPackage;
    readonly attestation: Readonly<PackageAttestation>;
}
```

## CapabilityReleaseStore

离线不可变发布库。publish 相同四维发布身份不能改内容；get 要精确 reference，当前重新验签；readOnly 不创建/发布，close 幂等。流程见[签名发布](/publishing/signatures)。 相关操作见[指南](/publishing/installations)。

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

## CapabilityInstallationStore

原子安装、更新、卸载、权限预检及租约管理；每个方法的参数/返回/幂等/失败见[初装](/publishing/installations)与[生命周期](/publishing/lifecycle)。只读模式不迁移旧 schema，也不允许写入；close 幂等。 相关操作见[指南](/publishing/installations)。

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

## INSTALLATION_LIMITS

整库安装根 128、缓存包 128、事务 512；prepared/aborted 与历史收据保留并计配额。 相关操作见[指南](/publishing/installations)。

```ts
export declare const INSTALLATION_LIMITS: Readonly<{
    roots: 128;
    packages: 128;
    transactions: 512;
}>;
```

## LEASE_LIMITS

持久租约记录上限；已 released 仍保留原去重账本，不借回收清空原请求。 相关操作见[指南](/publishing/installations)。

```ts
export declare const LEASE_LIMITS: Readonly<{
    records: 1024;
}>;
```

## CapabilityInstallationRoot

tenantId/accountId/applicationId/environment 四元身份，来自可信配置；应用根标识与 application 发布物一致。 相关操作见[指南](/publishing/installations)。

```ts
export interface CapabilityInstallationRoot {
    tenantId: string;
    accountId: string;
    applicationId: string;
    environment: 'development' | 'test' | 'production';
}
```

## CapabilityReleaseReference

packageId/version/sha256/environment 四个精确发布字段，由 publish 返回；不用最新版、范围或近似回退。 相关操作见[指南](/publishing/installations)。

```ts
export interface CapabilityReleaseReference {
    packageId: string;
    version: string;
    sha256: string;
    environment: CapabilityInstallationRoot['environment'];
}
```

## CapabilityInstallationTransaction

requestId/status/plan；prepared 不改变运行根，committed 为原收据，aborted 不可复用，当前根用 load。 相关操作见[指南](/publishing/installations)。

```ts
export interface CapabilityInstallationTransaction {
    requestId: string;
    status: 'prepared' | 'committed' | 'aborted';
    plan: CapabilityDependencyPlan;
}
```

## CapabilityPackageLease

原 taskId/requestId、active/released 与完整精确 plan；unknown 保留 active，不按时间自动释放。 相关操作见[指南](/publishing/installations)。

```ts
export interface CapabilityPackageLease {
    taskId: string;
    requestId: string;
    status: 'active' | 'released';
    plan: CapabilityDependencyPlan;
}
```

## CapabilityUpdatePolicy

目标 entry 与操作者决定的 grants；不含应用自报身份或批准秘密。 相关操作见[指南](/publishing/installations)。

```ts
export type CapabilityUpdatePolicy = Pick<CapabilityCallerPolicy, 'entry' | 'grants'>;
```

## CapabilityUpdateReview

原 requestId、根 generation、plan/policy 和 required/added/removed/missing/unsupportedEntries；reviewSha256 绑定整份审查，变更后旧批准拒绝，见[预检](/publishing/lifecycle)。 相关操作见[指南](/publishing/installations)。

```ts
export interface CapabilityUpdateReview {
    requestId: string;
    generation: number;
    plan: CapabilityDependencyPlan;
    policy: CapabilityUpdatePolicy;
    required: readonly string[];
    added: readonly string[];
    removed: readonly string[];
    missing: readonly string[];
    unsupportedEntries: readonly string[];
    reviewSha256: string;
}
```

## PackageRequirement

packageId 与合法非空 SemVer range，解析最终得到精确版本；同包重复/自依赖拒绝。 相关操作见[指南](/publishing/installations)。

```ts
export interface PackageRequirement {
    packageId: string;
    range: string;
}
```

## PackageCapability

与 CapabilityDeclaration 相同但以 capabilityId/source 取代 binding；source 指向声明的 .guest，实际绑定由包摘要建立。 相关操作见[指南](/publishing/installations)。

```ts
export interface PackageCapability extends Omit<CapabilityDeclaration, 'binding'> {
    capabilityId: string;
    source: string;
}
```

## CapabilityPackageManifest

quickjs-function-v1 函数包；完整字段与预算见[目录包](/capabilities/packages)，构建后才能签名安装。 相关操作见[指南](/publishing/installations)。

```ts
export interface CapabilityPackageManifest {
    formatVersion: 1;
    execution: 'quickjs-function-v1';
    packageId: string;
    version: string;
    dependencies: PackageRequirement[];
    capabilities: PackageCapability[];
    files: {
        path: string;
        bytes: number;
        sha256: string;
    }[];
}
```

## StaticApplicationPackageManifest

static-application-v1 页面包，applicationId/entry 明确，capabilities 为空；唯一顶层根，不作为其他包依赖，见[发布物](/capabilities/artifacts)。 相关操作见[指南](/publishing/installations)。

```ts
export interface StaticApplicationPackageManifest extends Omit<CapabilityPackageManifest, 'execution' | 'capabilities'> {
    execution: 'static-application-v1';
    capabilities: [
    ];
    application: {
        applicationId: string;
        entry: string;
    };
}
```

## InstallablePackageManifest

三种发布物的互斥 execution 分支：Guest 函数、静态共享页面、可信宿主服务声明；不是 .spkg 格式。 相关操作见[指南](/publishing/installations)。

```ts
export type InstallablePackageManifest = CapabilityPackageManifest | StaticApplicationPackageManifest | HostServicePackageManifest;
```

## HostServicePackageManifest

host-service-v1 仅接口声明，files 为空、能力无 source；执行回调来自可信宿主，见[服务接入](/capabilities/services)。 相关操作见[指南](/publishing/installations)。

```ts
export interface HostServicePackageManifest extends Omit<CapabilityPackageManifest, 'execution' | 'capabilities' | 'files'> {
    execution: 'host-service-v1';
    capabilities: Omit<PackageCapability, 'source'>[];
    files: [
    ];
}
```

## VerifiedCapabilityPackage

冻结 manifest/sha256/sources/bindings 内容快照，仅证明格式和摘要，不等于来源信任、授权或已安装。 相关操作见[指南](/publishing/installations)。

```ts
export interface VerifiedCapabilityPackage {
    readonly manifest: InstallablePackageManifest;
    readonly sha256: string;
    readonly sources: Readonly<Record<string, string>>;
    readonly bindings: readonly CapabilityBinding[];
}
```

## CapabilityDependencyPlan

需求 roots、依赖先于消费者的精确 packages 和 bindings，完整快照不能作为新可信 catalog；持久计划通过安装 load 重验。 相关操作见[指南](/publishing/installations)。

```ts
export interface CapabilityDependencyPlan {
    formatVersion: 1;
    roots: readonly PackageRequirement[];
    packages: readonly {
        packageId: string;
        version: string;
        sha256: string;
    }[];
    bindings: readonly CapabilityBinding[];
}
```

## PACKAGE_LIMITS

清单 64 KiB、16 文件/能力、单源 64 KiB、总包 1 MiB、32 依赖、128 catalog、2048 搜索状态；见[目录包](/capabilities/packages)。 相关操作见[指南](/publishing/installations)。

```ts
export declare const PACKAGE_LIMITS: Readonly<{
    manifestBytes: 65536;
    files: 16;
    sourceBytes: 65536;
    packageBytes: 1048576;
    dependencies: 32;
    capabilities: 16;
    catalog: 128;
    searchStates: 2048;
}>;
```


## 方法使用入口与共同参数

| 入口 | 权威参数/默认/返回/失败说明与成功例子 |
| --- | --- |
| 内容校验 verify/read、依赖 resolve | [目录包](/capabilities/packages)：manifest 文本、Map 原字节、目录与完整需求；返回 ProtocolValidation |
| sign、Trust.verify、Release.publish/get/close | [签名](/publishing/signatures)：精确四字段引用、Unix 毫秒与可信时钟、不可变发布；now 默认 Date.now() |
| Installation.prepare/commit/status/pending/abort/load/inventory/close | [安装](/publishing/installations)：四元 root、原请求幂等、中断查询与 schema 3；readOnly 默认 false |
| prepareUpdate/reviewUpdate/commitAuthorizedUpdate/prepareUninstall/commitUninstall/collectUnused | [生命周期](/publishing/lifecycle)：权限差异、摘要绑定、根代数、活动租约与回退 |
| acquireLease/getLease/activeLeases/releaseLease/loadLease/leaseInventory | [执行租约](/publishing/lifecycle)：taskId/requestId、bindings 和当前 trust；unknown 不强制释放 |
| Authorization.read/status/set/close | [入口授权](/publishing/authorization)：expectedRevision 初始 0，status 默认 active，各入口独立，readOnly 默认 false |
| DataMigration.initialize/read/write/prepare/status/pending/commit/abort/rollback/close | [迁移](/publishing/migrations)：数据版本、修订与完整前后快照，回退不覆盖新写入 |

所有返回 ProtocolValidation 的方法先判断 ok；close 返回 void，构造存储类可能抛安全不可用错误。readOnly 模式只打开已有匹配 schema 的库，拒写、拒迁移、拒创建；ReleaseStore 也支持此选项。管理操作不是业务页面或生产 HTTP API。CLI 调用与合法输入文件见[命令参考](/reference/cli)，完整演练见[共享教程](/getting-started/quickstart)与[健康/CI](/publishing/testing)。

---

[接口导航](/reference/) · [文档首页](/) · [支持范围](/getting-started/compatibility)
