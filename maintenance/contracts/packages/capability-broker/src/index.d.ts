import type { CapabilityErrorCode, CapabilityRequest, CapabilityResponse, ProtocolValidation } from '@sitoo/capability-protocol';
import type { CapabilityBinding, CapabilityCallerPolicy, CapabilityDeclaration, CapabilityDiagnostic, CapabilityExecutor, CapabilitySession, CapabilityExecutionOptions, CapabilityApproval } from './types.ts';
export * from './types.ts';
export declare class CapabilityRegistrationError extends Error {
    readonly code: CapabilityErrorCode;
    constructor(code: CapabilityErrorCode);
}
export declare class CapabilityBroker {
    #private;
    constructor(options?: {
        onDiagnostic?: (value: CapabilityDiagnostic) => void | Promise<void>;
    });
    register(raw: CapabilityDeclaration, executor: CapabilityExecutor): void;
    createSession(raw: CapabilityCallerPolicy): CapabilitySession;
    revokeSession(session: CapabilitySession): void;
    getCaller(session: CapabilitySession): ProtocolValidation<CapabilityCallerPolicy>;
    prepare(session: CapabilitySession, raw: unknown, options?: {
        inspectEffects?: boolean;
    }): ProtocolValidation<{
        request: CapabilityRequest;
        binding: CapabilityBinding;
        effects: CapabilityDeclaration['effects'];
    }>;
    issueApproval(session: CapabilitySession, raw: unknown, ttlMs?: number): ProtocolValidation<{
        approval: CapabilityApproval;
        expiresAt: number;
    }>;
    validateResult(session: CapabilitySession, raw: unknown, output: unknown): ProtocolValidation<CapabilityResponse>;
    invoke(session: CapabilitySession, request: unknown, options?: CapabilityExecutionOptions): Promise<ProtocolValidation<CapabilityResponse>>;
}
