export type JsonValue = null | boolean | number | string | JsonValue[] | {
    [key: string]: JsonValue;
};
export declare const PROTOCOL_VERSION: 1;
export declare const TASK_STATUSES: readonly ["queued", "running", "needs-input", "needs-approval", "completed", "failed", "cancelled", "unknown"];
export type CapabilityTaskStatus = (typeof TASK_STATUSES)[number];
export declare const ERROR_MESSAGES: Readonly<{
    readonly UNAUTHENTICATED: "Authentication is required.";
    readonly FORBIDDEN: "The capability is not authorized.";
    readonly INVALID_INPUT: "The request is invalid.";
    readonly INVALID_OUTPUT: "The capability response is invalid.";
    readonly INCOMPATIBLE: "The protocol or capability is incompatible.";
    readonly CONFLICT: "The request conflicts with an existing request.";
    readonly LIMIT_EXCEEDED: "The request exceeds a platform limit.";
    readonly UNAVAILABLE: "The capability is unavailable.";
    readonly RESULT_UNKNOWN: "The result is unknown. Query the original task.";
    readonly CANCELLED: "Execution was cancelled.";
    readonly INTERNAL_ERROR: "The capability could not complete the request.";
}>;
export type CapabilityErrorCode = keyof typeof ERROR_MESSAGES;
export interface CapabilityError {
    code: CapabilityErrorCode;
    message: string;
}
export interface CapabilityRequest {
    protocolVersion: 1;
    requestId: string;
    capabilityId: string;
    input: JsonValue;
}
export interface CapabilityTaskReference {
    taskId: string;
    requestId: string;
    capabilityId: string;
    status: CapabilityTaskStatus;
}
export type CapabilityResponse = {
    protocolVersion: 1;
    requestId: string;
} & ({
    status: 'success';
    value: JsonValue;
} | {
    status: 'accepted';
    task: CapabilityTaskReference;
} | {
    status: 'error';
    error: CapabilityError;
});
export type ProtocolValidation<T> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: CapabilityError;
};
