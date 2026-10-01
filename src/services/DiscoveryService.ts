/**
 * 🛰️ Discovery Service
 * Handles fetching dynamic configuration from the SuperApp Registry.
 */

import type { IDiscoveryService, SystemConfig } from '../contracts';
import { SUPERAPP_PROTOCOL } from '../contracts';
import { ENVIRONMENT_LOCAL_ONLY, fetchEnvironment } from './environment';

export type { SystemConfig };

/** The backend: config.json's `master_api_url`, else the build's, else :4400 on a local dev host. */
const resolveApiBase = (staticConfig: any): string =>
  staticConfig.master_api_url || (import.meta as any).env?.VITE_MASTER_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:4400' : '');

export class DiscoveryService implements IDiscoveryService {
  private config: SystemConfig = {};
  /** Discovery API + config.json, before the environment goes over it. */
  private local: SystemConfig = {};
  private apiBase = '';
  private initialized = false;

  /** The environment over the local config (`master_api_url` stays local). */
  private merge(environment: Record<string, string>): void {
    const allowed = Object.fromEntries(Object.entries(environment).filter(([key]) => !ENVIRONMENT_LOCAL_ONLY.includes(key)));
    this.config = { ...this.local, ...allowed };
  }

  /**
   * Fetches dynamic configuration from the discovery endpoint AND static config.json.
   */
  async initialize(superApp?: { state: { discovery: Record<string, any> } }) {
    try {
      // 🏗️ 1. Load Static Runtime Config (from public/config.json)
      // This is the source of truth for deployment URLs
      const staticRes = await fetch('/config.json').catch(() => null);
      let staticConfig: any = {};
      if (staticRes && staticRes.ok) {
        const contentType = staticRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          staticConfig = await staticRes.json();
          console.log('🏗️ [Discovery] Static runtime config loaded from /config.json');
        } else {
          console.warn('🏗️ [Discovery] /config.json returned non-JSON content (likely index.html fallback)');
        }
      }

      // 🛰️ 2. The backend: config.json's master_api_url (runtime) over the baked-in env
      const apiBase = resolveApiBase(staticConfig);
      this.apiBase = apiBase;

      // 🌐 3. The platform environment (Admin → Environment) — awaited first: everything after reads it
      const environment = await fetchEnvironment(apiBase);
      if (!apiBase) {
        console.warn('🛰️ [Discovery] No master_api_url found in config.json or environment. API discovery skipped.');
      }
      
      const response = apiBase ? await fetch(`${apiBase}${SUPERAPP_PROTOCOL.ENDPOINTS.DISCOVERY}`).catch(() => null) : null;
      let apiConfig = {};
      if (response && response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            apiConfig = await response.json();
            console.log('🛰️ [Discovery] Dynamic API discovery config loaded.');
          } catch (e) {
            console.warn('🛰️ [Discovery] API returned invalid JSON');
          }
        }
      }

      // 🧠 4. Merge: config.json over the discovery API, the environment over both
      this.local = { ...apiConfig, ...staticConfig };
      this.merge(environment);
      this.initialized = true;
      
      if (superApp) {
        superApp.state.discovery = { ...this.config };
      }
      
      console.log('🛰️ [Discovery] Total variables loaded:', Object.keys(this.config).length);
    } catch (err) {
      console.error('🛰️ [Discovery] Failed to sync configuration', err);
    }
  }

  /** Fetches the environment again (after Admin → Environment saved) and returns the merged config. */
  async reloadEnvironment(): Promise<SystemConfig> {
    this.merge(await fetchEnvironment(this.apiBase));
    return this.getAll();
  }

  get<T = any>(key: string, defaultValue?: T): T {
    return (this.config[key] ?? defaultValue) as T;
  }

  getAll(): SystemConfig {
    return { ...this.config };
  }

  get isInitialized() {
    return this.initialized;
  }
}

export const discoveryService = new DiscoveryService();
