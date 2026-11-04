import type { CapabilityHostContext } from '@sitoo/capability-protocol/host';
import { CapabilityBroker } from '@sitoo/capability-broker';
import type { CapabilityBinding, CapabilityDeclaration, CapabilityExecutor } from '@sitoo/capability-broker';
import type { JsonValue, CapabilityRequest } from '@sitoo/capability-protocol';
export type ReferenceScope = Pick<CapabilityHostContext, 'tenantId' | 'environment' | 'installationId' | 'consumerAppId'>;
export type ModelInference = (prompt: string, context: Readonly<CapabilityHostContext>, requestId: string, signal?: AbortSignal) => Promise<JsonValue>;
export type ModelQuery = (prompt: string, scope: Readonly<ReferenceScope>, requestId: string, signal?: AbortSignal) => Promise<JsonValue>;
export interface ModelProvider {
    infer: ModelInference;
    query?: ModelQuery;
}
import { CapabilityReferenceStore } from './store.ts';
export { CapabilityReferenceStore } from './store.ts';
export type { PersistentReference, PersistentReferencePayload } from './store.ts';
export declare class CapabilityReferences {
    #private;
    constructor(options?: {
        store?: CapabilityReferenceStore;
    });
    issuePersistentText(scope: ReferenceScope, text: string, referenceId?: string): string;
    issuePersistentModel(scope: ReferenceScope, providerId: string, providerRevision: number, referenceId?: string): string;
    bindPersistentModelProvider(scope: ReferenceScope, referenceId: string, providerId: string, providerRevision: number, provider: ModelProvider): void;
    revokePersistent(scope: ReferenceScope, referenceId: string): void;
    issueText(scope: ReferenceScope, text: string, referenceId?: string): string;
    issueModel(scope: ReferenceScope, infer: ModelInference, referenceId?: string): string;
    issueModelProvider(scope: ReferenceScope, provider: ModelProvider, referenceId?: string): string;
    queryModel(scope: ReferenceScope, request: CapabilityRequest, signal?: AbortSignal): Promise<JsonValue>;
    revoke(referenceId: string): void;
    registerCapabilities(broker: CapabilityBroker, bindings: {
        text: CapabilityBinding;
        model: CapabilityBinding;
    }): void;
    createCapabilities(bindings: {
        text: CapabilityBinding;
        model: CapabilityBinding;
    }): {
        declaration: CapabilityDeclaration;
        execute: CapabilityExecutor;
    }[];
}
