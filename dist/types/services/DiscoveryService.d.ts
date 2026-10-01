/**
 * 🛰️ Discovery Service — the Shell's runtime config, in two requests at boot:
 *
 * 1. `/config.json` — this deployment's own file: where the backend is (`master_api_url`) and local
 *    defaults;
 * 2. `<backend>/discovery.json` — everything else, in ONE request (backend discovery.ts, cached there):
 *    `system` (the system discovery), `environment` (Admin → Environment), `platform` (Admin → Config),
 *    `apps` (the app registry).
 *
 * Config = system, config.json over it, the environment over both (`master_api_url` stays local — it is
 * how the Shell finds the backend). `platform` and `apps` are handed to the kernel (`applyDiscovery`).
 * A backend without discovery.json: the system discovery endpoint, as before.
 */
import type { IDiscoveryService, SystemConfig } from '../contracts';
export type { SystemConfig };
export declare class DiscoveryService implements IDiscoveryService {
    private config;
    private staticConfig;
    private apiBase;
    private platform;
    private apps;
    private initialized;
    initialize(superApp?: {
        state: {
            discovery: Record<string, any>;
        };
    }): Promise<void>;
    /** Fetches `<backend>/discovery.json` again (after an admin change) and merges it. */
    reload(): Promise<boolean>;
    /** Admin → Config, from the last discovery.json (null: not served). */
    getPlatform(): any | null;
    /** The app registry rows, from the last discovery.json (null: not served). */
    getApps(): any[] | null;
    get<T = any>(key: string, defaultValue?: T): T;
    getAll(): SystemConfig;
    get isInitialized(): boolean;
}
export declare const discoveryService: DiscoveryService;
//# sourceMappingURL=DiscoveryService.d.ts.map