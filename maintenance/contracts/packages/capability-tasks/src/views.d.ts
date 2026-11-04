import type { CapabilityCallerPolicy } from '@sitoo/capability-broker';
import type { ProtocolValidation } from '@sitoo/capability-protocol';
import type { DurableTask } from './index.ts';
export type CapabilityTaskViewScope = Pick<CapabilityCallerPolicy, 'tenantId' | 'environment' | 'installationId' | 'consumerAppId'>;
export declare class CapabilityTaskViews {
    #private;
    constructor(options: {
        path: string;
        scope: CapabilityTaskViewScope;
    });
    get(taskId: string): ProtocolValidation<DurableTask>;
    list(options?: {
        limit?: number;
        offset?: number;
    }): ProtocolValidation<DurableTask[]>;
    close(): void;
}
