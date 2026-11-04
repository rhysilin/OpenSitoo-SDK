# 应用页面 SDK

运行在应用页面中的 JavaScript SDK，通过平台提供的页面通道调用服务；不是 Chrome、Edge 等浏览器软件，普通浏览器打开页面不会自动获得平台能力。参数、返回值和结构字段见下方 TypeScript 声明。安装与使用方式见[环境与工具](/getting-started/setup)，边界见[权限与确认](/guides/permissions)。


从 @sitoo/sdk/ui 或静态模板 client.js 导入。无需参数，身份由当前宿主绑定。完整初始化、功能发现和释放代码见[页面指南](/guides/browser-client)。返回 Promise 的操作可能抛 AppSdkError；超时与可重试标记不授权自动重放。

## createAppClient

建立当前应用页面客户端；无参数。各方法、参数与返回/错误见本页操作表及[初始化示例](/guides/browser-client)，账户/应用身份不可传入。 相关操作见[指南](/guides/browser-client)。

```ts
export declare function createAppClient(): {
    platform: {
        getCapabilities: () => Promise<import("./client-contract.js").AppPlatformCapabilities>;
    };
    storage: {
        get: (id: string) => Promise<import("./client-contract.js").AppDataRecord | null>;
        list: (query?: import("./client-contract.js").AppDataQuery) => Promise<import("./client-contract.js").AppDataPage>;
        put: (write: import("./client-contract.js").AppDataWrite) => Promise<import("./client-contract.js").AppDataRecord>;
        delete: (id: string, revision: number) => Promise<import("./client-contract.js").AppDataRecord>;
    };
    invoke<T = unknown>(capability: string, parameters: Record<string, unknown>, requestId?: string): Promise<T>;
    attachments: {
        uploadImages: (images: import("./attachments.js").AppImageUpload[]) => Promise<import("./attachments.js").AppAttachment[]>;
        importImages: () => Promise<import("./attachments.js").AppAttachment[]>;
        get: (attachmentId: string) => Promise<import("./attachments.js").AppAttachment>;
    };
    agent: {
        dictation: {
            getState: () => Promise<import("./agent.js").AppDictationState>;
            start: () => Promise<import("./agent.js").AppDictationState>;
            stop: () => Promise<import("./agent.js").AppDictationState>;
        };
        open: (configuration: import("./agent.js").AppAgentConfiguration) => Promise<import("./agent.js").AppAgentState>;
        getState: () => Promise<import("./agent.js").AppAgentState>;
        send: (input: import("./agent.js").AppAgentSend) => Promise<import("./agent.js").AppAgentState>;
        stop: () => Promise<import("./agent.js").AppAgentState>;
        reset: () => Promise<import("./agent.js").AppAgentState>;
    };
    text: {
        listModels: () => Promise<import("./text.js").AppTextModel[]>;
        getTask: (taskId: string) => Promise<import("./text.js").AppTextTask>;
        listTasks: () => Promise<import("./text.js").AppTextTask[]>;
    };
    images: {
        listTasks: () => Promise<import("./images.js").SitooImageTask[]>;
        getCapabilities: () => Promise<import("./images.js").SitooImageCapabilities>;
        getTask: (taskId: string) => Promise<import("./images.js").SitooImageTask>;
        getArtifact: (taskId: string) => Promise<{
            mimeType: "image/png";
            dataUrl: string;
        }>;
        watchTask(taskId: string, onTask: (task: import("./images.js").SitooImageTask) => void, onError?: (error: Error) => void): () => void;
    };
    resources: {
        list: () => Promise<{
            contractVersion: 1;
            id: string;
            version: string;
            targetAppId: string;
            appVersionRange: string;
            name: string;
            description: string;
            industries: string[];
            license: string;
            resources: {
                id: string;
                kind: "design-rule" | "style" | "reference" | "template" | "font" | "delivery-spec" | "checklist";
                path: string;
                sha256: string;
                license: string;
                attribution?: string | undefined;
            }[];
            source?: string | undefined;
        }[]>;
        read: (packId: string, resourceId: string) => Promise<{
            text: string;
            snapshot: import("./resource-packs.js").AppResourceSnapshot;
        }>;
    };
    configuration: {
        get: () => Promise<import("./host.js").AppConfigState>;
        save: (revision: number, values: Record<string, unknown>) => Promise<import("./host.js").AppConfigState>;
    };
    dispose(): void;
};
```

## AppSdkError

页面 SDK 抛出的 Error 子类，保留 code/retryable/action 与安全 message；构造只包装错误，不触发恢复。 相关操作见[指南](/guides/browser-client)。

```ts
export declare class AppSdkError extends Error {
    readonly code: string;
    readonly retryable: boolean;
    readonly action: AppErrorDetails['action'];
    constructor(details: AppErrorDetails);
}
```

