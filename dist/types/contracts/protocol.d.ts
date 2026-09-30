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
export declare const SUPERAPP_PROTOCOL: {
    readonly VERSION: "2.0.0";
    readonly ENDPOINTS: {
        readonly AUTH: "/auth/v1";
        readonly SYSTEM: "/system/v1";
        readonly INTEGRATION: "/v1/integration";
        readonly PRODUCTION: "/production/v1";
        readonly DB_QUERY: "/system/v1/db-query";
        readonly SUPERAPP_CALL: "/v1/superapp/call";
        readonly DISCOVERY: "/system/v1/discovery";
    };
};
export type SuperAppEndpoint = keyof typeof SUPERAPP_PROTOCOL.ENDPOINTS;
/** Well-known kernel events. */
export declare const SUPERAPP_EVENTS: {
    readonly SYSTEM_ERROR: "system:error";
    readonly SYSTEM_GOVERNANCE: "system:governance";
    readonly APPS_UPDATED: "apps:updated";
    /** The user asked to sign out. Emitted before the Shell drops the token, so an auth provider (SSO) can end its own session. */
    readonly AUTH_LOGOUT: "auth:logout";
};
export type SuperAppEvent = (typeof SUPERAPP_EVENTS)[keyof typeof SUPERAPP_EVENTS];
//# sourceMappingURL=protocol.d.ts.map