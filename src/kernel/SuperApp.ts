import { 
  reactive, markRaw, ref, computed, watch, watchEffect, nextTick, 
  defineAsyncComponent, shallowRef, triggerRef, onMounted, onUnmounted, 
  defineComponent, h, provide, inject, type App 
} from 'vue';
import type { Router } from 'vue-router';
import { useLocalStorage } from '@vueuse/core';
import { createAuthState } from '../services/auth';
import { createEnvironment } from '../services/env';
import type {
  ISuperApp,
  ISuperAppModule,
  SappInstallable,
  IProtocol,
  KernelInitOptions,
  KernelConfig,
  KernelState,
  ComponentRegistration,
  SkillRegistration,
  CommandRegistration,
  ModuleEntryRegistration,
  PathChangeHandler,
  RegisteredApp,
  AppRegistrationInput,
  AppUpdateInput,
  PingResult,
  IAppState,
  IAuthState,
  IFormatService,
  IPolicyService,
  CreateApi,
  II18n,
  PlatformConfig,
  BrandingOptions,
  IDiscoveryService,
  IEnvironment,
} from '../contracts';
import { REGISTERED_APPS_STORAGE_KEY, SUPERAPP_EVENTS } from '../contracts';

/** @deprecated Use `KernelInitOptions` from `@nhphero/vue-sapp` contracts. */
export type AppConfig = KernelInitOptions;

import { createHooks } from '../services/hooks';
import { HOOK_EVENTS, type PluginDefinition, type PluginDescriptor } from '../contracts/hooks';

export class SuperApp implements ISuperApp {
  // Dynamic `$<protocol|module>` access resolved by the constructor Proxy.
  [dynamic: `$${string}`]: any;

  private modules: Map<string, any> = new Map();
  private components: Map<string, any> = new Map();
  
  // 🛰️ ESA v5: Reactive Registries
  private _protocols = reactive<Map<string, any>>(new Map());
  private _modules = reactive<Map<string, any>>(new Map());
  
  // 🧠 ESA v5: Event Bus (Central Nervous System)
  private _eventHandlers = new Map<string, Set<Function>>();

  // ⚡ Reactive state for UI elements (Navigation, Command Palette)
  public state: KernelState = reactive({
    isInitializing: true,
    skills: [] as SkillRegistration[],
    commands: [] as CommandRegistration[],
    installedModules: new Set<string>(),
    moduleStates: {} as Record<string, any>, // 🧠 Centralized Mini-App State
    discovery: {} as Record<string, any>, // 🛰️ System discovery parameters
    serverApps: [] as RegisteredApp[], // 📦 Local apps served by the backend's package registry
    platformConfig: null as PlatformConfig | null, // ⚙️ Admin → Config
    activeCssScope: '', // 🎨 CSS scope of the mini app on screen (mfeScopedCssPlugin)
    environment: {} as Record<string, string>, // 🌐 public environment (Admin → Public Environment)
  });

  private loadingPromises: Map<string, Promise<void>> = new Map();

  public $app: App | null = null;
  public $router: Router | null = null;
  public $config: KernelConfig | null = null;
  public $theme: any = null;
  public $message: any = null;
  public $dialog: any = null;
  public $api: any = null;
  public $appState: IAppState | null = null;
  public $authState: IAuthState = createAuthState();
  /** Type only: resolved by the `$` proxy from the `policy` protocol the Shell registers. */
  declare public $policy: IPolicyService;
  /** Set by `createSapp` (it knows the token key and the message service); see contracts/api-client.ts. */
  declare public createApi: CreateApi;
  public $f!: IFormatService;
  /** The public environment over `state.environment` (contracts/env.ts). */
  public $env: IEnvironment = createEnvironment(() => this.state.environment);
  // Resolved through the `$` proxy from the registered `i18n` protocol (no runtime field).
  public declare $i18n: II18n;

  /** The Proxy returned by the constructor; always hand THIS out (arrow fields capture the raw target as `this`). */
  private _self!: ISuperApp;

  constructor() {
    // 🎭 ESA MAGIC: Dynamic Proxy Resolver
    const proxy = new Proxy(this, {
      get: (target, prop: string | symbol) => {
        if (typeof prop === 'string' && prop.startsWith('$')) {
          const key = prop.slice(1);
          
          // 1. Resolve from core protocols
          if (target._protocols.has(key)) return target._protocols.get(key);
          
          // 2. Resolve from business modules (with status guard)
          if (target._modules.has(key)) {
            const module = target._modules.get(key);
            if (module.isEnabled === false) {
              console.warn(`🛡️ [sys-kernel] Access denied: Module $${key} is currently DISABLED.`);
              return null;
            }
            return module;
          }
          
          if (key in target) return (target as any)[prop];
        }
        return (target as any)[prop];
      }
    });
    this._self = proxy as unknown as ISuperApp;
    return proxy;
  }

  // --- 🛰️ EVENT BUS (IEventEmitter) ---

