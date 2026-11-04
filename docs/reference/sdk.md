# App SDK

应用契约、命令及平台服务类型。参数、返回值和结构字段见下方 TypeScript 声明。安装与使用方式见[环境与工具](/getting-started/setup)，边界见[权限与确认](/guides/permissions)。


App SDK 0.0.11：安装与导入见[环境设置](/getting-started/setup)，契约与命令见[应用指南](/guides/contracts)。普通页面只导入 /ui；下面的契约和类型供作者及可信集成使用。

## AiRuntime

运行器声明：pi/custom/none 表示集成选择，不让静态包取得自带原生执行权。 相关操作见[指南](/guides/contracts)。

```ts
export type AiRuntime = 'pi' | 'custom' | 'none';
```

## AppManifest

应用身份与运行声明。id 为应用标识，version 为应用 SemVer，sdkRange 为兼容范围，permissions 为整体权限，ui.entry 是包内 HTML；packageDependencies 为可信集成的环境/工作区依赖，不是共享能力安装闭包。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppManifest {
    id: string;
    name: string;
    version: string;
    sdkRange: string;
    aiRuntime: AiRuntime;
    permissions: string[];
    packageDependencies?: Array<{
        id: string;
        source: string;
        versionRange: string;
        optional?: boolean;
        scope: 'environment' | 'workspace';
        capabilities?: string[];
    }>;
    ui?: {
        entry: string;
    };
}
```

## AppToolResult

旧工具返回的展示文字 text 与可选 details；不作为审批或任务状态凭据。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppToolResult {
    text: string;
    details?: Record<string, unknown>;
}
```

## AppDefinition

旧工具模板的 manifest 与 tools 组合；新应用使用 RegisteredApp 与 invocation 契约。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppDefinition {
    manifest: AppManifest;
    tools?: AppToolDefinition[];
}
```

## AppRunStatus

旧运行状态：草稿、扫描、审阅、交付中、完成、失败、取消；不含共享 unknown。 相关操作见[指南](/guides/contracts)。

```ts
export type AppRunStatus = 'draft' | 'scanning' | 'review' | 'delivering' | 'completed' | 'failed' | 'cancelled';
```

## AppArtifact

旧运行产物：id 标识、kind 目录/清单/报告、path 为可信宿主产物路径，mediaType 可选；普通页面不能据此访问任意文件。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppArtifact {
    id: string;
    kind: 'directory' | 'manifest' | 'report';
    path: string;
    mediaType?: string;
}
```

## AppRunReference

旧运行引用：应用/版本、契约版本、并发修订、更新时间与产物。它是状态记录，不签发操作权。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppRunReference {
    id: string;
    appId: string;
    appVersion: string;
    contractVersion: 1;
    revision: number;
    status: AppRunStatus;
    updatedAt: string;
    artifacts: AppArtifact[];
}
```

## AppCapabilityContract

能力元数据与输入 schema；requiresTask/requiresConfirmation 描述执行需求，批准由宿主完成。examples 是可展示的命令字符串数组，不是参数对象数组。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppCapabilityContract {
    id: string;
    name: string;
    aliases: readonly string[];
    description: string;
    inputSchema: Readonly<Record<string, unknown>>;
    examples: readonly string[];
    permissions: readonly string[];
    requiresTask: boolean;
    requiresConfirmation: boolean;
}
```

## AppInvocationContract

整个应用的调用契约；appId/version 与 manifest 一致，uiEntry 指向包内入口，capabilities 列出可调用能力，help 为帮助文字。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppInvocationContract {
    contractVersion: 1;
    appId: string;
    name: string;
    version: string;
    description: string;
    uiEntry: string;
    help: string;
    capabilities: readonly AppCapabilityContract[];
}
```

## AppCommandReply

命令回应：success 为同步成功；processing 为仍在处理；needs-input 等待输入；needs-approval 等待可信确认。runId/revision 如存在，用于原状态关联。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppCommandReply {
    appId: string;
    status: 'success' | 'processing' | 'needs-input' | 'needs-approval';
    text: string;
    runId?: string;
    revision?: number;
}
```

## AppAttachment

