import type { CapabilityCallerPolicy, CapabilityDeclaration } from '@sitoo/capability-broker';
import type { TaskQuery } from '@sitoo/capability-tasks';
import type { TaskArtifactQuery } from './image-services.ts';
import type { InstalledHostService } from './installed.ts';
import type { ConversationPlanner } from './conversation.ts';
export { localConversationFixture } from './conversation.ts';
export type { ConversationPlanner } from './conversation.ts';
export { createLoopbackConversationPlanner } from './model-planner.ts';
export type { LoopbackConversationModelConfig } from './model-planner.ts';
export { checkInstalledCapabilities, HEALTH_CHECK_LIMITS } from './health.ts';
export type { CapabilityHealthCase, CapabilityHealthCheck, CapabilityHealthReport, } from './health.ts';
export type { InstalledDevelopmentHostConfig, AuthorizedDevelopmentHostConfig, } from './installed.ts';
export interface DevelopmentHostConfig {
    version: 1;
    capabilities: {
        declaration: CapabilityDeclaration;
        source: string;
        sourceSha256: string;
    }[];
    consumers: {
        token: string;
        policy: CapabilityCallerPolicy;
        references?: {
            textId: string;
            modelId: string;
            text: string;
        };
    }[];
    fixtureConfirmationToken?: string;
}
export declare function startDevelopmentHost(options: {
    configPath: string;
    dataDirectory: string;
    sharedQuotaPath?: string;
    conversationPlanner?: ConversationPlanner;
    conversationPlanningTimeoutMs?: number;
    installedServices?: readonly InstalledHostService[];
    taskQuery?: TaskQuery;
    taskArtifact?: TaskArtifactQuery;
    confirmationToken?: string;
}): Promise<{
    url: string;
    close(): Promise<void>;
}>;
