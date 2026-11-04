# 持久任务

仅可信 Node.js 宿主使用；任务持久化与查询。参数、返回值和结构字段见下方 TypeScript 声明。安装与使用方式见[环境与工具](/getting-started/setup)，边界见[权限与确认](/guides/permissions)。

可信 Node 持久任务协调；数据库路径、broker/session/query 由宿主选择。submit 先保存再执行，返回快照不是最终响应；unknown 不自动重跑。公开无费用示例见[完整示例](/support/examples)，业务恢复见[任务指南](/guides/tasks)。

## LegacyTaskViews

可信旧文本/图像查询适配，仅从配置的 readers/map 按 scope 查询；不创建或批准旧任务。 相关操作见[指南](/guides/tasks)。

```ts
export declare class LegacyTaskViews {
    #private;
    constructor(options: {
        broker: CapabilityBroker;
        readers: LegacyTaskReaders;
        map: LegacyScopeMap;
    });
    list(session: CapabilitySession, source: LegacyTaskView['source']): Promise<ProtocolValidation<LegacyTaskView[]>>;
    get(session: CapabilitySession, source: LegacyTaskView['source'], id: string): Promise<ProtocolValidation<LegacyTaskView>>;
}
```

## CapabilityTaskViews

已有任务库的可信只读 get/list/close，scope 不含入口但限定原四维消费归属；不启动执行或恢复 unknown。 相关操作见[指南](/guides/tasks)。

```ts
export declare class CapabilityTaskViews {
    #private;
    constructor(options: {
        path: string;
        scope: CapabilityTaskViewScope;
    });
    get(taskId: string): ProtocolValidation<DurableTask>;
    list(options?: {
        limit?: number;
        offset?: number;
    }): ProtocolValidation<DurableTask[]>;
    close(): void;
}
```

## CapabilityTaskViewScope

原 tenantId/environment/installationId/consumerAppId 四维查询范围；不能从页面输入推导。 相关操作见[指南](/guides/tasks)。

```ts
export type CapabilityTaskViewScope = Pick<CapabilityCallerPolicy, 'tenantId' | 'environment' | 'installationId' | 'consumerAppId'>;
```

## LegacyTaskView

旧任务的只读映射，source 区分文本/图像，gatewayTaskId/text/value/artifacts 可选，不能假造缺失历史结果。 相关操作见[指南](/guides/tasks)。

```ts
export interface LegacyTaskView {
    source: 'legacy-text' | 'legacy-image';
    taskId: string;
    status: CapabilityTaskStatus;
    createdAt: string;
    updatedAt: string;
    gatewayTaskId?: string;
    text?: string;
    value?: Record<string, unknown>;
    artifacts?: JsonValue;
}
```

## LegacyTaskReaders

可信注入文本/图像 getTask/listTasks，只读，不能传 generate。 相关操作见[指南](/guides/tasks)。

```ts
export interface LegacyTaskReaders {
    text?: Pick<AppTextProvider, 'getTask' | 'listTasks'>;
    image?: Pick<AppImageProvider, 'getTask' | 'listTasks'>;
}
```

## LegacyScopeMap

可信把四维共享 scope 映射到旧 textAppId/imageCaller；未映射返回 undefined 并拒绝读取。 相关操作见[指南](/guides/tasks)。

```ts
export type LegacyScopeMap = (scope: {
    tenantId: string;
    environment: string;
    installationId: string;
    consumerAppId: string;
}) => {
    textAppId?: string;
    imageCaller?: string;
} | undefined;
```

## TaskSchedulingLimits

可信宿主的单账本调度限制。包含总量及租户/账户/应用作用域的并发和非终态任务容量，executionMs为分派后的执行期限。消费应用不能修改。

```ts
export interface TaskSchedulingLimits {
    maxConcurrent: number;
    maxConcurrentPerTenant: number;
    maxConcurrentPerAccount: number;
    maxConcurrentPerScope: number;
    maxPending: number;
    maxPendingPerTenant: number;
    maxPendingPerAccount: number;
    maxPendingPerScope: number;
    executionMs: number;
}
```

