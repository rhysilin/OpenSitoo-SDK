import type { CapabilityErrorCode, ProtocolValidation } from '@sitoo/capability-protocol';
import type { CapabilityExecutor } from '@sitoo/capability-broker';
export interface RuntimeLimits {
    wallMs: number;
    cpuMs: number;
    memoryBytes: number;
    bridgeMs: number;
    maxCalls: number;
    maxPending: number;
    maxConcurrent: number;
}
export interface RuntimeEvent {
    requestId: string;
    capabilityId: string;
    state: 'starting' | 'running' | 'completed' | 'failed' | 'cancelled';
    activeRuns: number;
    code?: CapabilityErrorCode;
}
export declare const DEFAULT_RUNTIME_LIMITS: Readonly<RuntimeLimits>;
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
    }): Promise<ProtocolValidation<null>>;
    createExecutor({ source, sourceSha256, }: {
        source: string;
        sourceSha256: string;
    }): CapabilityExecutor;
}
