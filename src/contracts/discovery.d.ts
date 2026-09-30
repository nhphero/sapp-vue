/**
 * 🛰️ Discovery Contracts
 * Runtime configuration merged from `/config.json` (static) and the
 * `/system/v1/discovery` endpoint (dynamic).
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
}
//# sourceMappingURL=discovery.d.ts.map