/**
 * 🛰️ Discovery Service
 * Handles fetching dynamic configuration from the SuperApp Registry.
 */

import type { IDiscoveryService, SystemConfig } from '../contracts';
import { SUPERAPP_PROTOCOL } from '../contracts';

export type { SystemConfig };

export class DiscoveryService implements IDiscoveryService {
  private config: SystemConfig = {};
  private initialized = false;

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

      // 🛰️ 2. Load Dynamic Discovery Config (from API)
      // We prioritize the master_api_url from config.json (runtime) over the baked-in env
      const apiBase = staticConfig.master_api_url || (import.meta as any).env?.VITE_MASTER_API_URL || '';
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

      // 🧠 3. Merge Configs (Static overrides API)
      this.config = { ...apiConfig, ...staticConfig };
      this.initialized = true;
      
      if (superApp) {
        superApp.state.discovery = { ...this.config };
      }
      
      console.log('🛰️ [Discovery] Total variables loaded:', Object.keys(this.config).length);
    } catch (err) {
      console.error('🛰️ [Discovery] Failed to sync configuration', err);
    }
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
