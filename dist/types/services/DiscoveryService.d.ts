/**
 * 🛰️ Discovery Service
 * Handles fetching dynamic configuration from the SuperApp Registry.
 */
import type { IDiscoveryService, SystemConfig } from '../contracts';
export type { SystemConfig };
export declare class DiscoveryService implements IDiscoveryService {
    private config;
    /** Discovery API + config.json, before the environment goes over it. */
    private local;
    private apiBase;
    private initialized;
    /** The environment over the local config (`master_api_url` stays local). */
    private merge;
    /**
     * Fetches dynamic configuration from the discovery endpoint AND static config.json.
     */
    initialize(superApp?: {
        state: {
            discovery: Record<string, any>;
        };
    }): Promise<void>;
    /** Fetches the environment again (after Admin → Environment saved) and returns the merged config. */
    reloadEnvironment(): Promise<SystemConfig>;
    get<T = any>(key: string, defaultValue?: T): T;
    getAll(): SystemConfig;
    get isInitialized(): boolean;
}
export declare const discoveryService: DiscoveryService;
//# sourceMappingURL=DiscoveryService.d.ts.map