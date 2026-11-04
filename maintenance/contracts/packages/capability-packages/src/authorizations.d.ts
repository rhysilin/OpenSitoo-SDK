import type { CapabilityCallerPolicy } from '@sitoo/capability-broker';
import type { ProtocolValidation } from '@sitoo/capability-protocol';
import type { CapabilityInstallationRoot } from './installations.ts';
export type CapabilityAuthorizationPolicy = Pick<CapabilityCallerPolicy, 'entry' | 'grants' | 'bindings'>;
export interface CapabilityAuthorization {
    revision: number;
    status: 'active' | 'revoked';
    policy: CapabilityAuthorizationPolicy;
}
export interface CapabilityAuthorizationReceipt {
    requestId: string;
    expectedRevision: number;
    authorization: CapabilityAuthorization;
}
export declare const AUTHORIZATION_LIMITS: Readonly<{
    scopes: 384;
    records: 1024;
    revision: 2147483647;
}>;
export declare class CapabilityAuthorizationStore {
    #private;
    constructor(path: string, root: CapabilityInstallationRoot, entry: CapabilityCallerPolicy['entry'], options?: {
        readOnly?: boolean;
    });
    read(): ProtocolValidation<CapabilityAuthorization | null>;
    status(requestId: string): ProtocolValidation<CapabilityAuthorizationReceipt | null>;
    set(requestId: string, expectedRevision: number, raw: CapabilityAuthorizationPolicy, status?: CapabilityAuthorization['status']): ProtocolValidation<CapabilityAuthorizationReceipt>;
    close(): void;
}
