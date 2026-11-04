import type { ReferenceScope } from './index.ts';
export declare const referenceUuid: RegExp;
export declare function referenceOwner(scope: ReferenceScope): string;
export type PersistentReferencePayload = {
    kind: 'text';
    text: string;
} | {
    kind: 'model';
    providerId: string;
    providerRevision: number;
};
export type PersistentReference = PersistentReferencePayload & {
    referenceId: string;
    revision: number;
    revoked: boolean;
};
export declare class CapabilityReferenceStore {
    #private;
    constructor(filename: string);
    has(referenceId: string): boolean;
    issue(scope: ReferenceScope, referenceId: string, payload: PersistentReferencePayload): string;
    read(scope: ReferenceScope, referenceId: string): Readonly<PersistentReference> | undefined;
    list(scope: ReferenceScope): readonly Readonly<PersistentReference>[];
    revoke(scope: ReferenceScope, referenceId: string): void;
    close(): void;
}
