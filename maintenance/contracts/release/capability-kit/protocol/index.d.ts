import type { CapabilityError, CapabilityErrorCode, CapabilityRequest, CapabilityResponse, CapabilityTaskReference, ProtocolValidation } from './types.js';
export * from './types.js';
export { requestSchema, responseSchema, taskReferenceSchema } from './schemas.js';
export declare const PROTOCOL_LIMITS: Readonly<{
    requestBytes: number;
    responseBytes: number;
    maxDepth: 32;
    maxNodes: 8192;
}>;
export declare function createCapabilityError(code: CapabilityErrorCode): CapabilityError;
export declare function parseCapabilityRequest(value: unknown): ProtocolValidation<CapabilityRequest>;
export declare function parseCapabilityTaskReference(value: unknown): ProtocolValidation<CapabilityTaskReference>;
/** Passing expectedRequest additionally checks correlation, not authorization or deduplication. */
export declare function parseCapabilityResponse(value: unknown, expectedRequest?: CapabilityRequest): ProtocolValidation<CapabilityResponse>;
