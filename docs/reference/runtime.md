# 能力执行器

仅可信 Node.js 宿主使用；执行、取消与任务协调。参数、返回值和结构字段见下方 TypeScript 声明。安装与使用方式见[环境与工具](/getting-started/setup)，边界见[权限与确认](/guides/permissions)。


可信 Node 执行器，可从公开 service-host.mjs 导入；worker.mjs 和 quickjs.wasm 必须来自同版完整工具。每次业务调用创建受限 Guest，不导入 Node、文件或网络。示例见[完整示例](/support/examples)。

## RuntimeLimits

wallMs 总墙钟、cpuMs CPU、memoryBytes 分配预算、bridgeMs 单桥等待、maxCalls 总委托、maxPending 待答、maxConcurrent VM 并发，默认/范围见下方。 相关操作见[指南](/capabilities/packages)。

```ts
export interface RuntimeLimits {
    wallMs: number;
    cpuMs: number;
    memoryBytes: number;
    bridgeMs: number;
    maxCalls: number;
    maxPending: number;
    maxConcurrent: number;
}
```

## RuntimeEvent

执行器安全事件 requestId/capabilityId/state/activeRuns/code；state 不替代持久任务终态。 相关操作见[指南](/capabilities/packages)。

```ts
export interface RuntimeEvent {
    requestId: string;
    capabilityId: string;
    state: 'starting' | 'running' | 'completed' | 'failed' | 'cancelled';
    activeRuns: number;
    code?: CapabilityErrorCode;
}
```

## DEFAULT_RUNTIME_LIMITS

默认 wallMs=5000、cpuMs=250、memoryBytes=8388608、bridgeMs=1500、maxCalls=16、maxPending=4、maxConcurrent=8。 相关操作见[指南](/capabilities/packages)。

```ts
export declare const DEFAULT_RUNTIME_LIMITS: Readonly<RuntimeLimits>;
```

## CapabilityRuntime

构造合并并验证 limits；checkSource 编译真实包装器但不执行业务；createExecutor 校验原源码摘要并返回执行器；activeRuns 为当前运行数。CPU/等待中断不证明副作用未发生。 相关操作见[指南](/capabilities/packages)。

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
    }): Promise<`ProtocolValidation<null>`>;
    createExecutor({ source, sourceSha256, }: {
        source: string;
        sourceSha256: string;
    }): CapabilityExecutor;
}
```


## 编译、执行、资源预算

createExecutor 的 source 必填，为异步函数体字符串，sourceSha256 为原 UTF-8 字节的 64 位小写 SHA-256；执行器仍须注册 Broker。checkSource 使用相同参数，可选 signal 中断编译，返回 `ProtocolValidation<null>`；成功只表示真实 QuickJS 编译通过，不证明业务输出。完整构造和执行见[可信宿主例子](/support/examples)。

| 预算 | 默认 / 合法范围 | 单位 |
| --- | --- | --- |
| wallMs | 5000 / 1–30000 | 总墙钟毫秒，包含委托等待 |
| cpuMs | 250 / 1–1000 | Guest CPU 毫秒 |
| memoryBytes | 8388608 / 1048576–16777216 | 分配预算字节，不代表整个 Node 进程内存 |
| bridgeMs | 1500 / 1–30000 | 单次委托等待毫秒 |
| maxCalls | 16 / 1–64 | 总委托调用次数 |
| maxPending | 4 / 1–16 | 未完成委托数 |
| maxConcurrent | 8 / 1–16 | 同时运行 Guest 数 |

limits 省略使用默认，部分对象覆盖相应值；未知字段或非整数/超范围构造抛 RangeError。源码/摘要无效返回固定错误；超预算、取消与 worker 中断按协议保留不确定结果，不把 RESULT_UNKNOWN 写成“未收费”。onState 接收 RuntimeEvent，日志不加入输入、源码或秘密。Runtime 没有单独的长期会话关闭方法，每次执行由 Worker 生命周期清理；上层 tasks.close 和宿主 close 负责持久状态。

---

[接口导航](/reference/) · [文档首页](/) · [支持范围](/getting-started/compatibility)

## 进程预算与Guest预算

RuntimeLimits.memoryBytes仅限制QuickJS分配，不是整个Node进程RSS或提交内存。需要进程资源/生命周期控制时，Windows x64操作者按[受限宿主入口](/capabilities/host#windows-x64受限进程)启动完整工具包；Guest仍只获JSON委托，没有Node对象。直接从service-host.mjs导入CapabilityRuntime不会自动把当前进程加入Job，也不会开放生产执行。
