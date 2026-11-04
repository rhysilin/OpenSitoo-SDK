import { AppCatalog, type AppTask } from './platform.js';
import type { AppCommandReply } from './index.js';
import type { AppImages, AppImageProvider } from './images.js';
export { AppDataStore, APP_DATA_LIMITS } from './data-store.js';
export interface ApplicationProvider {
    invoke(input: string): Promise<AppCommandReply | undefined>;
    listTasks(): Promise<AppTask[]>;
    getTask(id: string): Promise<AppTask>;
    executeApproved?(target: AppApprovalTarget): Promise<AppCommandReply>;
}
export interface AppConfigState {
    appId: string;
    version: number;
    revision: number;
    values: Record<string, unknown>;
    credentials: Record<string, boolean>;
}
export interface AppApprovalTarget {
    appId: string;
    capabilityId: string;
    taskId: string;
    revision: number;
    payload: Record<string, unknown>;
}
/** Host-owned approval ticket. Never register issue/consume as model tools. */
export declare class AppApprovalLedger {
    private grants;
    private fingerprint;
    issue(scope: string, target: AppApprovalTarget): string;
    consume(scope: string, token: string, target: AppApprovalTarget): void;
    revoke(): void;
}
/** Trusted bundled providers only; this host does not claim process isolation. */
export declare class ApplicationHost {
    private providers;
    private writes;
    readonly approvals: AppApprovalLedger;
    readonly catalog: AppCatalog;
    private imageProvider?;
    private root;
    private getScope;
    private crypto?;
    constructor(catalog: AppCatalog, root: string, getScope: () => string | undefined, crypto?: {
        encrypt(value: string): string;
        decrypt(value: string): string;
    });
    register(appId: string, provider: ApplicationProvider): void;
    registerImages(provider: AppImageProvider): void;
    unregister(appId: string): void;
    /** Only trusted registered applications declaring this permission get a client. */
    images(appId: string): AppImages;
    private owner;
    private provider;
    invoke(appId: string, input: string): Promise<AppCommandReply | undefined>;
    approve(target: AppApprovalTarget): Promise<string>;
    executeApproved(target: AppApprovalTarget, ticket: string): Promise<AppCommandReply>;
    listTasks(appId: string): Promise<AppTask[]>;
    getTask(appId: string, id: string): Promise<AppTask>;
    private filename;
    private load;
    configuration(appId: string): Promise<AppConfigState>;
    private publicConfiguration;
    saveConfiguration(appId: string, revision: number, values: unknown, credentials?: Record<string, string>): Promise<AppConfigState>;
    credential(appId: string, slot: string): Promise<string | undefined>;
}
