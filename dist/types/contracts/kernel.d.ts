/**
 * 🏛️ Kernel Contract
 * Full host surface exposed by the Shell's `SuperApp` to MFEs, business
 * modules, theme and shell components.
 */
import type { App } from 'vue';
import type * as Vue from 'vue';
import type { Router } from 'vue-router';
import type { useLocalStorage } from '@vueuse/core';
import type { ISuperAppCore, IProtocol, ISuperAppModule } from './protocol';
import type { AppRegistrationInput, AppUpdateInput, CommandRegistration, ComponentRegistration, ModuleEntryRegistration, ModuleManifest, PathChangeHandler, PingResult, RegisteredApp, SkillRegistration } from './registry';
import type { IAppState } from './app-state';
import type { IAuthState } from './auth';
import type { IPolicyService } from './policy';
import type { CreateApi } from './api-client';
import type { IFormatService } from './format';
import type { II18n } from './i18n';
/** Vue reactivity primitives handed to MFEs to guarantee a single runtime. */
export interface VueBridgeContext {
    ref: typeof Vue.ref;
    reactive: typeof Vue.reactive;
    computed: typeof Vue.computed;
    watch: typeof Vue.watch;
    watchEffect: typeof Vue.watchEffect;
    nextTick: typeof Vue.nextTick;
    markRaw: typeof Vue.markRaw;
    defineAsyncComponent: typeof Vue.defineAsyncComponent;
    shallowRef: typeof Vue.shallowRef;
    triggerRef: typeof Vue.triggerRef;
    onMounted: typeof Vue.onMounted;
    onUnmounted: typeof Vue.onUnmounted;
    defineComponent: typeof Vue.defineComponent;
    h: typeof Vue.h;
    provide: typeof Vue.provide;
    inject: typeof Vue.inject;
    useLocalStorage: typeof useLocalStorage;
}
/** Shell branding shown by the theme (header, favicon, login). */
export interface BrandingOptions {
    /** Product / company name (alt text, title). */
    name: string;
    /** Logo URL (light surfaces). */
    logo?: string;
    /** Optional logo for dark surfaces; falls back to `logo` on a light plate. */
    logoDark?: string;
    /** Small square icon (favicon, compact sidebar). */
    icon?: string;
    tagline?: string;
    /** Where clicking the logo goes (default `/`). */
    homePath?: string;
}
export interface KernelConfig {
    moduleManifest?: ModuleManifest;
    branding?: BrandingOptions;
    [key: string]: any;
}
export interface KernelInitOptions {
    app: App;
    router: Router;
    api?: IProtocol;
    config?: KernelConfig;
    theme?: any;
    message?: any;
    dialog?: any;
}
export interface KernelState {
    isInitializing: boolean;
    skills: SkillRegistration[];
    commands: CommandRegistration[];
    installedModules: Set<string>;
    moduleStates: Record<string, any>;
    discovery: Record<string, any>;
}
/**
 * Anything the kernel can install, Vue-plugin style:
 * - business module: `{ id, install(superApp) }` (registers itself via `registerBusinessModule`)
 * - MFE-style module: `{ id, install(app, superApp) }` (remote entries, DebuggerModule…)
 * - plain function: `(superApp, ...options) => void`
 */
export type SappInstallable = {
    id?: string;
    install(superApp: ISuperApp, ...options: any[]): void | Promise<void>;
} | {
    id?: string;
    install(app: App, superApp: ISuperApp, ...options: any[]): void | Promise<void>;
} | ((superApp: ISuperApp, ...options: any[]) => void | Promise<void>);
export interface ISuperApp extends ISuperAppCore {
    readonly state: KernelState;
    readonly $vue: VueBridgeContext;
    $app: App | null;
    $router: Router | null;
    $config: KernelConfig | null;
    $theme: any;
    $message: any;
    $dialog: any;
    $api: any;
    $appState: IAppState | null;
    /** Who is signed in (template global `$auth`). Not `$auth` here: that name resolves to the auth business module. */
    $authState: IAuthState;
    /** Authorisation checks — protocol `policy`, registered by the Shell's policy feature. */
    $policy: IPolicyService;
    /** Axios instance factory for app backends — `createApi({ baseURL, headers, onError… })`. Set by createSapp. */
    createApi: CreateApi;
    /** Translation service (registered as protocol `i18n` by createSapp). */
    $i18n: II18n;
    /** Formatting service: `$f.formatDate(iso)`, `$f.formatMoney(n)`. Follows `$i18n.locale`. */
    $f: IFormatService;
    /** Dynamic access to any registered protocol or business module (`$auth`, `$socket`...). */
    [dynamic: `$${string}`]: any;
    init(options: KernelInitOptions): void;
    /** Install a module (`superApp.install(new AuthModule(api))`), like `app.use(plugin)`. Returns the kernel for chaining. */
    install(plugin: SappInstallable, ...options: any[]): Promise<ISuperApp>;
    registerProtocol(id: string, instance: IProtocol): void;
    registerBusinessModule(id: string, instance: ISuperAppModule | any): void;
    registerModule(id: string, instance: ISuperAppModule): void;
    formatAppEntryUrl(url: string): string;
    /** Backend base URL (discovery `master_api_url`, else the API protocol's). */
    getApiBaseUrl(): string;
    /** Entry of a `package` app: `<api>/packages/<appId>/index.js` — the backend serves its deployed version. */
    packageEntryUrl(appId: string): string;
    /** Entry URL for any registered app, by its `type`. */
    resolveAppEntry(app: Pick<RegisteredApp, 'id' | 'url' | 'type'>): string;
    getRegisteredApps(): RegisteredApp[];
    syncManifestWithRegisteredApps(): void;
    registerApp(app: AppRegistrationInput): RegisteredApp;
    /** `updates.id` renames the app (route key + manifest key). */
    updateApp(id: string, updates: AppUpdateInput): RegisteredApp;
    normalizeAppId(id: string): string;
    deleteApp(id: string): boolean;
    pingApp(targetUrl: string): Promise<PingResult>;
    isModuleInstalled(id: string): boolean;
    markModuleInstalled(id: string): void;
    resolveModule(moduleId: string): Promise<void>;
    getModuleState<T = any>(moduleId: string, defaultState?: T): T;
    registerModuleEntry(config: ModuleEntryRegistration): void;
    getModuleEntry(id: string): any;
    registerComponent(config: ComponentRegistration): void;
    getComponent(id: string): any;
    readonly skills: SkillRegistration[];
    readonly commands: CommandRegistration[];
    registerSkill(config: SkillRegistration): void;
    getSkill(id: string): SkillRegistration | undefined;
    registerCommand(config: CommandRegistration): void;
    runCommand(id: string): void;
    onPathChange(moduleId: string, handler: PathChangeHandler): void;
    runPathAction(moduleId: string, path: string): void;
}
//# sourceMappingURL=kernel.d.ts.map