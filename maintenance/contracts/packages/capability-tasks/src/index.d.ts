import { CapabilityBroker } from '@sitoo/capability-broker';
import type { CapabilityBinding, CapabilityCallerPolicy, CapabilitySession } from '@sitoo/capability-broker';
import type { CapabilityRequest, CapabilityResponse, CapabilityTaskReference, ProtocolValidation } from '@sitoo/capability-protocol';
export { LegacyTaskViews } from './legacy.ts';
export { CapabilityTaskViews } from './views.ts';
export type { CapabilityTaskViewScope } from './views.ts';
export type { LegacyTaskView, LegacyTaskReaders, LegacyScopeMap } from './legacy.ts';
export interface TaskSchedulingLimits {
    maxConcurrent: number;
    maxConcurrentPerTenant: number;
    maxConcurrentPerAccount: number;
    maxConcurrentPerScope: number;
    maxPending: number;
    maxPendingPerTenant: number;
    maxPendingPerAccount: number;
    maxPendingPerScope: number;
    executionMs: number;
}
export declare const DEFAULT_TASK_SCHEDULING_LIMITS: Readonly<TaskSchedulingLimits>;
export interface DurableTask extends CapabilityTaskReference {
    binding: CapabilityBinding;
    revision: number;
    createdAt: string;
    updatedAt: string;
    result?: CapabilityResponse;
    upstreamTask?: CapabilityTaskReference;
}
export interface TaskPackageLeases {
    acquire(task: Readonly<DurableTask>, caller: Readonly<CapabilityCallerPolicy>): ProtocolValidation<null>;
    release(task: Readonly<DurableTask>, scope: string): ProtocolValidation<null>;
}
export type TaskQuery = (task: Readonly<DurableTask>, signal: AbortSignal, context: {
    request: CapabilityRequest;
    caller: CapabilityCallerPolicy;
}) => Promise<unknown>;
export declare class CapabilityTasks {
    #private;
    readonly broker: CapabilityBroker;
    constructor(options: {
        path: string;
        broker: CapabilityBroker;
        query?: TaskQuery;
        maxTasks?: number;
        allowEffects?: boolean;
        packageLeases?: TaskPackageLeases;
        scheduling?: Partial<TaskSchedulingLimits>;
        sharedQuotaPath?: string;
        accountKey?: (caller: Readonly<CapabilityCallerPolicy>) => string;
    });
    get(session: CapabilitySession, id: string): ProtocolValidation<DurableTask>;
    list(session: CapabilitySession, options?: {
        limit?: number;
        offset?: number;
    }): ProtocolValidation<DurableTask[]>;
    submit(session: CapabilitySession, raw: unknown): ProtocolValidation<DurableTask>;
    getConfirmation(session: CapabilitySession, id: string): ProtocolValidation<{
        taskId: string;
        revision: number;
        request: CapabilityRequest;
        binding: CapabilityBinding;
    }>;
    approve(session: CapabilitySession, id: string, revision: number): ProtocolValidation<DurableTask>;
    cancel(session: CapabilitySession, id: string): ProtocolValidation<DurableTask>;
    reconcile(session: CapabilitySession, id: string): Promise<ProtocolValidation<DurableTask>>;
    close(): void;
}