宿主归属隔离的 PNG 副本，bytes 为字节数，dataUrl 用于预览。只保存 id 引用到草稿，大小与配额见[附件](/guides/resources)。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppAttachment {
    id: string;
    name: string;
    mimeType: 'image/png';
    bytes: number;
    dataUrl: string;
}
```

## AppImageReference

已有附件的 id 和文字 description；最多 8 项，说明最多 500 字符，不能传路径或跨应用 ID。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppImageReference {
    id: string;
    description: string;
}
```

## AppImageUpload

标准化 PNG 的 name 与 dataUrl；由页面准备受限输入，宿主再校验。上传不发起模型请求，详见[附件](/guides/resources)。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppImageUpload {
    name: string;
    dataUrl: string;
}
```

## validateAppSchema

检查输入的 schema 是否可由应用契约使用；成功无返回值，非法 schema 抛 AppContractError。不会运行应用。 相关操作见[指南](/guides/contracts)。

```ts
export declare function validateAppSchema(schema: Readonly<Record<string, unknown>>): void;
```

## validateAppValue

按给定 schema 校验未知输入，成功返回参数对象；无效值抛 AppContractError。只验证，不执行命令或授权。 相关操作见[指南](/guides/contracts)。

```ts
export declare function validateAppValue(schema: Readonly<Record<string, unknown>>, value: unknown): Record<string, unknown>;
```

## parseAppCommand

解析命令或帮助，输入是本契约与用户字符串；返回 help/natural/command 分支。natural 只是未命中显式命令，不自动请求模型。parameters 是解析得到的字符串字典，调用前需按能力 schema 解释与校验。 相关操作见[指南](/guides/contracts)。

```ts
export declare function parseAppCommand(contract: AppInvocationContract, input: string): {
    kind: "help";
    ability?: undefined;
    parameters?: undefined;
} | {
    kind: "natural";
    ability?: undefined;
    parameters?: undefined;
} | {
    kind: "help";
    ability: import("./index.js").AppCapabilityContract;
    parameters?: undefined;
} | {
    kind: "command";
    ability: import("./index.js").AppCapabilityContract;
    parameters: Record<string, string>;
};
```

## formatAppCommand

按已声明的 abilityId 与参数生成可解析命令字符串；校验能力及输入，不调用业务。与 parseAppCommand 配套使用。 相关操作见[指南](/guides/contracts)。

```ts
export declare function formatAppCommand(contract: AppInvocationContract, abilityId: string, parameters: unknown): string;
```

## appHelp

返回整个契约或指定能力的 AppCommandReply；abilityId 省略时为应用帮助。只展示帮助，无收费和执行。 相关操作见[指南](/guides/contracts)。

```ts
export declare function appHelp(contract: AppInvocationContract, abilityId?: string): AppCommandReply;
```

## APP_SDK_VERSION

实际 SDK 版本常量 0.0.11；不能代替宿主 getCapabilities 的运行版本。 相关操作见[指南](/guides/contracts)。

```ts
export declare const APP_SDK_VERSION = "0.0.11";
```

## AppTaskStatus

静态应用通用任务枚举；其 completed/failed 不提供所有上游任务语义，文本、图片和共享状态各用对应类型。 相关操作见[指南](/guides/contracts)。

```ts
export type AppTaskStatus = 'draft' | 'queued' | 'running' | 'needs-input' | 'needs-approval' | 'completed' | 'failed' | 'cancelled';
```

## AppTask

应用任务快照。revision 用于并发审查，phase/progress 供展示，artifacts 是交付项，error 为安全码/文字，resourceSnapshots 记录原资源版本。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppTask {
    id: string;
    appId: string;
    appVersion: string;
    contractVersion: number;
    title: string;
    revision: number;
    status: AppTaskStatus;
    phase?: string;
    progress?: {
        current: number;
        total?: number;
        message?: string;
    };
    updatedAt: string;
    artifacts: AppOutput[];
    error?: {
        code: string;
        message: string;
    };
    resourceSnapshots?: AppResourceSnapshot[];
}
```

## AppOutput

任务交付项 id/kind，name/mediaType 可选，resource.type 为 local-file/local-directory/url，resource.value 为引用；bytes/sha256 可选用于摘要记录，不是任意文件读取接口。

