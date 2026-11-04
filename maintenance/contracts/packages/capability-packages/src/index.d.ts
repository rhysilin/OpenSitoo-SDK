import type { CapabilityBinding, CapabilityDeclaration } from '@sitoo/capability-broker';
import type { ProtocolValidation } from '@sitoo/capability-protocol';
export { CapabilityDataMigrationStore, DATA_MIGRATION_LIMITS } from './migrations.ts';
export { CapabilityAuthorizationStore, AUTHORIZATION_LIMITS } from './authorizations.ts';
export type { CapabilityAuthorizationPolicy, CapabilityAuthorization, CapabilityAuthorizationReceipt, } from './authorizations.ts';
export type { CapabilityDataSnapshot, CapabilityDataMigration } from './migrations.ts';
export { CapabilityPackageTrust, signCapabilityPackage, SIGNATURE_LIMITS } from './signatures.ts';
export type { PackageSigningMetadata, PackageAttestation, TrustedPackageKey, TrustedCapabilityPackage, } from './signatures.ts';
export { CapabilityReleaseStore } from './releases.ts';
export { CapabilityInstallationStore, INSTALLATION_LIMITS, LEASE_LIMITS } from './installations.ts';
export type { CapabilityInstallationRoot, CapabilityReleaseReference, CapabilityInstallationTransaction, CapabilityPackageLease, CapabilityUpdatePolicy, CapabilityUpdateReview, } from './installations.ts';
export interface PackageRequirement {
    packageId: string;
    range: string;
}
export interface PackageCapability extends Omit<CapabilityDeclaration, 'binding'> {
    capabilityId: string;
    source: string;
}
export interface CapabilityPackageManifest {
    formatVersion: 1;
    execution: 'quickjs-function-v1';
    packageId: string;
    version: string;
    dependencies: PackageRequirement[];
    capabilities: PackageCapability[];
    files: {
        path: string;
        bytes: number;
        sha256: string;
    }[];
}
export interface StaticApplicationPackageManifest extends Omit<CapabilityPackageManifest, 'execution' | 'capabilities'> {
    execution: 'static-application-v1';
    capabilities: [];
    application: {
        applicationId: string;
        entry: string;
    };
}
export type InstallablePackageManifest = CapabilityPackageManifest | StaticApplicationPackageManifest | HostServicePackageManifest;
export interface HostServicePackageManifest extends Omit<CapabilityPackageManifest, 'execution' | 'capabilities' | 'files'> {
    execution: 'host-service-v1';
    capabilities: Omit<PackageCapability, 'source'>[];
    files: [];
}
export interface VerifiedCapabilityPackage {
    readonly manifest: InstallablePackageManifest;
    readonly sha256: string;
    readonly sources: Readonly<Record<string, string>>;
    readonly bindings: readonly CapabilityBinding[];
}
export interface CapabilityDependencyPlan {
    formatVersion: 1;
    roots: readonly PackageRequirement[];
    packages: readonly {
        packageId: string;
        version: string;
        sha256: string;
    }[];
    bindings: readonly CapabilityBinding[];
}
export declare const PACKAGE_LIMITS: Readonly<{
    manifestBytes: 65536;
    files: 16;
    sourceBytes: 65536;
    packageBytes: 1048576;
    dependencies: 32;
    capabilities: 16;
    catalog: 128;
    searchStates: 2048;
}>;
export declare function verifyCapabilityPackage(manifestJson: string, files: ReadonlyMap<string, Uint8Array>): ProtocolValidation<VerifiedCapabilityPackage>;
export declare function readCapabilityPackage(directory: string): Promise<ProtocolValidation<VerifiedCapabilityPackage>>;
export declare function resolveCapabilityDependencies(roots: unknown, catalog: readonly VerifiedCapabilityPackage[]): ProtocolValidation<CapabilityDependencyPlan>;
