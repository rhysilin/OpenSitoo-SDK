import type { ProtocolValidation, JsonValue } from '@sitoo/capability-protocol';
import type { CapabilityInstallationRoot } from './installations.ts';
export interface CapabilityDataSnapshot {
    dataVersion: number;
    revision: number;
    value: JsonValue;
}
export interface CapabilityDataMigration {
    requestId: string;
    status: 'prepared' | 'committed' | 'aborted' | 'rolledBack';
    before: CapabilityDataSnapshot;
    after: CapabilityDataSnapshot;
}
export declare const DATA_MIGRATION_LIMITS: Readonly<{
    roots: 128;
    records: 512;
    version: 2147483647;
    revision: 2147483647;
}>;
export declare class CapabilityDataMigrationStore {
    #private;
    constructor(path: string, root: CapabilityInstallationRoot);
    initialize(dataVersion: number, value: unknown): ProtocolValidation<CapabilityDataSnapshot>;
    read(): ProtocolValidation<CapabilityDataSnapshot>;
    write(expectedRevision: number, expectedDataVersion: number, value: unknown): ProtocolValidation<CapabilityDataSnapshot>;
    prepare(requestId: string, expectedRevision: number, targetVersion: number, value: unknown): ProtocolValidation<CapabilityDataMigration>;
    status(requestId: string): ProtocolValidation<CapabilityDataMigration>;
    pending(): ProtocolValidation<readonly CapabilityDataMigration[]>;
    commit(requestId: string): ProtocolValidation<CapabilityDataMigration>;
    abort(requestId: string): ProtocolValidation<CapabilityDataMigration>;
    rollback(requestId: string): ProtocolValidation<CapabilityDataMigration>;
    close(): void;
}
