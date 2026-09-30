/**
 * 🛰️ Discovery Service
 * Handles fetching dynamic configuration from the SuperApp Registry.
 */
import type { IDiscoveryService, SystemConfig } from '../contracts';
export type { SystemConfig };
export declare class DiscoveryService implements IDiscoveryService {
    private config;
    private initialized;
    /**
     * Fetches dynamic configuration from the discovery endpoint AND static config.json.
     */
    initialize(superApp?: {
        state: {
            discovery: Record<string, any>;
        };
    }): Promise<void>;
    get<T = any>(key: string, defaultValue?: T): T;
    getAll(): SystemConfig;
    get isInitialized(): boolean;
}
export declare const discoveryService: DiscoveryService;
//# sourceMappingURL=DiscoveryService.d.ts.map