  public on = (event: string, handler: Function) => {
    if (!this._eventHandlers.has(event)) this._eventHandlers.set(event, new Set());
    this._eventHandlers.get(event)!.add(handler);
  };

  public emit = (event: string, data?: any) => {
    // console.debug(`📡 [sys-kernel] Event emitted: ${event}`, data);
    this._eventHandlers.get(event)?.forEach(handler => handler(data));
  };

  public off = (event: string, handler: Function) => {
    this._eventHandlers.get(event)?.delete(handler);
  };

  // --- 🛡️ GOVERNANCE ---

  public isModuleActive = (id: string): boolean => {
    const mod = this._modules.get(id);
    return !!(mod && mod.isEnabled !== false);
  };

  public setModuleEnabled = (id: string, state: boolean) => {
    const mod = this._modules.get(id);
    if (mod) {
      mod.isEnabled = state;
      console.log(`🛡️ [sys-kernel] Module status changed: $${id} -> ${state ? 'ENABLED' : 'DISABLED'}`);
      this.emit(SUPERAPP_EVENTS.SYSTEM_GOVERNANCE, { id, isEnabled: state });
    }
  };

  public registerProtocol = (id: string, instance: IProtocol) => {
    console.log(`📡 [sys-kernel] Protocol registered: $${id}`);
    this._protocols.set(id, instance);
  };

  public registerBusinessModule = (id: string, instance: ISuperAppModule | any) => {
    console.log(`🔌 [sys-kernel] Business module registered: $${id}`);
    // Default to enabled if not specified
    if (instance.isEnabled === undefined) instance.isEnabled = true;
    this._modules.set(id, instance);
  };

  public registerModule = (id: string, instance: ISuperAppModule) => {
    this.registerBusinessModule(id, instance);
  };

  /**
   * 🔌 Install a module, Vue-plugin style. The kernel is the subject: `superApp.install(module)`.
   * `install(superApp)` → business module · `install(app, superApp)` → MFE-style module · function → called with the kernel.
   */
  public install = async (plugin: SappInstallable, ...options: any[]): Promise<ISuperApp> => {
    const self = this._self ?? (this as unknown as ISuperApp);
    if (typeof plugin === 'function') {
      await plugin(self, ...options);
      return self;
    }
    const fn = (plugin as any).install;
    if (typeof fn !== 'function') throw new Error('[sys-kernel] install(): plugin has no install() method');
    const label = (plugin as any).id ?? (plugin as any).name ?? 'anonymous';
    console.log(`🔌 [sys-kernel] Installing module: ${label}`);
    if (fn.length >= 2) await fn.call(plugin, this.$app, self, ...options);
    else await fn.call(plugin, self, ...options);
    return self;
  };

  public getProtocol = <T = any>(id: string): T | undefined => {
    return this._protocols.get(id);
  };

  public getModule = <T = any>(id: string): T | undefined => {
    return this._modules.get(id);
  };

  /**
   * ⚡ [sys-kernel] Invoke a SuperApp Action via the default API Bridge
   */
  /** Extension points (contracts/hooks.ts). */
  public $hook = createHooks();

  /** Loaded plugins: their definition, the scoped hook they got, their reactive config and where they came from. */
  private plugins = new Map<string, { def: PluginDefinition; hook: ReturnType<ReturnType<typeof createHooks>['scope']>; config: Record<string, unknown>; source: string }>();
  private pluginsStarted = false;

  /** Where a plugin's module is: its own URL, else its version's files on this server. */
  private pluginEntry = (p: PluginDescriptor): string =>
    (p.url ? this.formatAppEntryUrl(p.url) : p.version ? this.packageFilesEntryUrl(p.package, p.version) : '');

  public loadPlugins = async (): Promise<void> => {
    this.pluginsStarted = true;
    await this.syncPlugins(this.discoveryService?.getPlugins?.() ?? []);
  };

  /** Brings the loaded plugins in line with `list`: config updated, new ones loaded, gone / moved ones unloaded. */
  private syncPlugins = async (list: PluginDescriptor[]): Promise<void> => {
    const wanted = new Map(list.filter(p => p?.id).map(p => [p.id, p]));
    for (const [id, loaded] of [...this.plugins]) {
      const next = wanted.get(id);
      if (!next || this.pluginEntry(next) !== loaded.source) await this.unloadPlugin(id);
    }
    for (const p of wanted.values()) {
      const loaded = this.plugins.get(p.id);
      if (loaded) {
        const next = p.config ?? {};
        if (JSON.stringify(next) !== JSON.stringify(loaded.config)) {
          for (const key of Object.keys(loaded.config)) if (!(key in next)) delete loaded.config[key];
          Object.assign(loaded.config, next);
          void this.$hook.emit(HOOK_EVENTS.PLUGIN_CONFIG, { id: p.id, config: loaded.config });
        }
        continue;
      }
      await this.loadPlugin(p);
    }
  };

