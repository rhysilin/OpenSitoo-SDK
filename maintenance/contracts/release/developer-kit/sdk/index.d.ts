/**
 * App SDK — 契约② 的落点。
 *
 * 面向应用开发者的**稳定契约**：manifest 规范 + 双面（独立 UI 面 + 可编排 tools 面）定义。
 * 应用只依赖本 SDK，永不 import Pi（`@earendil-works/*`）；SDK 向后兼容（`sdkRange` 声明区间）。
 */
/** 应用能力来源：pi（Pi 驱动）/ custom（自研，走 SDK 模型通道）/ none（纯工具） */
export type AiRuntime = 'pi' | 'custom' | 'none';
export interface AppManifest {
    id: string;
    name: string;
    version: string;
    /** 兼容的 SDK 版本区间，如 ">=0.0.1 <1.0.0" */
    sdkRange: string;
    aiRuntime: AiRuntime;
    permissions: string[];
    /** 可选 Pi 生态依赖；平台处理安装、版本与加载，应用不直接 import Pi。 */
    packageDependencies?: Array<{
        id: string;
        source: string;
        versionRange: string;
        optional?: boolean;
        scope: 'environment' | 'workspace';
        capabilities?: string[];
    }>;
    /** 面 A：独立 UI 入口 */
    ui?: {
        entry: string;
    };
}
/** @deprecated M0 工具声明；新应用使用 AppInvocationContract + ApplicationProvider。 */
export interface AppToolDefinition {
    name: string;
    description: string;
    parameters?: Record<string, unknown>;
    execute: (args: Record<string, unknown>) => Promise<AppToolResult>;
}
export interface AppToolResult {
    text: string;
    details?: Record<string, unknown>;
}
export interface AppDefinition {
    manifest: AppManifest;
    tools?: AppToolDefinition[];
}
/** @deprecated M0 兼容入口；新应用通过 AppCatalog 注册 RegisteredApp。 */
export declare function defineApp(definition: AppDefinition): AppDefinition;
/** Versioned app-service contract. Business state is independent of chat history. */
export type AppRunStatus = 'draft' | 'scanning' | 'review' | 'delivering' | 'completed' | 'failed' | 'cancelled';
export interface AppArtifact {
    id: string;
    kind: 'directory' | 'manifest' | 'report';
    path: string;
    mediaType?: string;
}
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
/** Shared by independent UI, explicit commands and model tool descriptions. */
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
export interface AppCommandReply {
    appId: string;
    status: 'success' | 'processing' | 'needs-input' | 'needs-approval';
    text: string;
    runId?: string;
    revision?: number;
}
export * from './platform.js';
export * from './resource-packs.js';
export * from './images.js';
export * from './distribution.js';
export * from './client-contract.js';
export * from './text.js';
export * from './agent.js';
export type { AppAttachment, AppImageReference, AppImageUpload } from './attachments.js';
