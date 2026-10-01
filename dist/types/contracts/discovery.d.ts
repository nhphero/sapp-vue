/**
 * 🛰️ Discovery Contracts
 * Runtime configuration: the `/system/v1/discovery` endpoint, `/config.json` (static) over it, and the
 * platform environment (`<backend>/environment.json`, Admin → Environment) over both.
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
    /** Fetches the platform environment again and returns the merged config. */
    reloadEnvironment?(): Promise<SystemConfig>;
}
//# sourceMappingURL=discovery.d.ts.map