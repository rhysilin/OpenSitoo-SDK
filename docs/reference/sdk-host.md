# 可信应用宿主

仅可信 Node.js 宿主使用。参数、返回值和结构字段见下方 TypeScript 声明。安装与使用方式见[环境与工具](/getting-started/setup)，边界见[权限与确认](/guides/permissions)。


从 @sitoo/sdk/host 导入，仅可信 Node.js 宿主。目录、登录作用域和 Provider 由集成方提供，不可从页面输入采用。此宿主不提供进程安全隔离。静态应用消费界面与宿主注册职责见[权限指南](/guides/permissions)。

## AppDataStore

可信账户/应用存储句柄；路径由宿主给定，get/list/put/delete 语义与[配置数据](/guides/storage)相同，不授予文件权限。 相关操作见[指南](/guides/permissions)。

```ts
export declare class AppDataStore {
    constructor(root: string);
    get(scope: string, appId: string, id: string): Promise<AppDataRecord | null>;
    list(scope: string, appId: string, query?: AppDataQuery): Promise<AppDataPage>;
    put(scope: string, appId: string, write: AppDataWrite, current: () => void): Promise<AppDataRecord>;
    delete(scope: string, appId: string, id: string, revision: number, current: () => void): Promise<AppDataRecord>;
}
```

## APP_DATA_LIMITS

存储默认配额，字节为 UTF-8 JSON 字节，条数包含墓碑；运行值也由 platform.getCapabilities 返回。 相关操作见[指南](/guides/permissions)。

```ts
export declare const APP_DATA_LIMITS: {
    readonly recordBytes: 16384;
    readonly appBytes: number;
    readonly records: 1000;
    readonly pageSize: 100;
};
```

## ApplicationProvider

可信应用的 invoke/listTasks/getTask/可选 executeApproved；批准和执行分离，不能把 executeApproved 注册成模型批准工具。 相关操作见[指南](/guides/permissions)。

```ts
export interface ApplicationProvider {
    invoke(input: string): Promise<AppCommandReply | undefined>;
    listTasks(): Promise<AppTask[]>;
    getTask(id: string): Promise<AppTask>;
    executeApproved?(target: AppApprovalTarget): Promise<AppCommandReply>;
}
```

## AppConfigState

当前 appId、配置格式 version、revision、普通 values；credentials 只返回存在性布尔，不返回秘密。 相关操作见[指南](/guides/permissions)。

```ts
export interface AppConfigState {
    appId: string;
    version: number;
    revision: number;
    values: Record<string, unknown>;
    credentials: Record<string, boolean>;
}
```

## AppApprovalTarget

原批准目标 appId/capabilityId/taskId/revision/payload 的完整快照，任意变更应使旧票据失效。 相关操作见[指南](/guides/permissions)。

```ts
export interface AppApprovalTarget {
    appId: string;
    capabilityId: string;
    taskId: string;
    revision: number;
    payload: Record<string, unknown>;
}
```

## AppApprovalLedger

可信一次性审批账本。issue(scope,target) 返回票据；consume 校验同 scope 与目标并消费；revoke 清空。仅内存，不向模型或页面暴露签发。 相关操作见[指南](/guides/permissions)。

```ts
export declare class AppApprovalLedger {
    issue(scope: string, target: AppApprovalTarget): string;
    consume(scope: string, token: string, target: AppApprovalTarget): void;
    revoke(): void;
}
```

## ApplicationHost

可信宿主绑定 catalog/root/getScope 与可选凭据加密。register/unregister 管理提供者；invoke/getTask/listTasks 按应用分派；approve/executeApproved 分离；configuration/saveConfiguration/credential 是管理接口，普通页面不能读凭据。 相关操作见[指南](/guides/permissions)。

```ts
export declare class ApplicationHost {
    readonly approvals: AppApprovalLedger;
    readonly catalog: AppCatalog;
    constructor(catalog: AppCatalog, root: string, getScope: () => string | undefined, crypto?: {
        encrypt(value: string): string;
        decrypt(value: string): string;
    });
    register(appId: string, provider: ApplicationProvider): void;
    registerImages(provider: AppImageProvider): void;
    unregister(appId: string): void;
    images(appId: string): AppImages;
    invoke(appId: string, input: string): Promise<AppCommandReply | undefined>;
    approve(target: AppApprovalTarget): Promise<string>;
    executeApproved(target: AppApprovalTarget, ticket: string): Promise<AppCommandReply>;
    listTasks(appId: string): Promise<AppTask[]>;
    getTask(appId: string, id: string): Promise<AppTask>;
    configuration(appId: string): Promise<AppConfigState>;
    saveConfiguration(appId: string, revision: number, values: unknown, credentials?: Record<string, string>): Promise<AppConfigState>;
    credential(appId: string, slot: string): Promise<string | undefined>;
}
```


## 可信宿主集成流程

调用者先创建经过校验的 AppCatalog、自己的私有业务目录 root 和返回当前登录 scope 的 getScope；未登录返回 undefined，不从应用输入采用 scope。ApplicationHost 构造可选 crypto 提供 encrypt/decrypt；凭据加密与 ACL 由可信集成负责，不保证任意实现都安全。

| 操作 | 参数 / 结果 | 责任与失败 |
| --- | --- | --- |
| register(appId,provider)/unregister(appId) | 本 Catalog 已登记 ID、可信 Provider → void | 不从业务包加载任意 Node 执行器 |
| registerImages(provider)/images(appId) | 可信 Provider / 有声明权限的应用 → AppImages | 拒绝未授权应用，不向页面开放原 Provider |
| invoke(appId,input) | 应用 ID/命令 → AppCommandReply 或 undefined | 只分派，不凭返回 needs-approval 批准 |
| listTasks(appId)/getTask(appId,id) | 原应用与原任务 → AppTask[]/AppTask | 不切换登录身份读取他人数据 |
| approve(target) | 原 AppApprovalTarget → 一次性 ticket | 可信明确用户确认，不注册模型工具 |
| executeApproved(target,ticket) | 完全同一原目标与票据 → AppCommandReply | 改修订、payload 或 scope 拒绝 |
| configuration(appId) | 原应用 → AppConfigState | 秘密仅返回存在性标记 |
| saveConfiguration(appId,revision,values,credentials?) | 原修订/完整普通 values；可选秘密槽 → AppConfigState | schema/修订冲突拒绝；credentials 仅可信管理界面提供 |
| credential(appId,slot) | 原应用/声明槽 → string 或 undefined | 仅可信提供者读取，页面没有此端口 |

AppDataStore 的原子 JSON get/list/put/delete 与[存储指南](/guides/storage)使用同一数据契约；不是任意数据库或文件 API。配置冲突提示用户合并；执行或写入超时先查原状态，不能自动换 ID 执行。一个由集成方提供 catalog/provider/scope 的宿主片段不等于可独立运行的生产服务；普通作者从[静态入门](/getting-started/static-app)消费宿主即可。

---

[接口导航](/reference/) · [文档首页](/) · [支持范围](/getting-started/compatibility)