## appErrorDetails

将未知错误转换为安全 code/message/retryable/action，不序列化堆栈、路径或任意对象；见[页面错误处理](/guides/browser-client)。 相关操作见[指南](/guides/browser-client)。

```ts
export declare function appErrorDetails(error: unknown): AppErrorDetails;
```


## 方法、参数与结果

方法都使用当前应用身份；除 dispose 外异步返回 Promise。可选字段标为 `?`，不能以 undefined/空值替代必填字段。类型字段在[App SDK](/reference/sdk)，对应流程页提供上下限与完整片段。

| 方法 | 参数及默认 | 返回 / 失败处理与例子 |
| --- | --- | --- |
| platform.getCapabilities() | 无 | AppPlatformCapabilities；[初始化与发现](/guides/browser-client) |
| storage.get(id) | 必填合法记录 ID | AppDataRecord/null，墓碑 deleted=true；[编辑冲突](/guides/storage) |
| storage.list(query?) | cursor?；limit 默认 50，1–100 | AppDataPage；nextCursor 续页；[分页模块](/examples/app-page-flows.js) |
| storage.put(write) | id/revision/version/value 必填 | 新修订完整记录；REVISION_CONFLICT 合并；[保存例子](/guides/storage) |
| storage.delete(id,revision) | ID 与当前修订必填 | 新修订墓碑；不物理释放配额；[存储](/guides/storage) |
| configuration.get() | 无 | AppConfigState；秘密只返回存在标记 |
| configuration.save(revision,values) | 当前修订、完整配置对象 | 新配置；schema/修订失败拒绝；[配置](/guides/storage) |
| resources.list() | 无 | 本应用 AppResourcePack[]，没有时空数组 |
| resources.read(packId,resourceId) | 来自 list 的两 ID | text/snapshot，最多 64 KB；[读取例子](/guides/resources) |
| invoke(capability,parameters,requestId?) | 已声明能力、schema 参数；新用户动作先保存 UUID | 依 binding 返回任务/回显；不重放；[文本](/guides/text)/[图片](/guides/images) |
| text.listModels() | 无 | AppTextModel[]，无可用模型为空；不代表配置密钥 |
| text.getTask(taskId) | 原 requestId 等于 task.id | AppTextTask；[原结果查询](/guides/text) |
| text.listTasks() | 无 | 当前应用历史文本任务数组；无删除/分页参数 |
| images.getCapabilities() | 无 | SitooImageCapabilities；配置与权限须都可用 |
| images.listTasks() | 无 | 当前应用 SitooImageTask[]；提交超时先用它恢复 |
| images.getTask(taskId) | 原图片 task.id | SitooImageTask；不是 requestId 直查 |
| images.getArtifact(taskId) | 原已完成任务 ID | PNG mimeType/dataUrl，读取失败不再生图 |
| images.watchTask(id,onTask,onError?) | 原任务与回调必填；错误回调可选 | 同步返回停止订阅函数；2 秒间隔、最多 10 分钟；[订阅例子](/guides/images) |
| attachments.importImages() | 无；用户选择 | AppAttachment[]，取消=[]；[附件](/guides/resources) |
| attachments.uploadImages(images) | AppImageUpload[]，最多 8 | 标准化受限 PNG 的 AppAttachment[]；未开放则拒绝 |
| attachments.get(id) | 原账户/应用附件 ID | AppAttachment；仅恢复预览，不发送模型 |
| agent.open(configuration) | model/instructions；reasoningEffort? | AppAgentState；配置来源是用户选择/应用规则 |
| agent.getState() | 无 | 当前应用会话状态与 messages |
| agent.send(input) | UUID/text；context?/attachments? | 接受快照，不代表回复完成；[发送例子](/guides/agent) |
| agent.stop() | 无 | 停止当前回复后的状态，不保证退费 |
| agent.reset() | 无，空闲时操作 | 新会话状态；不重发旧消息 |
| agent.dictation.getState/start/stop() | 无，先检查 agentDictation | AppDictationState；宿主麦克风转写，文字不自动发送 |
| dispose() | 无 | void，释放监听并拒绝后续调用，不取消上游 |

失败抛 AppSdkError，code/message/retryable/action 的逐项处理见[错误表](/guides/browser-client)。FORBIDDEN 复核权限，UNSUPPORTED_OPERATION 复核 features，TIMEOUT 只查询原任务，SESSION_CHANGED 重新打开原应用。片段使用应用教程的 client.js 和[页面流程模块](/examples/app-page-flows.js)，普通浏览器页面不具备此通道。

---

[接口导航](/reference/) · [文档首页](/) · [支持范围](/getting-started/compatibility)