```ts
export interface AppOutput {
    id: string;
    kind: string;
    name?: string;
    mediaType?: string;
    resource: {
        type: 'local-file' | 'local-directory' | 'url';
        value: string;
    };
    bytes?: number;
    sha256?: string;
}
```

## AppConfigurationContract

配置声明：version 为配置格式整数，schema 校验普通 values，defaults 为初始值，credentials 描述可信宿主凭据槽；静态包不支持凭据槽。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppConfigurationContract {
    version: number;
    schema: Record<string, unknown>;
    defaults: Record<string, unknown>;
    fields?: Record<string, {
        placeholder?: string;
        options?: Record<string, string>;
    }>;
    credentialSlots?: readonly {
        id: string;
        label: string;
        required: boolean;
    }[];
}
```

## RegisteredApp

新应用的 manifest、invocation、可选 configuration/resourcePacks。AppCatalog 校验一致性；发布文件按[静态打包](/publishing/static-packages)生成。 相关操作见[指南](/guides/contracts)。

```ts
export interface RegisteredApp {
    manifest: AppManifest;
    invocation: AppInvocationContract;
    configuration?: AppConfigurationContract;
}
```

## AppContractError

契约、schema 或命令格式错误；可信集成应展示安全 message，修正输入，不重试业务执行。 相关操作见[指南](/guides/contracts)。

```ts
export declare class AppContractError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
```

## AppCatalog

可信应用注册表。构造参数 apps 为既有 RegisteredApp 数组；add 校验并增加应用，remove(id) 移除注册，get(id) 取得应用，list 返回注册列表。重复或无效契约拒绝；不是安装、签名或收费授权。

```ts
export declare class AppCatalog {
    constructor(apps: readonly RegisteredApp[]);
    list(): RegisteredApp[];
    add(app: RegisteredApp): void;
    remove(id: string): void;
    get(id: string): RegisteredApp;
}
```

## appResourcePackSchema

随包资源结构 schema；使用校验工具而非直接把 TypeScript 对象视为有效资源。 相关操作见[指南](/guides/contracts)。

```ts
export declare const appResourcePackSchema: z.ZodObject<{
    contractVersion: z.ZodLiteral<1>;
    id: z.ZodString;
    version: z.ZodString;
    targetAppId: z.ZodString;
    appVersionRange: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    industries: z.ZodArray<z.ZodString>;
    license: z.ZodString;
    source: z.ZodOptional<z.ZodString>;
    resources: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodEnum<{
            "design-rule": "design-rule";
            style: "style";
            reference: "reference";
            template: "template";
            font: "font";
            "delivery-spec": "delivery-spec";
            checklist: "checklist";
        }>;
        path: z.ZodString;
        sha256: z.ZodString;
        license: z.ZodString;
        attribution: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>;
```

## AppResourcePack

资源包身份、目标应用、兼容范围、分类和许可；resources 每项提供 kind/path/sha256/license/attribution。限制及读取见[资源指南](/guides/resources)。 相关操作见[指南](/guides/contracts)。

```ts
export type AppResourcePack = z.infer<typeof appResourcePackSchema>;
```

## AppResourceSnapshot

原资源包 packId/version/sha256 三字段用于追溯；不会随当前包更新自动改变。

```ts
export interface AppResourceSnapshot {
    packId: string;
    version: string;
    sha256: string;
}
```

## SitooImageRequest

生图参数：prompt 必填；aspectRatio、resolution、references 可选，支持值由 getCapabilities 返回，references 是允许的图像 URL。附件字段遵循实际绑定 schema；不能用此类型加入密钥。 相关操作见[指南](/guides/contracts)。

```ts
export interface SitooImageRequest {
    prompt: string;
    aspectRatio?: string;
    resolution?: '1K' | '2K' | '4K';
    references?: string[];
}
```

## SitooImageConfiguration

可信平台图像配置，revision 为并发修订，enabled/group/model 与尺寸约束决定生成，confirmBeforeGenerate 为兼容审批字段。应用不能自行配置上游秘密。 相关操作见[指南](/guides/contracts)。

```ts
export interface SitooImageConfiguration {
    revision: number;
    enabled: boolean;
    group: string;
    model: string;
    aspectRatio: string;
    resolution: '1K' | '2K' | '4K';
    confirmBeforeGenerate: boolean;
}
```

## SitooImageTask

图片任务持久快照：id/caller/status、request/configuration、时间、可选 gatewayTaskId/progress/artifacts/error。各状态与产物读取见[图片指南](/guides/images)。 相关操作见[指南](/guides/contracts)。

```ts
export interface SitooImageTask {
    id: string;
    caller: string;
    status: 'needs-approval' | 'submitting' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'unknown';
    request: SitooImageRequest;
    referenceCount?: number;
    configuration: SitooImageConfiguration;
    gatewayTaskId?: string;
    progress: number;
    createdAt: string;
    updatedAt: string;
    artifacts: {
        id: string;
        kind: 'image';
        resource: {
            type: 'url';
            value: string;
        };
        stored?: boolean;
        archived?: boolean;
    }[];
    error?: string;
}
```

## SitooImageCapabilities

真实可用配置：enabled/configured、model、比例/分辨率、maxReferences；cancellation=false 不支持上游取消。imageTasks=true 不保证配置可用。 相关操作见[指南](/guides/contracts)。

```ts
export interface SitooImageCapabilities {
    enabled: boolean;
    configured: boolean;
    model: string;
    resolutions: ('1K' | '2K' | '4K')[];
    aspectRatios: readonly string[];
    maxReferences: number;
    cancellation: false;
}
```

## AppImages

可信应用图像客户端 getCapabilities/generate/getTask/listTasks/getArtifact，宿主绑定 caller；不提供配置写入或取消。普通页面使用 /ui 子集。

```ts
export interface AppImages {
    getCapabilities(): Promise<SitooImageCapabilities>;
    generate(request: SitooImageRequest, requestId?: string): Promise<SitooImageTask>;
    getTask(id: string): Promise<SitooImageTask>;
    listTasks(): Promise<SitooImageTask[]>;
    getArtifact(id: string): Promise<{
        mimeType: 'image/png';
        dataUrl: string;
    }>;
}
```

## AppImageProvider

可信图像实现 getCapabilities 及按 caller 隔离的 generate/getTask/listTasks/getArtifact；页面不能自行注册，生成与任务完成分开。

```ts
export interface AppImageProvider {
    getCapabilities(): Promise<SitooImageCapabilities>;
    generate(caller: string, request: SitooImageRequest, requestId?: string): Promise<SitooImageTask>;
    getTask(caller: string, id: string): Promise<SitooImageTask>;
    listTasks(caller: string): Promise<SitooImageTask[]>;
    getArtifact(caller: string, id: string): Promise<{
        mimeType: 'image/png';
        dataUrl: string;
    }>;
}
```

## safeAppPath

校验包内相对路径并返回安全路径，拒绝绝对路径、穿越和非法路径；只做词法校验，不是 OS 文件系统隔离。 相关操作见[指南](/guides/contracts)。

```ts
export declare function safeAppPath(value: string): boolean;
```

## validateAppPackage

校验未知静态包对象，返回 AppPackage；结构或契约不合法抛安全错误，不验市场 TUF 来源或安装授权。 相关操作见[指南](/guides/contracts)。

```ts
export declare function validateAppPackage(input: unknown): AppPackage;
```

## appPackageSchema

静态 .spkg 清单结构 schema；files 的实际摘要与内容仍需打包器/安装器核查。 相关操作见[指南](/guides/contracts)。

```ts
export declare const appPackageSchema: z.ZodObject<{
    formatVersion: z.ZodLiteral<1>;
    execution: z.ZodLiteral<"static-platform">;
    app: z.ZodCustom<RegisteredApp, RegisteredApp>;
    bindings: z.ZodRecord<z.ZodString, z.ZodEnum<{
        "text.echo": "text.echo";
        "text.generate": "text.generate";
        "images.generate": "images.generate";
        "capabilities.text-request": "capabilities.text-request";
        "capabilities.image-request": "capabilities.image-request";
        "capabilities.call": "capabilities.call";
    }>>;
    resourcePacks: z.ZodDefault<z.ZodArray<z.ZodObject<{
        contractVersion: z.ZodLiteral<1>;
        id: z.ZodString;
        version: z.ZodString;
        targetAppId: z.ZodString;
        appVersionRange: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        industries: z.ZodArray<z.ZodString>;
        license: z.ZodString;
        source: z.ZodOptional<z.ZodString>;
        resources: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            kind: z.ZodEnum<{
                "design-rule": "design-rule";
                style: "style";
                reference: "reference";
                template: "template";
                font: "font";
                "delivery-spec": "delivery-spec";
                checklist: "checklist";
            }>;
            path: z.ZodString;
            sha256: z.ZodString;
            license: z.ZodString;
            attribution: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
    }, z.core.$strict>>>;
    files: z.ZodRecord<z.ZodString, z.ZodObject<{
        bytes: z.ZodNumber;
        sha256: z.ZodString;
    }, z.core.$strict>>;
}, z.core.$strict>;
```

## AppPackage

static-platform 清单包含 app、bindings 与 files。尺寸、摘要、路径和发布步骤见[静态打包](/publishing/static-packages)。 相关操作见[指南](/guides/contracts)。

```ts
export type AppPackage = z.infer<typeof appPackageSchema>;
```

## appErrorDetails

将未知错误转换为安全 code/message/retryable/action，不序列化堆栈、路径或任意对象；见[页面错误处理](/guides/browser-client)。 相关操作见[指南](/guides/contracts)。

```ts
export declare function appErrorDetails(error: unknown): AppErrorDetails;
```

## AppPlatformCapabilities

当前应用身份与 SDK 版本、features 和以字节/条数计的 limits；可选 feature 缺失按不可用处理。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppPlatformCapabilities {
    protocolVersion: 1;
    sdkVersion: string;
    appId: string;
    appVersion: string;
    features: {
        configuration: boolean;
        resources: boolean;
        storage: 1;
        imageTasks: boolean;
        attachments?: boolean;
        textInference: boolean;
        agentConversations?: boolean;
        attachmentUpload?: boolean;
        agentDictation?: boolean;
    };
    limits: {
        recordBytes: number;
        appBytes: number;
        records: number;
        pageSize: number;
    };
}
```

## AppDataSummary

记录列表元数据，含 id/revision/version/updatedAt，不含 value；分页后 get 读取详情。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppDataSummary {
    id: string;
    revision: number;
    version: number;
    updatedAt: string;
}
```

## AppDataRecord

完整记录：value 是 JSON 对象，deleted 标记墓碑；revision 为宿主并发修订，version 是应用数据格式。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppDataRecord extends AppDataSummary {
    value: Record<string, unknown>;
    deleted: boolean;
}
```

## AppDataPage

items 为未删除记录元数据，nextCursor 可选，缺失表示已到末页；列表不是并发快照。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppDataPage {
    items: AppDataSummary[];
    nextCursor?: string;
}
```

## AppDataQuery

cursor 为上一页末尾 id；limit 默认 50，上限 100。不要把 cursor 当数字 offset。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppDataQuery {
    cursor?: string;
    limit?: number;
}
```

## AppDataWrite

完整 JSON 写入，id 合法记录标识、revision 为编辑起点修订（新建为 0）、version 正整数；冲突让用户合并，见[存储](/guides/storage)。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppDataWrite {
    id: string;
    revision: number;
    version: number;
    value: Record<string, unknown>;
}
```

## AppErrorDetails

安全错误字段。action 指定 none/login/reload/resolve-conflict/query-task；retryable 不允许自动重试生成。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppErrorDetails {
    code: string;
    message: string;
    retryable: boolean;
    action: 'none' | 'login' | 'reload' | 'resolve-conflict' | 'query-task';
}
```

## AppSdkError

页面 SDK 抛出的 Error 子类，保留 code/retryable/action 与安全 message；构造只包装错误，不触发恢复。 相关操作见[指南](/guides/contracts)。

```ts
export declare class AppSdkError extends Error {
    readonly code: string;
    readonly retryable: boolean;
    readonly action: AppErrorDetails['action'];
    constructor(details: AppErrorDetails);
}
```

## AppTextModel

账户启用的模型记录。id 为不透明标识，name/group/price 展示；outputTokenLimit 如存在与 outputLimitSource 一起解释，platform 预算不保证模型真实上限。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppTextModel {
    id: string;
    name: string;
    group: string;
    price: string;
    outputTokenLimit?: number;
    outputLimitSource?: 'platform' | 'model';
}
```

## AppTextRequest

model/prompt 必填；instructions、maxTokens、responseSchema、attachments 可选。限制、默认预算与失败恢复见[文本任务](/guides/text)。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppTextRequest {
    model: string;
    prompt: string;
    instructions?: string;
    maxTokens?: number;
    responseSchema?: Record<string, unknown>;
    attachments?: import('./attachments.js').AppImageReference[];
}
```

## AppTextTask

id 等于原 requestId，状态 running/completed/failed/unknown；仅 completed 使用 text/value，usage 不等于账单，失败可能有部分文本和安全原因。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppTextTask {
    id: string;
    appId: string;
    status: 'running' | 'completed' | 'failed' | 'unknown';
    model: string;
    createdAt: string;
    updatedAt: string;
    text?: string;
    value?: Record<string, unknown>;
    usage?: {
        input: number;
        output: number;
        totalTokens: number;
    };
    error?: string;
    errorCode?: 'OUTPUT_LIMIT' | 'INVALID_OUTPUT' | 'UPSTREAM_REJECTED' | 'RESULT_UNKNOWN';
    stopReason?: 'completed' | 'length' | 'rejected' | 'unknown';
    maxTokens?: number;
}
```

## AppTextProvider

可信文本模型适配器，listModels/generate/getTask/listTasks 按 appId 隔离；generate 可能收费，不用于查询恢复。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppTextProvider {
    models(): Promise<AppTextModel[]>;
    generate(appId: string, request: AppTextRequest, requestId: string, packageDigest: string): Promise<AppTextTask>;
    getTask(appId: string, id: string): Promise<AppTextTask>;
    listTasks(appId: string): Promise<AppTextTask[]>;
}
```

## AppAgentConfiguration

本应用会话 model 和 instructions 必填；reasoningEffort 可选且须宿主支持。启用权限与费用见[应用对话](/guides/agent)。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppAgentConfiguration {
    model: string;
    instructions: string;
    reasoningEffort?: AppReasoningEffort;
}
```

## AppAgentMessage

会话消息 id/role/text；可选 error/stopped 表示回复错误或停止，不等于撤销上游费用。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppAgentMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    error?: string;
    stopped?: boolean;
}
```

## AppAgentState

closed/ready/running/error 状态及 messages；可选 sessionId、reasoningEffort/Levels、contextUsage、error。上下文 tokens 可为 null，不能当成 0。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppAgentState {
    sessionId?: string;
    status: 'closed' | 'ready' | 'running' | 'error';
    messages: AppAgentMessage[];
    reasoningEffort?: AppReasoningEffort;
    reasoningLevels?: AppReasoningEffort[];
    contextUsage?: {
        tokens: number | null;
        contextWindow: number;
    };
    error?: string;
}
```

## AppAgentSend

用户主动发送 requestId UUID、text；context/attachments 可选。重复或响应未知先查会话，不换 ID 重发。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppAgentSend {
    requestId: string;
    text: string;
    context?: string;
    attachments?: AppImageReference[];
}
```

## AppAgentProvider

可信会话与语音实现，按 appId 隔离；open/send 返回状态快照，stop/reset/getState 操作原会话，不注册工具执行权。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppAgentProvider {
    operate(scope: string, appId: string, digest: string, operation: string, input: unknown): Promise<AppAgentState>;
    busy(scope: string, appId: string): boolean;
}
```

## AppReasoningEffort

可声明 off/minimal/low/medium/high/xhigh/max；实际选择以宿主 reasoningLevels 为准，不保证所有模型支持。 相关操作见[指南](/guides/contracts)。

```ts
export type AppReasoningEffort = 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';
```

## AppDictationState

语音转写 idle/starting/running/ended、text 和可选安全 error；转写结果不自动发送，依赖宿主麦克风和服务。 相关操作见[指南](/guides/contracts)。

```ts
export interface AppDictationState {
    status: 'idle' | 'starting' | 'running' | 'ended';
    text: string;
    error?: string;
}
```

## defineApp

已弃用的旧工具定义包装器，仅兼容旧应用；新开发使用 RegisteredApp。 相关操作见[指南](/guides/contracts)。

::: warning 兼容接口
此接口已弃用，仅用于已有应用兼容；新应用使用当前契约。
:::

```ts
export declare function defineApp(definition: AppDefinition): AppDefinition;
```

## AppToolDefinition

旧工具 name/description/schema/execute 声明，仅可信模板兼容使用，不让新静态应用注册任意执行器。 相关操作见[指南](/guides/contracts)。

::: warning 兼容接口
此接口已弃用，仅用于已有应用兼容；新应用使用当前契约。
:::

```ts
export interface AppToolDefinition {
    name: string;
    description: string;
    parameters?: Record<string, unknown>;
    execute: (args: Record<string, unknown>) => Promise<AppToolResult>;
}
```


## 命令与校验的可运行例子

安装[SDK](/getting-started/setup)后，在该项目保存 command-example.mjs：

```js
import { AppCatalog, validateAppValue, parseAppCommand, formatAppCommand, appHelp } from '@sitoo/sdk';
const capability = { id: 'echo', name: '回显', aliases: [], description: '显示原文字',
  inputSchema: { type: 'object', additionalProperties: false, required: ['text'],
    properties: { text: { type: 'string', maxLength: 2000 } } },
  examples: ['echo text="你好"'], permissions: [], requiresTask: false, requiresConfirmation: false };
const invocation = { contractVersion: 1, appId: 'example.echo', name: '回显', version: '1.0.0',
  description: '本机无费用例子', uiEntry: 'index.html', help: '使用 echo text="文字"', capabilities: [capability] };
const app = { manifest: { id: 'example.echo', name: '回显', version: '1.0.0', sdkRange: '>=0.0.3 <0.1.0',
  aiRuntime: 'none', permissions: [], ui: { entry: 'index.html' } }, invocation };
// Catalog 校验契约；它不安装应用，也不会执行收费请求。
const catalog = new AppCatalog([app]);
const value = validateAppValue(capability.inputSchema, { text: '你好' });
const command = formatAppCommand(invocation, 'echo', value);
console.log(JSON.stringify({ appId: catalog.get(app.manifest.id).manifest.id,
  parsed: parseAppCommand(invocation, command), help: appHelp(invocation).text }));
```

执行 node command-example.mjs，预期 appId=example.echo、parsed.kind=command、parameters.text=你好。未知字段/超长输入拒绝，不能改 schema 绕过授权。parse 输入最多 10000 字符，key=value 的含空格值用双引号；数组/对象用 JSON 字符串编码。formatAppCommand 已做编码，不自己拼接来自用户的 shell 命令。

| 函数 | 参数 / 返回 | 错误与默认 |
| --- | --- | --- |
| validateAppSchema(schema) | 对象 schema → void | 无效 schema 抛 AppContractError |
| validateAppValue(schema,value) | schema/未知值 → 参数对象 | INVALID_PARAMETERS 等契约错误；不执行业务 |
| parseAppCommand(contract,input) | 契约/字符串 → help/natural/command | 未命中可为 natural，不自动规划；未知参数/重复参数拒绝 |
| formatAppCommand(contract,abilityId,parameters) | 契约/已声明能力/参数 → 命令字符串 | 能力不存在 UNKNOWN_CAPABILITY，参数先校验 |
| appHelp(contract,abilityId?) | 契约/可选能力 ID → AppCommandReply | 省略或未找到能力展示应用帮助 |
| safeAppPath(path) | 包内路径字符串 → 安全路径 | 非法路径拒绝，不打开文件 |
| validateAppPackage(value) | 未知静态包 → AppPackage | 格式错误拒绝；不验市场来源 |
| appErrorDetails(error) | 未知错误 → 安全 AppErrorDetails | 固定字段，无堆栈；[错误处理](/guides/browser-client) |

数据、附件、资源、文本、图像和 Agent 的字段约束及各方法成功例子分别见[存储](/guides/storage)、[资源](/guides/resources)、[文本](/guides/text)、[图像](/guides/images)、[会话](/guides/agent)。这里的完整声明保存准确可选性、联合类型和扩展字段，只有对应宿主提供能力时才可使用。

---

[接口导航](/reference/) · [文档首页](/) · [支持范围](/getting-started/compatibility)
