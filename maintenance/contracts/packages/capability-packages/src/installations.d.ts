import type { ProtocolValidation } from '@sitoo/capability-protocol';
import type { CapabilityDependencyPlan } from './index.ts';
import { CapabilityReleaseStore } from './releases.ts';
import { CapabilityPackageTrust } from './signatures.ts';
import type { TrustedCapabilityPackage } from './signatures.ts';
import type { CapabilityBinding, CapabilityCallerPolicy } from '@sitoo/capability-broker';
export type CapabilityUpdatePolicy = Pick<CapabilityCallerPolicy, 'entry' | 'grants'>;
export interface CapabilityUpdateReview {
    requestId: string;
    generation: number;
    plan: CapabilityDependencyPlan;
    policy: CapabilityUpdatePolicy;
    required: readonly string[];
    added: readonly string[];
    removed: readonly string[];
    missing: readonly string[];
    unsupportedEntries: readonly string[];
    reviewSha256: string;
}
export interface CapabilityInstallationRoot {
    tenantId: string;
    accountId: string;
    applicationId: string;
    environment: 'development' | 'test' | 'production';
}
export interface CapabilityReleaseReference {
    packageId: string;
    version: string;
    sha256: string;
    environment: CapabilityInstallationRoot['environment'];
}
export interface CapabilityInstallationTransaction {
    requestId: string;
    status: 'prepared' | 'committed' | 'aborted';
    plan: CapabilityDependencyPlan;
}
export declare const INSTALLATION_LIMITS: Readonly<{
    roots: 128;
    packages: 128;
    transactions: 512;
}>;
export interface CapabilityPackageLease {
    taskId: string;
    requestId: string;
    status: 'active' | 'released';
    plan: CapabilityDependencyPlan;
}
export declare const LEASE_LIMITS: Readonly<{
    records: 1024;
}>;
export declare function rootKey(raw: CapabilityInstallationRoot): string;
export declare class CapabilityInstallationStore {
    #private;
    constructor(path: string, root: CapabilityInstallationRoot, options?: {
        readOnly?: boolean;
    });
    prepare(requestId: string, roots: unknown, references: unknown, releases: CapabilityReleaseStore, trust: CapabilityPackageTrust, now?: number): ProtocolValidation<CapabilityInstallationTransaction>;
    prepareUpdate(requestId: string, roots: unknown, references: unknown, releases: CapabilityReleaseStore, trust: CapabilityPackageTrust, now?: number): ProtocolValidation<CapabilityInstallationTransaction>;
    prepareUninstall(requestId: string): ProtocolValidation<CapabilityInstallationTransaction>;
    commitUninstall(requestId: string): ProtocolValidation<CapabilityInstallationTransaction>;
    commit(requestId: string, releases: CapabilityReleaseStore, trust: CapabilityPackageTrust, now?: number): ProtocolValidation<CapabilityInstallationTransaction>;
    reviewUpdate(requestId: string, policy: CapabilityUpdatePolicy, releases: CapabilityReleaseStore, trust: CapabilityPackageTrust, now?: number): ProtocolValidation<CapabilityUpdateReview>;
    commitAuthorizedUpdate(requestId: string, policy: CapabilityUpdatePolicy, reviewSha256: string, releases: CapabilityReleaseStore, trust: CapabilityPackageTrust, now?: number): ProtocolValidation<CapabilityInstallationTransaction>;
    status(requestId: string): ProtocolValidation<CapabilityInstallationTransaction>;
    abort(requestId: string): ProtocolValidation<CapabilityInstallationTransaction>;
    pending(): ProtocolValidation<readonly CapabilityInstallationTransaction[]>;
    load(trust: CapabilityPackageTrust, now?: number): ProtocolValidation<{
        plan: CapabilityDependencyPlan;
        packages: readonly TrustedCapabilityPackage[];
    }>;
    acquireLease(taskId: string, requestId: string, bindings: readonly CapabilityBinding[], trust: CapabilityPackageTrust, now?: number): ProtocolValidation<CapabilityPackageLease>;
    getLease(taskId: string): ProtocolValidation<CapabilityPackageLease>;
    activeLeases(): ProtocolValidation<readonly CapabilityPackageLease[]>;
    releaseLease(taskId: string): ProtocolValidation<CapabilityPackageLease>;
    loadLease(taskId: string, trust: CapabilityPackageTrust, now?: number): ProtocolValidation<{
        plan: CapabilityDependencyPlan;
        packages: readonly TrustedCapabilityPackage[];
    }>;
    leaseInventory(): ProtocolValidation<{
        records: number;
        active: number;
        references: number;
    }>;
    collectUnused(): ProtocolValidation<{
        removed: number;
        retained: number;
    }>;
    inventory(): ProtocolValidation<{
        packages: number;
        roots: number;
        references: number;
        transactions: number;
    }>;
    close(): void;
}
