import { KeyObject } from 'node:crypto';
import type { ProtocolValidation } from '@sitoo/capability-protocol';
import type { VerifiedCapabilityPackage } from './index.ts';
type Environment = 'development' | 'test' | 'production';
export interface PackageSigningMetadata {
    keyId: string;
    environment: Environment;
    issuedAt: number;
    expiresAt: number;
}
export interface PackageAttestation extends PackageSigningMetadata {
    formatVersion: 1;
    packageId: string;
    version: string;
    sha256: string;
    signature: string;
}
export interface TrustedPackageKey {
    keyId: string;
    namespace: string;
    environments: Environment[];
    publicKeyPem: string;
    notBefore: number;
    notAfter: number;
    revoked: boolean;
}
export interface TrustedCapabilityPackage {
    readonly package: VerifiedCapabilityPackage;
    readonly attestation: Readonly<PackageAttestation>;
}
export declare const SIGNATURE_LIMITS: Readonly<{
    keys: 32;
    attestationBytes: 4096;
    maxValidityMs: number;
}>;
export declare function signCapabilityPackage(pkg: VerifiedCapabilityPackage, privateKey: KeyObject, options: PackageSigningMetadata): ProtocolValidation<Readonly<PackageAttestation>>;
export declare class CapabilityPackageTrust {
    #private;
    constructor(raw: readonly TrustedPackageKey[]);
    verify(pkg: VerifiedCapabilityPackage, raw: unknown, now?: number): ProtocolValidation<TrustedCapabilityPackage>;
}
export {};
