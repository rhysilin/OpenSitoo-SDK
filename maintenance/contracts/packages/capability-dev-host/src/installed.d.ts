import type { CapabilityInstallationRoot } from '@sitoo/capability-packages';
import { CapabilityBroker } from '@sitoo/capability-broker';
import type { CapabilityCallerPolicy, CapabilityDeclaration, CapabilityExecutor } from '@sitoo/capability-broker';
import { CapabilityRuntime } from '@sitoo/capability-runtime';
import type { TaskPackageLeases } from '@sitoo/capability-tasks';
export interface InstalledDevelopmentHostConfig {
    version: 2;
    installationPath: string;
    trustPath: string;
    consumers: {
        token: string;
        root: CapabilityInstallationRoot;
        entry: CapabilityCallerPolicy['entry'];
        grants: readonly string[];
    }[];
}
export interface AuthorizedDevelopmentHostConfig {
    version: 3;
    installationPath: string;
    trustPath: string;
    authorizationPath: string;
    consumers: Omit<InstalledDevelopmentHostConfig['consumers'][number], 'grants'>[];
}
export interface InstalledHostService {
    declaration: CapabilityDeclaration;
    execute: CapabilityExecutor;
}
export declare function prepareInstalledHost(rootDirectory: string, raw: InstalledDevelopmentHostConfig | AuthorizedDevelopmentHostConfig, broker: CapabilityBroker, runtime: CapabilityRuntime, services?: readonly InstalledHostService[]): Promise<{
    consumers: any[];
    leases: TaskPackageLeases;
    authorized: (token: string) => boolean;
    application: (token: string) => {
        ok: false;
        error: import("@sitoo/capability-protocol").CapabilityError;
    } | {
        ok: true;
        value: {
            applicationId: string;
            packageId: string;
            version: string;
            sha256: string;
            entry: string;
            files: {
                path: string;
                bytes: number;
                sha256: string;
                source: string;
            }[];
        };
    };
    conversation: (token: string) => {
        ok: false;
        error: import("@sitoo/capability-protocol").CapabilityError;
    } | {
        ok: true;
        value: {
            planSha256: string;
            tools: CapabilityDeclaration[];
        };
    };
    accountKey: (caller: CapabilityCallerPolicy) => string;
    validateCaller: (caller: CapabilityCallerPolicy) => boolean;
    close: () => void;
}>;
