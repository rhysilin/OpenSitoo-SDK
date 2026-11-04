/** Platform-owned image capability. Applications never choose credentials or models. */
export interface SitooImageRequest {
    prompt: string;
    aspectRatio?: string;
    resolution?: '1K' | '2K' | '4K';
    references?: string[];
}
export interface SitooImageConfiguration {
    revision: number;
    enabled: boolean;
    group: string;
    model: string;
    aspectRatio: string;
    resolution: '1K' | '2K' | '4K';
    /** Legacy storage field. Runtime approval mode is always enforced. */
    confirmBeforeGenerate: boolean;
}
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
export interface SitooImageCapabilities {
    enabled: boolean;
    configured: boolean;
    model: string;
    resolutions: ('1K' | '2K' | '4K')[];
    aspectRatios: readonly string[];
    maxReferences: number;
    cancellation: false;
}
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
/** Implemented by the trusted host; bound clients cannot change caller identity. */
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
