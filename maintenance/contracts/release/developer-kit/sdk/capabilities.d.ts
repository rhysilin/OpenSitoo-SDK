import type { CapabilityRequest, CapabilityResponse, CapabilityTaskReference, ProtocolValidation } from './capability-protocol.js';
export type { CapabilityRequest, CapabilityResponse, ProtocolValidation, } from './capability-protocol.js';
/** The original host task view, never a second SDK task store. */
export interface AppCapabilityTask extends CapabilityTaskReference {
    binding: {
        capabilityId: string;
        packageId: string;
        version: string;
        sha256: string;
    };
    revision: number;
    createdAt: string;
    updatedAt: string;
    result?: CapabilityResponse;
    upstreamTask?: CapabilityTaskReference;
}
/** Supplied by the host's scoped bridge. No URL, bearer or caller identity fields. */
export interface AppCapabilityTransport {
    submit(request: CapabilityRequest): Promise<ProtocolValidation<AppCapabilityTask>>;
    get(taskId: string): Promise<ProtocolValidation<AppCapabilityTask>>;
    cancel(taskId: string): Promise<ProtocolValidation<AppCapabilityTask>>;
    list(): Promise<ProtocolValidation<AppCapabilityTask[]>>;
    artifact?(taskId: string): Promise<ProtocolValidation<AppCapabilityArtifact>>;
}
export interface AppCapabilityArtifact {
    mimeType: 'image/png';
    dataUrl: string;
}
/** Browser-only bounded adapter. Never retries, approves, reconciles or creates IDs. */
export declare function createCapabilityClient(transport: AppCapabilityTransport): Readonly<{
    submit(request: CapabilityRequest): Promise<ProtocolValidation<AppCapabilityTask>>;
    get: (taskId: string) => Promise<ProtocolValidation<AppCapabilityTask>>;
    cancel: (taskId: string) => Promise<ProtocolValidation<AppCapabilityTask>>;
    list: () => Promise<ProtocolValidation<AppCapabilityTask[]>>;
    artifact: (taskId: string) => Promise<ProtocolValidation<AppCapabilityArtifact>>;
    dispose(): void;
}>;
