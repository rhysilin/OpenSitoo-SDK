import type { CapabilityBinding } from '@sitoo/capability-broker';
import type { JsonValue } from '@sitoo/capability-protocol';
import type { CapabilityReferenceStore, ReferenceScope, ModelProvider } from '@sitoo/capability-references';
export interface ModelRequestIdentity {
    scope: ReferenceScope;
    entry: 'application' | 'conversation' | 'service';
    binding: CapabilityBinding;
    referenceId: string;
    providerId: string;
    providerRevision: number;
    requestId: string;
    prompt: string;
}
export interface ModelRequestRecord extends ModelRequestIdentity {
    inputSha256: string;
    upstreamRequestId: string;
    status: 'dispatched' | 'completed';
    result?: JsonValue;
}
export interface DurableModelUpstream {
    infer(record: Readonly<ModelRequestRecord>, signal?: AbortSignal): Promise<JsonValue>;
    query(record: Readonly<ModelRequestRecord>, signal?: AbortSignal): Promise<JsonValue>;
}
export declare class ModelRequestLedger {
    #private;
    constructor(filename: string);
    read(scope: ReferenceScope, requestId: string): Readonly<ModelRequestRecord> | undefined;
    reserve(identity: ModelRequestIdentity): {
        created: boolean;
        record: Readonly<ModelRequestRecord>;
    };
    complete(identity: ModelRequestIdentity, result: JsonValue): JsonValue;
    close(): void;
}
export declare function createDurableModelProvider(options: {
    ledger: ModelRequestLedger;
    references: CapabilityReferenceStore;
    scope: ReferenceScope;
    referenceId: string;
    binding: CapabilityBinding;
    upstream: DurableModelUpstream;
}): ModelProvider;
