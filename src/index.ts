/**
 * @nhphero/vue-sapp — Super App (ESA) architecture package.
 *
 * - contracts/  : shared TypeScript contracts between Shell, protocols, business modules and MFEs
 * - kernel/     : `SuperApp` host kernel (registries, module lifecycle, event bus, `$` proxy)
 * - protocols/  : `ApiProtocol` (HTTP + superapp actions) and `SocketProtocol` (WebSocket)
 * - services/   : `discoveryService` (runtime config) and `createAppState` (global state)
 * - bridge/     : `installMfBridge` (Shell) and per-framework proxies for MFEs
 * - app/        : `createSapp` — boots the whole Shell; the Shell only registers `defineShellFeature`s
 * - vite/       : `vueBridgePlugin` (import via `@nhphero/vue-sapp/vite` in vite.config only)
 */
export * from './contracts';
export * from './kernel';
export * from './protocols';
export * from './services';
export * from './bridge';
export * from './app';
