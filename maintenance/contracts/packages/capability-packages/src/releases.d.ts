import type { ProtocolValidation } from '@sitoo/capability-protocol';
import type { VerifiedCapabilityPackage } from './index.ts';
import { CapabilityPackageTrust } from './signatures.ts';
import type { PackageAttestation, TrustedCapabilityPackage } from './signatures.ts';
type Environment = 'development' | 'test' | 'production';
export declare class CapabilityReleaseStore {
    #private;
    constructor(path: string, options?: {
        readOnly?: boolean;
    });
    publish(pkg: VerifiedCapabilityPackage, attestation: PackageAttestation, trust: CapabilityPackageTrust, now?: number): ProtocolValidation<{
        packageId: string;
        version: string;
        sha256: string;
        environment: Environment;
    }>;
    get(reference: {
        packageId: string;
        version: string;
        sha256: string;
        environment: Environment;
    }, trust: CapabilityPackageTrust, now?: number): ProtocolValidation<TrustedCapabilityPackage>;
    close(): void;
}
export {};
