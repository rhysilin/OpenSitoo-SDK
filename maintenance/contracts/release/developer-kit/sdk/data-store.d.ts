import type { AppDataPage, AppDataQuery, AppDataRecord, AppDataWrite } from './client-contract.js';
export declare const APP_DATA_LIMITS: {
    readonly recordBytes: 16384;
    readonly appBytes: number;
    readonly records: 1000;
    readonly pageSize: 100;
};
/** Host-only JSON storage. A caller cannot choose paths or account/app identity. */
export declare class AppDataStore {
    private pending;
    private root;
    constructor(root: string);
    private location;
    private id;
    private read;
    get(scope: string, appId: string, id: string): Promise<AppDataRecord | null>;
    list(scope: string, appId: string, query?: AppDataQuery): Promise<AppDataPage>;
    put(scope: string, appId: string, write: AppDataWrite, current: () => void): Promise<AppDataRecord>;
    delete(scope: string, appId: string, id: string, revision: number, current: () => void): Promise<AppDataRecord>;
    private mutate;
}
