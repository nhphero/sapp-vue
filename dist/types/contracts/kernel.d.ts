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
/**
 * What an admin sets for the whole platform (Admin → Config), read by the Shell at boot from
 * `<package files>/config.json`. An empty string keeps what the Shell ships with. Not a mini app's
 * config — each mini app has its own src/config.ts.
 */
export interface PlatformConfig {
    /** logo / favicon: a URL, or a path on the package files host (`_assets/logo-<hash>.png`) — see `resolvePackageFileUrl`. */
    general: {
        title: string;
        description: string;
        logo: string;
        favicon: string;
    };
    /** A theme package and its version — "stable" (default) follows the package's stable alias; empty package = built into the Shell. */
    theme: {
        package: string;
        version: string;
    };
    apps: {
        /** Recently used apps shown in the app switcher; 0 hides the row. */
        recentCount: number;
    };
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
    /** The app registry (backend sys_apps, `<package files>/registry.json`), loaded by `loadServerApps()`. */
    serverApps: RegisteredApp[];
    /** The platform config (Admin → Config), loaded by `loadPlatformConfig()`; null until it answers. */
    platformConfig: PlatformConfig | null;
    /** CSS scope key of the mini app on screen (set by the Shell's app container); '' on Shell pages. */
    activeCssScope: string;
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
    /** The shim entry of a `package` app, `<api>/packages/<appId>/index.js` — re-exports its deployed version. */
    packageEntryUrl(appId: string): string;
    /**
     * Base URL of the package registry files — `packages.url` of the Shell config (a static server), else
     * `<api>/package-files` (the backend serving the same folder).
     */
    getPackageFilesBaseUrl(): string;
    /** Entry inside one extracted package version: `<package files>/<package>/<version>/index.js`. */
    packageFilesEntryUrl(pkg: string, version: string): string;
    /** Entry URL for any registered app, by its `type` (package apps: their version's files when known). */
    resolveAppEntry(app: Pick<RegisteredApp, 'id' | 'url' | 'type' | 'package' | 'version'>): string;
    /**
     * Load the local apps of the package registry (`<package files>/apps.json`) into the registry — every
     * mini app package gets an app without anyone registering it. Called by createSapp at boot; call
     * again after deploying. A server that does not answer leaves the registry as it is.
     */
    loadServerApps(): Promise<RegisteredApp[]>;
    /**
     * Load the platform config (`<package files>/config.json`) and apply it: page title, favicon, the
     * branding the theme shows. Called by createSapp at boot; call again after saving it. A server that
     * does not answer leaves everything as it is (returns null).
     */
    loadPlatformConfig(): Promise<PlatformConfig | null>;
    /**
     * The key a mini app's CSS is scoped to (`mfeScopedCssPlugin`): the Shell marks the app's viewport
     * `data-mfe="<key>"` and its teleported surfaces `data-portal="<key>"`, so one app's utilities never
     * reach the Shell or another app. Its build's `__sappCssScope` export, else its module id.
     */
    getModuleCssScope(moduleId: string): string;
    /** A path on the package files host (`_assets/logo.png`) as a URL; URLs (http, data:, /…) unchanged. */
    resolvePackageFileUrl(pathOrUrl: string): string;
    /**
     * The manifest.json of a registered app's current source — a package app's deployed version
     * (`<package files>/<package>/<version>/manifest.json`, with `version`, `publishedAt`…), or a remote
     * app's `<url>/manifest.json`. Cached per URL; null when there is none.
     */
    loadAppManifest(appId: string): Promise<Record<string, any> | null>;
    getRegisteredApps(): RegisteredApp[];
    /** The app a `/app/<key>` route names: by slug, else by id, else by code (older links keep working). */
    findAppByRoute(key: string): RegisteredApp | undefined;
    /** Route of an app by its id (or its code, e.g. `admin`): `/app/<slug>[/<subPath>]`. */
    appPath(appIdOrCode: string, subPath?: string): string;
    /** An app by its id, else its code. */
    getApp(appIdOrCode: string): RegisteredApp | undefined;
    syncManifestWithRegisteredApps(): void;
    /** Registers through the server's app registry (admin) — every user sees it. */
    registerApp(app: AppRegistrationInput): Promise<RegisteredApp>;
    /** The id stays (the key); `updates.slug` moves the route. */
    updateApp(id: string, updates: AppUpdateInput): Promise<RegisteredApp>;
    normalizeAppId(id: string): string;
    deleteApp(id: string): Promise<boolean>;
    /** Sends the apps this browser kept in localStorage (before the server registry) to the server, once (admin). */
    importLocalApps(): Promise<{
        imported: string[];
        skipped: string[];
    }>;
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