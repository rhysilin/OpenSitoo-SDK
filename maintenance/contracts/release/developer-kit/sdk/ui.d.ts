export { AppSdkError, appErrorDetails } from './client-contract.js';
/** A narrow browser client. App identity is assigned by the host, not by the UI. */
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
        /** Polls one durable task; never generates or resubmits an image. */
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
