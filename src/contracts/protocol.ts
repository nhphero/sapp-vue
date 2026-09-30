/**
 * 🛰️ SuperApp Protocol Contracts
 *
 * Base contracts shared between the Shell (host kernel), core protocols
 * (api / socket) and business modules. Structurally compatible with the
 * legacy `@erp/shared-core` SuperAppProtocol so existing modules keep working.
 */

export interface IEventEmitter {
  on(event: string, handler: (data: any) => void): void;
  emit(event: string, data?: any): void;
  off(event: string, handler: (data: any) => void): void;
}

export type ModuleStatus = 'IDLE' | 'INSTALLING' | 'ACTIVE' | 'DISABLED' | 'ERROR';

/**
 * A protocol is a transport / capability registered on the kernel and
 * resolved through the `$<id>` proxy (e.g. `superApp.$api`, `superApp.$socket`).
 */
export interface IProtocol {
  id: string;
  bind?(superApp: ISuperAppCore): void;
  request?(path: string, options?: any): Promise<any>;
  doAction?(action: string, params?: any): Promise<any>;
}

/**
 * Business module installed in-process by the Shell (auth, db, system...).
 * Resolved through the `$<id>` proxy with governance guard.
 */
export interface ISuperAppModule {
  id: string;
  isEnabled?: boolean;
  status?: ModuleStatus;
  metadata?: Record<string, any>;
  install(superApp: ISuperAppCore): Promise<void> | void;
}

/**
 * Minimal kernel surface required by protocols and business modules.
 * The full host surface is `ISuperApp` (see ./kernel.ts).
 */
export interface ISuperAppCore extends IEventEmitter {
  registerProtocol(id: string, instance: IProtocol): void;
  registerModule(id: string, instance: ISuperAppModule): void;
  registerBusinessModule(id: string, module: any): void;
  getProtocol<T = IProtocol>(id: string): T | undefined;
  getModule<T = any>(id: string): T | undefined;
  isModuleActive(id: string): boolean;
  setModuleEnabled(id: string, state: boolean): void;
  doAction<T = any>(action: string, params?: any): Promise<T>;
}

/**
 * 🗺️ Global Module Route Mapping
 * Ensuring FE modules correctly target their BE counterparts.
 */
export const SUPERAPP_PROTOCOL = {
  VERSION: '2.0.0',
  ENDPOINTS: {
    AUTH: '/auth/v1',
    SYSTEM: '/system/v1',
    INTEGRATION: '/v1/integration',
    PRODUCTION: '/production/v1',
    DB_QUERY: '/system/v1/db-query',
    SUPERAPP_CALL: '/v1/superapp/call',
    DISCOVERY: '/system/v1/discovery',
  },
} as const;

export type SuperAppEndpoint = keyof typeof SUPERAPP_PROTOCOL.ENDPOINTS;

/** Well-known kernel events. */
export const SUPERAPP_EVENTS = {
  SYSTEM_ERROR: 'system:error',
  SYSTEM_GOVERNANCE: 'system:governance',
  APPS_UPDATED: 'apps:updated',
  /** The user asked to sign out. Emitted before the Shell drops the token, so an auth provider (SSO) can end its own session. */
  AUTH_LOGOUT: 'auth:logout',
} as const;

export type SuperAppEvent = (typeof SUPERAPP_EVENTS)[keyof typeof SUPERAPP_EVENTS];
