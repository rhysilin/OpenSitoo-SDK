/** Stateless text inference. Credentials and execution remain in the trusted Desktop. */
export interface AppTextModel {
    id: string;
    name: string;
    group: string;
    price: string;
    /** Effective host budget; absent when not advertised. Not a guarantee of provider support. */
    outputTokenLimit?: number;
    outputLimitSource?: 'platform' | 'model';
}
export interface AppTextRequest {
    model: string;
    prompt: string;
    instructions?: string;
    maxTokens?: number;
    responseSchema?: Record<string, unknown>;
    /** Scoped references resolved by the Desktop text.generate binding. */
    attachments?: import('./attachments.js').AppImageReference[];
}
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
/** Internal trusted provider; browsers receive only the scoped query API. */
export interface AppTextProvider {
    models(): Promise<AppTextModel[]>;
    generate(appId: string, request: AppTextRequest, requestId: string, packageDigest: string): Promise<AppTextTask>;
    getTask(appId: string, id: string): Promise<AppTextTask>;
    listTasks(appId: string): Promise<AppTextTask[]>;
}
