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
import { SUPERAPP_PROTOCOL } from '../contracts';

export type { SystemConfig };

/** Keys the environment never overrides: how the Shell finds the backend. */
const LOCAL_ONLY = ['master_api_url'];

/** The backend: config.json's `master_api_url`, else the build's, else :4400 on a local dev host. */
const resolveApiBase = (staticConfig: any): string =>
  staticConfig.master_api_url || (import.meta as any).env?.VITE_MASTER_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:4400' : '');

async function fetchJson(url: string): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, { cache: 'no-cache', signal: controller.signal });
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export class DiscoveryService implements IDiscoveryService {
  private config: SystemConfig = {};
  private staticConfig: SystemConfig = {};
  private apiBase = '';
  private platform: any = null;
  private apps: any[] | null = null;
  private initialized = false;

  async initialize(superApp?: { state: { discovery: Record<string, any> } }) {
    // 1. This deployment's file (an index.html fallback is not JSON: ignored).
    this.staticConfig = (await fetchJson('/config.json')) ?? {};
    this.apiBase = String(resolveApiBase(this.staticConfig)).replace(/\/+$/, '');
    // 2. Everything else, in one request.
    await this.reload();
    this.initialized = true;
    if (superApp) superApp.state.discovery = { ...this.config };
    console.log('🛰️ [Discovery] Total variables loaded:', Object.keys(this.config).length);
  }

  /** Fetches `<backend>/discovery.json` again (after an admin change) and merges it. */
  async reload(): Promise<boolean> {
    const payload = this.apiBase ? await fetchJson(`${this.apiBase}/discovery.json`) : null;
    if (payload && typeof payload === 'object' && 'system' in payload) {
      const environment = Object.fromEntries(Object.entries(payload.environment ?? {})
        .filter(([key, value]) => typeof value === 'string' && !LOCAL_ONLY.includes(key)));
      this.config = { ...(payload.system ?? {}), ...this.staticConfig, ...environment };
      this.platform = payload.platform ?? null;
      this.apps = Array.isArray(payload.apps) ? payload.apps : null;
      return true;
    }
    // A backend older than discovery.json: the system discovery endpoint.
    const system = this.apiBase ? await fetchJson(`${this.apiBase}${SUPERAPP_PROTOCOL.ENDPOINTS.DISCOVERY}`) : null;
    if (!this.apiBase) console.warn('🛰️ [Discovery] No master_api_url in config.json or the build — backend discovery skipped.');
    this.config = { ...(system ?? {}), ...this.staticConfig };
    return false;
  }

  /** Admin → Config, from the last discovery.json (null: not served). */
  getPlatform(): any | null {
    return this.platform;
  }

  /** The app registry rows, from the last discovery.json (null: not served). */
  getApps(): any[] | null {
    return this.apps;
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