  private loadPlugin = async (p: PluginDescriptor): Promise<void> => {
    const source = this.pluginEntry(p);
    if (!source) {
      console.warn(`🪝 [plugins] ${p.id}: no version and no URL — skipped.`);
      return;
    }
    try {
      const mod = await import(/* @vite-ignore */ source);
      const def: PluginDefinition | undefined = mod?.default ?? mod?.plugin;
      if (!def || typeof def.install !== 'function') throw new Error('the module has no default export with install()');
      const hook = this.$hook.scope(`plugin:${p.id}`);
      const config = reactive({ ...(p.config ?? {}) });
      this.plugins.set(p.id, { def, hook, config, source });
      await def.install({ id: p.id, hook, config, superApp: this as unknown as ISuperApp });
      console.log(`🪝 [plugins] ${p.id} loaded (${source})`);
    } catch (err: any) {
      this.plugins.get(p.id)?.hook.dispose();
      this.plugins.delete(p.id);
      console.error(`🪝 [plugins] ${p.id} failed to load from ${source}:`, err?.message ?? err);
    }
  };

  private unloadPlugin = async (id: string): Promise<void> => {
    const loaded = this.plugins.get(id);
    if (!loaded) return;
    try {
      await loaded.def.uninstall?.({ id, hook: loaded.hook, config: loaded.config, superApp: this as unknown as ISuperApp });
    } catch (err) {
      console.error(`🪝 [plugins] ${id} uninstall failed:`, err);
    }
    loaded.hook.dispose();
    this.plugins.delete(id);
    console.log(`🪝 [plugins] ${id} unloaded`);
  };

  public doAction = async <T = any>(action: string, params: any = {}): Promise<T> => {
    const api = this.getProtocol('api');
    if (!api) throw new Error('API protocol not registered in SuperApp.');
    if (!api.doAction) throw new Error('API protocol does not support doAction.');
    return await api.doAction(action, params);
  };

  /**
   * 🏗️ ESA PLATFORM CORE: Unified Framework Context
   * Exposing Vue's reactive core to MFEs to ensure a single unified runtime.
   */
  public $vue = {
    ref,
    reactive,
    computed,
    watch,
    watchEffect,
    nextTick,
    markRaw,
    defineAsyncComponent,
    shallowRef,
    triggerRef,
    onMounted,
    onUnmounted,
    defineComponent,
    h,
    provide,
    inject,
    useLocalStorage
  };

  public init = (config: KernelInitOptions) => {
    console.log('🚀 [sys-kernel] SuperApp Platform Kernel Initializing...');
    this.$app = config.app;
    this.$router = config.router;
    this.$api = config.api;
    // Reactive, so a branding change (loadPlatformConfig) reaches the header without a reload.
    this.$config = config.config ? reactive({ ...config.config }) : null;
    this.$theme = config.theme;
    this.$message = config.message;
    this.$dialog = config.dialog;
    
    // 🏛️ ESA: Mark system as ready for module resolution
    this.state.isInitializing = false;
    this.syncManifestWithRegisteredApps();
  };

  // --- 🌐 DYNAMIC APPLICATION REGISTRY ---

  public formatAppEntryUrl = (url: string): string => {
    if (!url) return '';
    const trimmed = url.trim().replace(/\/+$/, '');
    if (trimmed.endsWith('.js') || trimmed.endsWith('.ts')) {
      return trimmed;
    }
    const isDev = (import.meta as any).env?.DEV ?? true;
    return `${trimmed}${isDev ? '/src/index.ts' : '/index.js'}`;
  };

  public getApiBaseUrl = (): string => {
    const fromDiscovery = this.state.discovery?.master_api_url;
    const api = this.getProtocol('api') as { getBaseUrl?: () => string } | undefined;
    return String(fromDiscovery || api?.getBaseUrl?.() || '').replace(/\/+$/, '');
  };

  public packageEntryUrl = (appId: string): string => `${this.getApiBaseUrl()}/packages/${encodeURIComponent(appId)}/index.js`;

  public getPackageFilesBaseUrl = (): string => {
    const configured = this.state.discovery?.['packages.url'];
    return String(configured || `${this.getApiBaseUrl()}/package-files`).replace(/\/+$/, '');
  };

  public packageFilesEntryUrl = (pkg: string, version: string): string =>
    `${this.getPackageFilesBaseUrl()}/${encodeURIComponent(pkg)}/${encodeURIComponent(version)}/index.js`;

  /**
   * A package app loads straight from its extracted version (`package-files/<package>/<version>`);
   * only while that version is unknown (no server answer yet) does it go through the id shim.
   */
  public resolveAppEntry = (app: Pick<RegisteredApp, 'id' | 'url' | 'type' | 'package' | 'version'>): string => {
    if (app.type !== 'package') return this.formatAppEntryUrl(app.url);
    return app.package && app.version ? this.packageFilesEntryUrl(app.package, app.version) : this.packageEntryUrl(app.id);
  };

  /** True once the server's registry answered — until then the built-ins stand in. */
  private serverAppsLoaded = false;

