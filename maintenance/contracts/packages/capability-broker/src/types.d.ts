import type { CapabilityRequest, CapabilityResponse, JsonValue, ProtocolValidation, CapabilityErrorCode } from '@sitoo/capability-protocol';
import type { CapabilityHostContext } from '@sitoo/capability-protocol/host';
export interface CapabilityBinding {
    capabilityId: string;
    packageId: string;
    version: string;
    sha256: string;
}
export interface CapabilityDeclaration {
    binding: CapabilityBinding;
    interfaceVersion: 1;
    inputSchema: boolean | {
        [key: string]: JsonValue;
    };
    outputSchema: boolean | {
        [key: string]: JsonValue;
    };
    permissions: readonly string[];
    allowedEntries: readonly CapabilityHostContext['entry'][];
    delegates: readonly string[];
    effects: {
        billable: boolean;
        externalWrite: boolean;
    };
}
export interface CapabilityCallerPolicy {
    tenantId: string;
    environment: CapabilityHostContext['environment'];
    installationId: string;
    consumerAppId: string;
    entry: CapabilityHostContext['entry'];
    grants: readonly string[];
    bindings: readonly CapabilityBinding[];
}
declare const sessionBrand: unique symbol;
export interface CapabilitySession {
    readonly [sessionBrand]: true;
}
export type NestedCapabilityInvoke = (request: unknown, options?: CapabilityExecutionOptions) => Promise<ProtocolValidation<CapabilityResponse>>;
export interface CapabilityExecutionOptions {
    signal?: AbortSignal;
    approval?: CapabilityApproval;
}
declare const approvalBrand: unique symbol;
export interface CapabilityApproval {
    readonly [approvalBrand]: true;
}
export type CapabilityExecutor = (request: CapabilityRequest, context: CapabilityHostContext, invoke: NestedCapabilityInvoke, options?: CapabilityExecutionOptions) => unknown | Promise<unknown>;
export interface CapabilityDiagnostic {
    requestId: string;
    rootRequestId: string;
    parentRequestId?: string;
    capabilityId: string;
    tenantId: string;
    environment: CapabilityHostContext['environment'];
    installationId: string;
    consumerAppId: string;
    binding?: CapabilityBinding;
    depth: number;
    outcome: 'success' | 'accepted' | 'error';
    code?: CapabilityErrorCode;
    durationMs: number;
}
export {};