## DEFAULT_TASK_SCHEDULING_LIMITS

只读默认调度配置：并发8/2/2/1、非终态容量64/16/16/8、执行期限30000ms。属于本机工程初值，不能据此声明生产吞吐或整机内存保证。

```ts
export declare const DEFAULT_TASK_SCHEDULING_LIMITS: Readonly<TaskSchedulingLimits>;
```

## DurableTask

原 taskId/requestId/capabilityId/status 与精确 binding、revision/时间；result 是协议响应，upstreamTask 保存已接受原上游引用。 相关操作见[指南](/guides/tasks)。

```ts
export interface DurableTask extends CapabilityTaskReference {
    binding: CapabilityBinding;
    revision: number;
    createdAt: string;
    updatedAt: string;
    result?: CapabilityResponse;
    upstreamTask?: CapabilityTaskReference;
}
```

## TaskPackageLeases

任务协调器 acquire/release 与安装库的可信适配；acquire 先保护完整计划，无法证明结果时保留，release 不面向应用。 相关操作见[指南](/guides/tasks)。

```ts
export interface TaskPackageLeases {
    acquire(task: Readonly<DurableTask>, caller: Readonly<CapabilityCallerPolicy>): ProtocolValidation<null>;
    release(task: Readonly<DurableTask>, scope: string): ProtocolValidation<null>;
}
```

## TaskQuery

只查询原 task/request/caller 的上游回调，signal 供取消等待；不 infer/generate，不找不到就制造成功或失败。 相关操作见[指南](/guides/tasks)。