  /**
   * The app registry (backend sys_apps) from the static `<package files>/registry.json`; a server older
   * than the registry answers `apps.json` (package apps only) instead.
   */
  /**
   * The app registry — from `<backend>/discovery.json` (fetched again: call after a change); a backend
   * older than it: the static registry.json / apps.json.
   */
  public loadServerApps = async (): Promise<RegisteredApp[]> => {
    if (await this.refreshDiscovery()) return this.state.serverApps;
    return this.loadServerAppsFromFiles();
  };

  private loadServerAppsFromFiles = async (): Promise<RegisteredApp[]> => {
    const fetchJson = async (name: string) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      try {
        // Static files the backend rewrites on every change, served by the package files host.
        const res = await fetch(`${this.getPackageFilesBaseUrl()}/${name}`, { cache: 'no-cache', signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } finally {
        clearTimeout(timer);
      }
    };
    try {
      let rows: any[];
      try {
        rows = (await fetchJson('registry.json'))?.apps ?? [];
      } catch {
        rows = ((await fetchJson('apps.json')) ?? []).map((app: any) => ({ ...app, id: app.appId, name: app.title, type: 'package' }));
      }
      this.state.serverApps = rows.filter(row => row?.id).map(row => this.toRegisteredApp(row));
      this.serverAppsLoaded = true;
    } catch (err: any) {
      console.warn(`📦 [sys-kernel] App registry unavailable (${err?.message ?? err}) — built-in apps only.`);
      return this.state.serverApps;
    }
    this.syncManifestWithRegisteredApps();
    this.emit(SUPERAPP_EVENTS.APPS_UPDATED, this.getRegisteredApps());
    return this.state.serverApps;
  };

  /** Built-in remote URLs per environment: the Shell config's `<id>.url`, else the build's env. */
  private builtInUrl = (id: string): string => {
    const env = (import.meta as any).env ?? {};
    const fallback: Record<string, string> = {
      admin: env.VITE_ADMIN_URL || 'http://localhost:4403',
    };
    return String(this.state.discovery?.[`${id}.url`] || fallback[id] || '').replace(/\/+$/, '');
  };

  /** A registry row (registry.json / apps.registry.*) as the Shell's record. */
  private toRegisteredApp = (row: any): RegisteredApp => {
    const id = String(row.id);
    const code = row.code ? String(row.code) : null;
    const common = {
      id,
      code,
      slug: row.slug || code || id,
      name: row.name || id,
      description: row.description || '',
      icon: row.icon || (row.type === 'package' ? 'Package' : 'Layers'),
      isSystem: !!row.isSystem,
      isEnabled: row.isEnabled !== false,
      managedBy: 'server' as const,
      updatedAt: row.updatedAt || new Date().toISOString(),
    };
    if (row.type === 'package') {
      const app = { ...common, type: 'package' as const, package: row.package ?? undefined, version: row.version ?? undefined, channel: row.channel ?? null, url: this.getApiBaseUrl() };
      return { ...app, entryUrl: this.resolveAppEntry(app) };
    }
    // An empty URL (built-ins) comes from the Shell config of this environment: `<code>.url`.
    const url = String(row.url || this.builtInUrl(code ?? id)).replace(/\/+$/, '');
    return { ...common, type: 'remote', url, entryUrl: url ? this.formatAppEntryUrl(url) : '' };
  };

  /** The Shell's runtime config source (set by createSapp): reloads the environment. */
  public discoveryService: IDiscoveryService | null = null;

  /** Fetches `<backend>/discovery.json` again and applies it; false when the backend does not serve it. */
  private refreshDiscovery = async (): Promise<boolean> => {
    if (!this.discoveryService?.reload) return false;
    if (!(await this.discoveryService.reload())) return false;
    this.applyDiscovery();
    return true;
  };

  public reloadEnvironment = async (): Promise<void> => {
    if (!(await this.refreshDiscovery())) await this.loadServerAppsFromFiles();
  };

  /**
   * What the discovery service last fetched, applied without a request: the merged config (changed
   * `<module>.url` entries win in the manifest), Admin → Config, the app registry. Says which of the
   * two the backend served (createSapp falls back to the older files for the others).
   */
  public applyDiscovery = (): { platform: boolean; apps: boolean } => {
    const source = this.discoveryService;
    if (!source) return { platform: false, apps: false };
    const merged = source.getAll();
    const before = this.state.discovery ?? {};
    this.state.discovery = merged;
    this.state.environment = source.getEnvironment?.() ?? {};
    if (this.$config) {
      const manifest = (this.$config.moduleManifest ??= {});
      for (const [key, value] of Object.entries(merged)) {
        if (key.endsWith('.url') && typeof value === 'string' && value && before[key] !== value) {
          manifest[key.slice(0, -'.url'.length)] = this.formatAppEntryUrl(value);
        }
      }
    }
    const platform = source.getPlatform?.();
    if (platform) this.applyPlatformConfig(platform);
    const rows = source.getApps?.();
    if (rows) {
      this.state.serverApps = rows.filter(row => row?.id).map(row => this.toRegisteredApp(row));
      this.serverAppsLoaded = true;
      this.syncManifestWithRegisteredApps();
      this.emit(SUPERAPP_EVENTS.APPS_UPDATED, this.getRegisteredApps());
    }
    const plugins = source.getPlugins?.();
    if (plugins && this.pluginsStarted) void this.syncPlugins(plugins);
    return { platform: !!platform, apps: !!rows };
  };

  /** Branding given to createSapp, kept so an emptied platform field falls back to it. */
  private shellBranding: BrandingOptions | null = null;

  public loadPlatformConfig = async (): Promise<PlatformConfig | null> => {
    if (await this.refreshDiscovery()) return this.state.platformConfig;
    let config: PlatformConfig;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      // A static file the backend writes on every save, beside apps.json.
      const res = await fetch(`${this.getPackageFilesBaseUrl()}/config.json`, { cache: 'no-cache', signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      config = await res.json();
    } catch (err: any) {
      console.warn(`⚙️ [sys-kernel] Platform config unavailable (${err?.message ?? err}) — Shell defaults kept.`);
      return null;
    }
    return this.applyPlatformConfig(config);
  };

  /** Admin → Config applied: page title, favicon, the branding the theme shows. */
  private applyPlatformConfig = (config: PlatformConfig): PlatformConfig => {
    this.state.platformConfig = config;

    const general = config.general ?? ({} as PlatformConfig['general']);
    const logo = general.logo ? this.resolvePackageFileUrl(general.logo) : '';
    const favicon = general.favicon ? this.resolvePackageFileUrl(general.favicon) : '';
    if (this.$config) {
      this.shellBranding ??= { ...(this.$config.branding ?? { name: '' }) };
      const shell = this.shellBranding;
      this.$config.branding = {
        ...shell,
        name: general.title || shell.name,
        tagline: general.description || shell.tagline,
        logo: logo || shell.logo,
        // A platform logo has no dark variant of its own — the light plate is used instead.
        logoDark: logo ? undefined : shell.logoDark,
        icon: favicon || shell.icon,
      };
    }
    const branding = this.$config?.branding;
    if (branding?.name) document.title = branding.name;
    const href = branding?.icon || branding?.logo;
    if (href) {
      const link = (document.querySelector('link[rel~="icon"]') as HTMLLinkElement | null) ?? Object.assign(document.createElement('link'), { rel: 'icon' });
      link.href = href;
      if (!link.parentNode) document.head.appendChild(link);
    }
    return config;
  };

  public resolvePackageFileUrl = (pathOrUrl: string): string =>
    /^([a-z][a-z0-9+.-]*:|\/)/i.test(pathOrUrl) ? pathOrUrl : `${this.getPackageFilesBaseUrl()}/${pathOrUrl.replace(/^\.?\/+/, '')}`;

  private manifestCache = new Map<string, Promise<Record<string, any> | null>>();

  public loadAppManifest = (appId: string): Promise<Record<string, any> | null> => {
    const app = this.getRegisteredApps().find(a => a.id === appId);
    if (!app) return Promise.resolve(null);
    let url: string;
    if (app.type === 'package') {
      if (!app.package || !app.version) return Promise.resolve(null);
      url = `${this.getPackageFilesBaseUrl()}/${encodeURIComponent(app.package)}/${encodeURIComponent(app.version)}/manifest.json`;
    } else {
      // The source root of a remote: its entry minus /src/index.ts (dev) or /index.js (built).
      const root = (app.entryUrl || this.formatAppEntryUrl(app.url)).replace(/\/(src\/index\.ts|index\.js)$/, '');
      url = `${root}/manifest.json`;
    }
    let pending = this.manifestCache.get(url);
    if (!pending) {
      pending = fetch(url, { cache: 'no-cache' })
        .then(res => (res.ok && (res.headers.get('content-type') ?? '').includes('json') ? res.json() : null))
        .catch(() => null);
      this.manifestCache.set(url, pending);
    }
    return pending;
  };

  /** Stand-ins while the server's registry has not answered (it seeds the same built-ins). */
  private getBuiltInApps = (): RegisteredApp[] => [
    { id: 'admin', code: 'admin', name: 'Admin Management', description: 'Platform Governance & Applications Registry', icon: 'Shield', isSystem: true },
  ].map(app => this.toRegisteredApp({ ...app, type: 'remote', url: '' }));

  /**
   * Apps declared by the Shell's config (`config.json` / discovery) under `registry.apps`:
   * `[{ id, name, description?, icon?, type?, package? }]`. A `remote` app (default) is mounted from its
   * `<id>.url` entry; a `package` app needs no URL — the backend serves its deployed version. They join
   * the server's registry (which wins for an id it has).
   */
  private getConfiguredApps = (): RegisteredApp[] => {
    const declared = this.state.discovery?.['registry.apps'];
    if (!Array.isArray(declared)) return [];
    return declared
      .filter((app: any) => app?.id && (app.type === 'package' || typeof this.state.discovery?.[`${app.id}.url`] === 'string'))
      .map((app: any): RegisteredApp => ({ ...this.toRegisteredApp({ ...app, code: app.id, isSystem: true, url: '' }), managedBy: undefined }));
  };

  /** The server's registry (sys_apps), then config-declared apps; the built-ins until the server answers. */
  public getRegisteredApps = (): RegisteredApp[] => {
    const sources = [
      ...this.state.serverApps,
      ...this.getConfiguredApps(),
      ...(this.serverAppsLoaded ? [] : this.getBuiltInApps()),
    ];
    // One record per app: an id or a code seen earlier (the server's) wins.
    const seen = new Set<string>();
    return sources.filter(app => {
      if (seen.has(app.id) || (app.code && seen.has(`code:${app.code}`))) return false;
      seen.add(app.id);
      if (app.code) seen.add(`code:${app.code}`);
      return true;
    });
  };

  public syncManifestWithRegisteredApps = () => {
    const config = this.$config;
    if (!config) return;
    const manifest = (config.moduleManifest ??= {});

    // 🛰️ Discovery convention: `<moduleId>.url` → remote entry (config.json or /system/v1/discovery)
    for (const [key, value] of Object.entries(this.state.discovery || {})) {
      if (!key.endsWith('.url') || typeof value !== 'string' || !value) continue;
      const moduleId = key.slice(0, -'.url'.length);
      if (moduleId && !manifest[moduleId]) manifest[moduleId] = this.formatAppEntryUrl(value);
    }

    for (const app of this.getRegisteredApps()) {
      if (!app.id || app.isEnabled === false) continue;
      const entry = app.type === 'package' ? this.resolveAppEntry(app) : app.entryUrl || (app.url ? this.formatAppEntryUrl(app.url) : '');
      if (!entry) continue;
      manifest[app.id] = entry;
    }
  };

  /** Saves through the server's registry (admin), then reloads it — every user sees the change. */
  private saveApp = async (app: Record<string, unknown>, create: boolean): Promise<RegisteredApp> => {
    const saved = await this.doAction('apps.registry.save', { app, create });
    await this.loadServerApps();
    return this.getRegisteredApps().find(a => a.id === saved?.id) ?? this.toRegisteredApp(saved);
  };

  /** The server gives the new app its id (unique, never typed); the slug is its route. */
  public registerApp = async (appData: AppRegistrationInput): Promise<RegisteredApp> => {
    const slug = this.normalizeAppId(appData.slug ?? '');
    if (!slug) throw new Error('The slug (route /app/<slug>) is required');
    const type = appData.type === 'package' ? 'package' : 'remote';
    if (type === 'remote' && !appData.url) throw new Error('Application Remote URL is required');
    return this.saveApp({
      slug,
      name: appData.name || slug,
      type,
      url: type === 'remote' ? (appData.url as string).trim().replace(/\/+$/, '') : undefined,
      package: type === 'package' ? appData.package : undefined,
      description: appData.description || '',
      icon: appData.icon || 'Layers',
      isEnabled: appData.isEnabled ?? true,
    }, true);
  };

  public normalizeAppId = (id: string) => (id || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/^-+|-+$/g, '');

  public updateApp = async (id: string, updates: AppUpdateInput): Promise<RegisteredApp> => {
    // The id is the key and stays; the slug — the route — moves.
    if ((updates as any).id !== undefined && this.normalizeAppId((updates as any).id) !== id) {
      throw new Error(`The id of [${id}] cannot change — change its slug (route) instead.`);
    }
    const { id: _key, ...patch } = updates as AppUpdateInput & { id?: string };
    if (patch.slug !== undefined) patch.slug = this.normalizeAppId(patch.slug) || id;
    if (patch.url) patch.url = patch.url.trim().replace(/\/+$/, '');
    return this.saveApp({ id, ...patch }, false);
  };

  public findAppByRoute = (key: string): RegisteredApp | undefined => {
    const apps = this.getRegisteredApps();
    return apps.find(a => (a.slug || a.id) === key) ?? apps.find(a => a.id === key) ?? apps.find(a => a.code === key);
  };

  public getApp = (appIdOrCode: string): RegisteredApp | undefined => {
    const apps = this.getRegisteredApps();
    return apps.find(a => a.id === appIdOrCode) ?? apps.find(a => a.code === appIdOrCode);
  };

  public appPath = (appIdOrCode: string, subPath = ''): string => {
    const app = this.getApp(appIdOrCode);
    const sub = subPath.replace(/^\/+/, '');
    return `/app/${app?.slug || appIdOrCode}${sub ? `/${sub}` : ''}`;
  };

  public deleteApp = async (id: string): Promise<boolean> => {
    const target = this.getRegisteredApps().find(a => a.id === id);
    if (!target) return false;
    if (target.isSystem) throw new Error(`System application [${id}] cannot be removed.`);
    await this.doAction('apps.registry.remove', { id });
    if (this.$config?.moduleManifest) delete this.$config.moduleManifest[id];
    await this.loadServerApps();
    return true;
  };

  /**
   * Apps this browser registered before the registry moved to the server (localStorage
   * `erp_registered_apps`): sent once to `apps.registry.import` (admin), then the key is kept as
   * `<key>.imported`; and the apps the Shell config declares. Remote apps only — package apps were the
   * server's already.
   */
  public importLocalApps = async (): Promise<{ imported: string[]; skipped: string[] }> => {
    let local: any[] = [];
    try {
      local = JSON.parse(localStorage.getItem(REGISTERED_APPS_STORAGE_KEY) || '[]');
    } catch { /* unreadable: nothing to import */ }
    // Plus the apps the Shell config declares (`registry.apps`) — their URL stays the config's `<id>.url`.
    const configured = this.getConfiguredApps().filter(app => app.type !== 'package').map(app => ({ ...app, url: '' }));
    const candidates = [
      ...(Array.isArray(local) ? local : []).filter(app => app?.id && app.type !== 'package' && app.managedBy !== 'server' && app.url && !['admin', 'workspace'].includes(app.id)),
      ...configured,
    ].filter(app => !this.state.serverApps.some(s => s.id === app.id || s.code === app.id))
      .map(app => ({ ...app, code: app.code ?? app.id }));
    if (!candidates.length) {
      try { localStorage.removeItem(REGISTERED_APPS_STORAGE_KEY); } catch { /* storage blocked */ }
      return { imported: [], skipped: [] };
    }
    const result = await this.doAction('apps.registry.import', { apps: candidates });
    try {
      localStorage.setItem(`${REGISTERED_APPS_STORAGE_KEY}.imported`, JSON.stringify(local));
      localStorage.removeItem(REGISTERED_APPS_STORAGE_KEY);
    } catch { /* storage blocked */ }
    if (result?.imported?.length) await this.loadServerApps();
    return { imported: result?.imported ?? [], skipped: result?.skipped ?? [] };
  };

  public pingApp = async (targetUrl: string): Promise<PingResult> => {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      await fetch(targetUrl, {
        method: 'GET',
        mode: 'no-cors',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return { success: true, latencyMs: Date.now() - start, statusText: 'Online' };
    } catch (err: any) {
      return { 
        success: false, 
        latencyMs: Date.now() - start, 
        statusText: err.name === 'AbortError' ? 'Timeout (3.5s)' : (err.message || 'Offline') 
      };
    }
  };

  // --- 📦 MODULE LIFECYCLE (Unified Activator) ---

  public isModuleInstalled = (id: string): boolean => {
    return this.state.installedModules.has(id);
  };

  public markModuleInstalled = (id: string) => {
    this.state.installedModules.add(id);
  };

  /**
   * 🔗 ESA PROTOCOL: Unified Module Activation
   */
  public resolveModule = async (moduleId: string): Promise<void> => {
    // 1. Singleton Guard: If already installed, skip
    if (this.isModuleInstalled(moduleId)) return;

    // 2. Parallel Loading Guard: If currently loading, wait for it
    if (this.loadingPromises.has(moduleId)) {
      return this.loadingPromises.get(moduleId);
    }

    const loadPromise = (async () => {
      let manifest = this.$config?.moduleManifest || {};
      let moduleUrl = manifest[moduleId];

      if (!moduleUrl) {
        // Fallback: check dynamic registered apps
        const apps = this.getRegisteredApps();
        const found = apps.find(a => a.id === moduleId);
        if (found && found.url) {
          moduleUrl = found.entryUrl || this.formatAppEntryUrl(found.url);
          if (this.$config) {
            if (!this.$config.moduleManifest) this.$config.moduleManifest = {};
            this.$config.moduleManifest[moduleId] = moduleUrl;
          }
        }
      }

      if (!moduleUrl) {
        console.warn(`⚠️ [sys-kernel] No URL manifest found for [${moduleId}].`);
        return;
      }

      try {
        console.log(`🔌 [sys-kernel] Connecting to remote module [${moduleId}] at ${moduleUrl}`);
        
        // 🛰️ ESA PROTOCOL: Runtime ESM Lazy Loading (URL-based)
        const modulePackage = await import(/* @vite-ignore */ moduleUrl);
        const erpModule = modulePackage.default;
        // The key its CSS is scoped to (mfeScopedCssPlugin): written into a build's entry, else its module id.
        this.cssScopes.set(moduleId, String(modulePackage.__sappCssScope ?? erpModule?.id ?? moduleId));

        if (erpModule?.install) {
          // ESA Protocol: Unified Installation via Bridge (same door as in-process modules)
          console.log(`🛠️ [sys-kernel] Installing remote [${moduleId}]...`);
          // Hand the module its Admin registry record so it can honour the configured slug/prefix, name, icon…
          const record = this.getRegisteredApps().find(a => a.id === moduleId) ?? null;
          await this.install(erpModule, { moduleId, basePath: this.appPath(moduleId), app: record });
          this.markModuleInstalled(moduleId);
          console.log(`✅ [sys-kernel] Remote [${moduleId}] installed successfully.`);
        }
      } catch (error) {
        console.error(`🚨 [sys-kernel] Failed to load remote [${moduleId}] from ${moduleUrl}`, error);
        throw error;
      } finally {
        this.loadingPromises.delete(moduleId);
      }
    })();

    this.loadingPromises.set(moduleId, loadPromise);
    return loadPromise;
  };

  private cssScopes = new Map<string, string>();

  public getModuleCssScope = (moduleId: string): string => this.cssScopes.get(moduleId) ?? moduleId;

  private pathListeners: Map<string, PathChangeHandler[]> = new Map();

  /**
   * 🧠 MODULE STATE MANAGEMENT
   * Retrieves or initializes a reactive state container for a specific module.
   */
  public getModuleState = (moduleId: string, defaultState: any = {}) => {
    if (!this.state.moduleStates[moduleId]) {
      this.state.moduleStates[moduleId] = reactive(defaultState);
    }
    return this.state.moduleStates[moduleId];
  };

  /**
   * 🗺️ [sys-kernel] MFE Entry Registration
   */
  public registerModuleEntry = (config: ModuleEntryRegistration) => {
    const comp = this.getComponent(config.entryComponentId);
    if (comp) {
      // 🏛️ STORE RAW: No markRaw or reactivity proxy needed for plain Map
      this.modules.set(config.moduleId, comp);
      console.log(`📡 [sys-kernel] Module entry registered: ${config.moduleId} -> ${config.entryComponentId}`);
    } else {
      console.error(`🚨 [sys-kernel] Failed to register entry for ${config.moduleId}: Component ${config.entryComponentId} not found.`);
    }
  };

  public getModuleEntry = (id: string) => {
    const entry = this.modules.get(id);
    // 🏗️ AUTO-ASYNC RESOLUTION: If entry is a loader function, wrap it.
    if (typeof entry === 'function') {
      return markRaw(defineAsyncComponent(entry as any));
    }
    return entry ? markRaw(entry) : null;
  };

  // --- 🧩 COMPONENT REGISTRY ---

  public registerComponent = (config: ComponentRegistration) => {
    this.components.set(config.id, config.component);
  };

  private componentCache: Map<string, any> = new Map();

  public getComponent = (id: string) => {
    // 🏛️ IDENTITY STABILITY: Return cached wrapper if available
    if (this.componentCache.has(id)) return this.componentCache.get(id);

    const comp = this.components.get(id);
    if (!comp) {
      console.warn(`⚠️ [sys-kernel] Component not found: ${id}`);
      return null;
    }

    let resolvedComp;
    // 🏗️ AUTO-ASYNC RESOLUTION: Standard bridge hand-off
    if (typeof comp === 'function') {
      resolvedComp = markRaw(defineAsyncComponent(comp as any));
    } else {
      resolvedComp = markRaw(comp);
    }

    this.componentCache.set(id, resolvedComp);
    return resolvedComp;
  };

  public skills: SkillRegistration[] = reactive([]);
  public commands: CommandRegistration[] = reactive([]);

  // --- ⚡ SKILLS & COMMANDS REGISTRY ---

  public registerSkill = (config: SkillRegistration) => {
    if (this.skills.find(s => s.id === config.id)) return;
    this.skills.push(config);
    console.log(`✨ [sys-kernel] Skill registered: ${config.id}`);
  };

  public getSkill = (id: string) => {
    return this.skills.find(s => s.id === id);
  };

  public registerCommand = (config: CommandRegistration) => {
    if (this.commands.find(c => c.id === config.id)) return;
    this.commands.push(config);
    console.log(`⌨️ [sys-kernel] Command registered: ${config.id}`);
  };

  /**
   * ⚡ [sys-kernel] Run Global Command (ESA Standard)
   */
  public runCommand = (id: string) => {
    const cmd = this.commands.find(c => c.id === id);
    if (cmd) {
      console.log(`🚀 [sys-kernel] Executing command: ${id}`);
      cmd.handler();
    } else {
      console.warn(`⚠️ [sys-kernel] Command not found: ${id}`);
    }
  };

  // --- 🛰️ NAVIGATION & SYNC ---

  public onPathChange = (moduleId: string, handler: PathChangeHandler) => {
    const listeners = this.pathListeners.get(moduleId) || [];
    listeners.push(handler);
    this.pathListeners.set(moduleId, listeners);
  };

  public runPathAction = (moduleId: string, path: string) => {
    console.log(`📡 [sys-kernel] Routing action for ${moduleId}: ${path}`);
    const listeners = this.pathListeners.get(moduleId);
    if (listeners) {
      listeners.forEach(handler => handler(path));
    }
  };
}
