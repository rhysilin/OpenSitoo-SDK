/** Public browser contracts. These types do not expose host paths or credentials. */
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
        /** Native image import and scoped attachment previews (SDK 0.0.6+). */
        attachments?: boolean;
        textInference: boolean;
        /** Isolated, tool-free Pi conversations (SDK 0.0.7+). */
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
export interface AppDataSummary {
    id: string;
    revision: number;
    version: number;
    updatedAt: string;
}
export interface AppDataRecord extends AppDataSummary {
    value: Record<string, unknown>;
    deleted: boolean;
}
export interface AppDataPage {
    items: AppDataSummary[];
    nextCursor?: string;
}
export interface AppDataQuery {
    cursor?: string;
    limit?: number;
}
export interface AppDataWrite {
    id: string;
    revision: number;
    version: number;
    value: Record<string, unknown>;
}
export interface AppErrorDetails {
    code: string;
    message: string;
    retryable: boolean;
    action: 'none' | 'login' | 'reload' | 'resolve-conflict' | 'query-task';
}
export declare class AppSdkError extends Error {
    readonly code: string;
    readonly retryable: boolean;
    readonly action: AppErrorDetails['action'];
    constructor(details: AppErrorDetails);
}
/** Preserve only safe, known error fields; never serialize a stack or arbitrary error object. */
export declare function appErrorDetails(error: unknown): AppErrorDetails;
