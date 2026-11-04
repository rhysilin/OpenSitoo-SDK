import type { CapabilityBinding, CapabilityDeclaration, CapabilityExecutor } from '@sitoo/capability-broker';
import type { CapabilityReferenceStore, ReferenceScope } from '@sitoo/capability-references';
import { type ModelRequestLedger, type DurableModelUpstream } from './model-ledger.ts';
import type { TaskQuery, DurableTask } from '@sitoo/capability-tasks';
export interface ImageArtifact {
    mimeType: 'image/png';
    dataUrl: string;
}
export type TaskArtifactQuery = (task: Readonly<DurableTask>, scope: Readonly<ReferenceScope>) => Promise<ImageArtifact>;
export declare function createImageService(options: {
    binding: CapabilityBinding;
    store: CapabilityReferenceStore;
    ledger: ModelRequestLedger;
    upstream: DurableModelUpstream;
}): {
    declaration: CapabilityDeclaration;
    execute: CapabilityExecutor;
    query: TaskQuery;
};
export declare function imageCapabilityDeclaration(binding: CapabilityBinding): CapabilityDeclaration;
