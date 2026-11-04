import type { CapabilityBinding, CapabilityDeclaration, CapabilityExecutor } from '@sitoo/capability-broker';
import type { CapabilityReferenceStore } from '@sitoo/capability-references';
import type { TaskQuery } from '@sitoo/capability-tasks';
import { type ModelRequestLedger, type DurableModelUpstream } from './model-ledger.ts';
export declare function requestCapabilityDeclaration(binding: CapabilityBinding): CapabilityDeclaration;
export declare function createRequestService(options: {
    binding: CapabilityBinding;
    store: CapabilityReferenceStore;
    ledger: ModelRequestLedger;
    upstream: DurableModelUpstream;
}): {
    declaration: CapabilityDeclaration;
    execute: CapabilityExecutor;
    query: TaskQuery;
};
