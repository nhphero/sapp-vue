/**
 * 🛰️ Discovery Contracts
 * Runtime configuration: `/config.json` (this deployment) and `<backend>/discovery.json` (the system
 * discovery, the environment, Admin → Config, the app registry — one request).
 */
export interface SystemConfig {
    /** Base URL of the master backend (overrides VITE_MASTER_API_URL). */
    master_api_url?: string;
    /** Remote entry base URL of the admin MFE. */
    'admin.url'?: string;
    /** Remote entry base URL of the workspace MFE. */
    'workspace.url'?: string;
    /** Workspaces pre-loaded for the app state. */
    'system.workspaces'?: any[];
    [key: string]: any;
}
export interface IDiscoveryService {
    initialize(superApp?: {
        state: {
            discovery: Record<string, any>;
        };
    }): Promise<void>;
    get<T = any>(key: string, defaultValue?: T): T;
    getAll(): SystemConfig;
    /** Fetches `<backend>/discovery.json` again; false when the backend does not serve it. */
    reload?(): Promise<boolean>;
    /** The public environment from the last discovery.json (`master_api_url` left out). */
    getEnvironment?(): Record<string, string>;
    /** Admin → Config from the last discovery.json (null: not served). */
    getPlatform?(): any | null;
    /** The app registry rows from the last discovery.json (null: not served). */
    getApps?(): any[] | null;
}
//# sourceMappingURL=discovery.d.ts.map