import type { AppTextProvider, AppImageProvider } from '@sitoo/sdk';
import type { CapabilitySession } from '@sitoo/capability-broker';
import { CapabilityBroker } from '@sitoo/capability-broker';
import type { CapabilityTaskStatus, JsonValue, ProtocolValidation } from '@sitoo/capability-protocol';
export interface LegacyTaskView {
    source: 'legacy-text' | 'legacy-image';
    taskId: string;
    status: CapabilityTaskStatus;
    createdAt: string;
    updatedAt: string;
    gatewayTaskId?: string;
    text?: string;
    value?: Record<string, unknown>;
    artifacts?: JsonValue;
}
export interface LegacyTaskReaders {
    text?: Pick<AppTextProvider, 'getTask' | 'listTasks'>;
    image?: Pick<AppImageProvider, 'getTask' | 'listTasks'>;
}
export type LegacyScopeMap = (scope: {
    tenantId: string;
    environment: string;
    installationId: string;
    consumerAppId: string;
}) => {
    textAppId?: string;
    imageCaller?: string;
} | undefined;
export declare class LegacyTaskViews {
    #private;
    constructor(options: {
        broker: CapabilityBroker;
        readers: LegacyTaskReaders;
        map: LegacyScopeMap;
    });
    list(session: CapabilitySession, source: LegacyTaskView['source']): Promise<ProtocolValidation<LegacyTaskView[]>>;
    get(session: CapabilitySession, source: LegacyTaskView['source'], id: string): Promise<ProtocolValidation<LegacyTaskView>>;
}