```ts
export type TaskQuery = (task: Readonly<DurableTask>, signal: AbortSignal, context: {
    request: CapabilityRequest;
    caller: CapabilityCallerPolicy;
}) => Promise<unknown>;
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



## 任务方法与恢复

构造 path 是可信私有 SQLite 文件，父目录须存在；broker 必填且为同实现实例，query/packageLeases 可选；allowEffects 默认 false；maxTasks 为整库终身记录预算，默认 10000（1–1000000）。未知 schema、异种库或存储不可用构造安全失败，不能换新库假装恢复。

| 方法 | 参数、返回与默认 | 处理 |
| --- | --- | --- |
| submit(session,request) | 原 session 与完整请求 → 同步 ProtocolValidation 的 DurableTask | 先落盘，原 ID 指纹去重；不把快照当完成 |
| get(session,id) | 原 UUID → DurableTask | 只读原 owner；越权/不存在 FORBIDDEN |
| list(session,{limit?,offset?}) | limit 默认 50、1–100，offset 默认 0、非负安全整数 → 数组 | 按宿主顺序分页，不是快照 |
| getConfirmation(session,id) | 原需确认任务 → taskId/revision/request/binding | 预览只读，没有执行 |
| approve(session,id,revision) | 原任务当前修订 → 新快照 | 可信操作者明确确认后调用，修订变化拒绝，不向模型暴露 |
| cancel(session,id) | 原 UUID → 快照 | 取消等待或未派发；已派发未知副作用保留原 pin |
| reconcile(session,id) | 原 UUID → 异步校验的原任务 | 只调用 query，不 submit/infer；失败保留 unknown |
| close() | 无 → void | 结束本机等待并持久化不确定状态；不自动重试、取消上游或释放保护 |

完整执行例子见[支持示例](/support/examples)，费用确认见[服务接入](/capabilities/services)。终态 result 为 success/error 或上游 accepted 引用，不靠 status 单字判断数据有效。restart 会将不确定在途执行保存为 unknown；旧只读 CapabilityTaskViews 的构造不触发此恢复。CapabilityTaskViews.list 使用同样 50/100/offset 参数，close 幂等；LegacyTaskViews 仅通过 readers/map 读取旧业务记录，不执行生成。


## 有界排队与账户计数

Tasks0.6.1包含可信构造选项 `scheduling` 和 `accountKey`，共享工具包0.39.0已包含新实现，旧0.36.0ZIP保留原契约。独立Node模块为workspace private，未发布公共npm。

```ts
const tasks = new CapabilityTasks({
  path: trustedDatabasePath,
  broker,
  // 账户从宿主已验证的安装根解析，不能从请求JSON读取。
  accountKey: caller => trustedAccounts.get(caller.installationId)!,
  scheduling: { maxConcurrent: 4, maxConcurrentPerAccount: 1 }
});
```

示例中的 `trustedDatabasePath`、`broker` 和 `trustedAccounts` 由宿主初始化，不是应用输入。未设置accountKey时使用installationId，不能把它解释成同账户多个安装的总配额。已安装开发宿主从可信安装根accountId读取映射。

并发和待处理限制同时应用于当前账本总量、(environment,tenantId)、(environment,tenantId,可信账户)、原四维scope。空位按租户轮转，拥塞的scope不会阻塞其他可执行scope。满额的新请求返回LIMIT_EXCEEDED，原requestId仍返回原任务；unknown与等待审批占容量，不删除去重记录腾出空间。旧记录缺少账户计量字段时保守计入同租户账户预算。

queued取消后是cancelled；执行超时或已分派取消保持unknown、原ID和版本pin。忽略中止信号的执行器继续占实际槽，迟到结果不能覆盖unknown。恢复只查原请求，不能自动重新生成收费调用。任务执行期限最多30000ms，原reconcile查询期限1500ms保持。

这是单账本调度。不同账本没有全机总配额，VM内存上限不是OS进程内存硬上限；production业务执行仍未开放。支持边界见[支持范围](/getting-started/compatibility)，恢复流程见[任务指南](/guides/tasks)。


## 跨任务库配额与兼容

可信构造`sharedQuotaPath`指定同机公共SQLite配额文件，不同账本使用同一文件才能共享计数。账户仍须从可信安装根映射。消费请求不能指定路径、身份或数值；所有连接必须用相同调度配置，配置不兼容或库被锁定不会回退局部执行。Desktop同一平台资料根的页面与服务宿主共用文件；不同资料根或机器不自动共享。

```ts
const tasks = new CapabilityTasks({
  path: trustedTaskDatabase,
  broker,
  sharedQuotaPath: trustedSharedQuotaFile,
  accountKey: caller => trustedAccounts.get(caller.installationId)!
});
```

上述变量均由宿主初始化。容量先占位、任务后落盘；跨库中断可能留下保守占位。等待队列按租户轮转，50ms复核许可。已持有许可的进程必须实际退出或执行器返回才能释放槽；存活无响应、权限不明和PID复用保守保留。不会用心跳过期多开任务。退出只回收本机槽，unknown与孤立占位仍占待处理预算，原请求只能查询，不声称上游已取消或退款。

启用后任务schema2固定配额路径，旧执行器拒绝，当前执行器不能禁用/换文件绕过。普通局部模式仍schema1；旧非终态缺少可信计量字段时拒绝猜测迁移，原库可通过CapabilityTaskViews只读查看。只读查询支持合法schema1/2，不修改任务或配额。不提供自动schema降级或删未知占位入口。

共享SQLite协调仅适用于可信本机宿主，不是OS沙盒或全机任意进程预算；生产执行继续关闭。新公开工具ZIP尚未发布，现有下载版本保持原契约。

任务库同时绑定共享配额库的随机实例标识；删除重建/替换实例或丢失非终态原占位均拒绝，不自动从单个任务库重建全局计数。备份恢复应保留整组一致性。

## 存储错误与关闭

close是同步、幂等操作；即使写入unknown失败，也会停止调度、中止信号并关闭连接，随后抛出存储错误。最后持久running/queued在重启时恢复原编号unknown。跨库失败可能保留孤立pin和配额占位，不能自动清除后生成新请求；协调库缺表拒绝静默重建。资源不足、网络丢失响应和进程终止都不能证明上游没有副作用。参见[任务与恢复](/guides/tasks)与[受限宿主](/capabilities/host)。

---

[接口导航](/reference/) · [文档首页](/) · [支持范围](/getting-started/compatibility)
