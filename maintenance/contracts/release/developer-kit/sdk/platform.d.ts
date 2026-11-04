import type { AppInvocationContract, AppCommandReply, AppManifest } from './index.js';
import type { AppResourceSnapshot } from './resource-packs.js';
export declare const APP_SDK_VERSION = "0.0.11";
export declare function validateAppSchema(schema: Readonly<Record<string, unknown>>): void;
export type AppTaskStatus = 'draft' | 'queued' | 'running' | 'needs-input' | 'needs-approval' | 'completed' | 'failed' | 'cancelled';
export interface AppTask {
    id: string;
    appId: string;
    appVersion: string;
    contractVersion: number;
    title: string;
    revision: number;
    status: AppTaskStatus;
    phase?: string;
    progress?: {
        current: number;
        total?: number;
        message?: string;
    };
    updatedAt: string;
    artifacts: AppOutput[];
    error?: {
        code: string;
        message: string;
    };
    resourceSnapshots?: AppResourceSnapshot[];
}
export interface AppOutput {
    id: string;
    kind: string;
    name?: string;
    mediaType?: string;
    resource: {
        type: 'local-file' | 'local-directory' | 'url';
        value: string;
    };
    bytes?: number;
    sha256?: string;
}
export interface AppConfigurationContract {
    version: number;
    schema: Record<string, unknown>;
    defaults: Record<string, unknown>;
    fields?: Record<string, {
        placeholder?: string;
        options?: Record<string, string>;
    }>;
    /** Credentials are host-managed references, never literal secrets in app configuration. */
    credentialSlots?: readonly {
        id: string;
        label: string;
        required: boolean;
    }[];
}
export interface RegisteredApp {
    manifest: AppManifest;
    invocation: AppInvocationContract;
    configuration?: AppConfigurationContract;
}
export declare class AppContractError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
export declare class AppCatalog {
    private readonly apps;
    constructor(apps: readonly RegisteredApp[]);
    list(): RegisteredApp[];
    add(app: RegisteredApp): void;
    remove(id: string): void;
    get(id: string): RegisteredApp;
}
export declare function validateAppValue(schema: Readonly<Record<string, unknown>>, value: unknown): Record<string, unknown>;
/** Shared lexical parser; schemas and aliases belong to registered applications. */
export declare function parseAppCommand(contract: AppInvocationContract, input: string): {
    kind: "help";
    ability?: undefined;
    parameters?: undefined;
} | {
    kind: "natural";
    ability?: undefined;
    parameters?: undefined;
} | {
    kind: "help";
    ability: import("./index.js").AppCapabilityContract;
    parameters?: undefined;
} | {
    kind: "command";
    ability: import("./index.js").AppCapabilityContract;
    parameters: Record<string, string>;
};
export declare function formatAppCommand(contract: AppInvocationContract, abilityId: string, parameters: unknown): string;
export declare function appHelp(contract: AppInvocationContract, abilityId?: string): AppCommandReply;
