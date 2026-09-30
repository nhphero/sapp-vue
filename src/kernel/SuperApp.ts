import { 
  reactive, markRaw, ref, computed, watch, watchEffect, nextTick, 
  defineAsyncComponent, shallowRef, triggerRef, onMounted, onUnmounted, 
  defineComponent, h, provide, inject, type App 
} from 'vue';
import type { Router } from 'vue-router';
import { useLocalStorage } from '@vueuse/core';
import { createAuthState } from '../services/auth';
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
} from '../contracts';
import { REGISTERED_APPS_STORAGE_KEY, HIDDEN_DEFAULT_APPS_STORAGE_KEY, SUPERAPP_EVENTS } from '../contracts';

/** @deprecated Use `KernelInitOptions` from `@nhphero/vue-sapp` contracts. */
export type AppConfig = KernelInitOptions;

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
    this.$config = config.config ?? null;
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

  private getDefaultApps = (): RegisteredApp[] => {
    const isDev = (import.meta as any).env?.DEV ?? true;
    const adminBase = (this.state.discovery?.['admin.url'] || (import.meta as any).env?.VITE_ADMIN_URL || 'http://localhost:4403').replace(/\/+$/, '');
    const workspaceBase = (this.state.discovery?.['workspace.url'] || (import.meta as any).env?.VITE_WORKSPACE_URL || 'http://localhost:4409').replace(/\/+$/, '');

    return [
      ...this.getConfiguredApps(),
      {
        id: 'workspace',
        name: 'Workspace Hub',
        url: workspaceBase,
        entryUrl: workspaceBase.endsWith('.js') || workspaceBase.endsWith('.ts') ? workspaceBase : `${workspaceBase}${isDev ? '/src/index.ts' : '/index.js'}`,
        description: 'Logic Orchestration & Flow Designer',
        icon: 'Globe',
        isSystem: true,
        isEnabled: true,
        updatedAt: new Date().toISOString()
      },
      {
        id: 'admin',
        name: 'Admin Management',
        url: adminBase,
        entryUrl: adminBase.endsWith('.js') || adminBase.endsWith('.ts') ? adminBase : `${adminBase}${isDev ? '/src/index.ts' : '/index.js'}`,
        description: 'Platform Governance & Applications Registry',
        icon: 'Shield',
        isSystem: true,
        isEnabled: true,
        updatedAt: new Date().toISOString()
      }
    ];
  };

  /**
   * Apps declared by the Shell's config (`config.json` / discovery) under `registry.apps`:
   * `[{ id, name, description?, icon? }]`, each mounted from its `<id>.url` entry. They join the
   * defaults, so a new mini app is listed by configuration — no code change, no per-browser setup.
   */
  private getConfiguredApps = (): RegisteredApp[] => {
    const isDev = (import.meta as any).env?.DEV ?? true;
    const declared = this.state.discovery?.['registry.apps'];
    if (!Array.isArray(declared)) return [];
    return declared
      .filter((app: any) => app?.id && typeof this.state.discovery?.[`${app.id}.url`] === 'string')
      .map((app: any): RegisteredApp => {
        const base = String(this.state.discovery[`${app.id}.url`]).replace(/\/+$/, '');
        return {
          id: String(app.id),
          name: app.name || String(app.id),
          url: base,
          entryUrl: base.endsWith('.js') || base.endsWith('.ts') ? base : `${base}${isDev ? '/src/index.ts' : '/index.js'}`,
          description: app.description || '',
          icon: app.icon || 'Layers',
          isSystem: true,
          isEnabled: app.isEnabled ?? true,
          updatedAt: new Date().toISOString(),
        };
      });
  };

  public getRegisteredApps = (): RegisteredApp[] => {
    try {
      const stored = localStorage.getItem(REGISTERED_APPS_STORAGE_KEY);
      const defaults = this.getDefaultApps();
      if (!stored) {
        localStorage.setItem(REGISTERED_APPS_STORAGE_KEY, JSON.stringify(defaults));
        return defaults;
      }
      const parsed: RegisteredApp[] = JSON.parse(stored);
      if (!Array.isArray(parsed)) return defaults;

      // Merge defaults if missing (unless the user renamed that default away)
      const hidden = this.getHiddenDefaults();
      defaults.forEach(def => {
        const found = parsed.find(a => a.id === def.id);
        if (!found) {
          if (!hidden.has(def.id)) parsed.unshift(def);
        } else {
          found.isSystem = true;
          if (!found.entryUrl) found.entryUrl = this.formatAppEntryUrl(found.url);
        }
      });
      return parsed;
    } catch (err) {
      console.error('Failed to read registered apps from storage:', err);
      return this.getDefaultApps();
    }
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

    const apps = this.getRegisteredApps();
    apps.forEach(app => {
      if (app.id && app.url && app.isEnabled !== false) {
        const entry = app.entryUrl || this.formatAppEntryUrl(app.url);
        manifest[app.id] = entry;
        if (app.id === 'workspace') {
          manifest['expose'] = entry;
        }
      }
    });
  };

  public registerApp = (appData: AppRegistrationInput): RegisteredApp => {
    const rawId = this.normalizeAppId(appData.id);
    if (!rawId) throw new Error('Application ID is required');
    if (!appData.url) throw new Error('Application Remote URL is required');

    const apps = this.getRegisteredApps();
    const entryUrl = this.formatAppEntryUrl(appData.url);
    const existingIndex = apps.findIndex(a => a.id === rawId);

    const newApp: RegisteredApp = {
      id: rawId,
      name: appData.name || rawId,
      url: appData.url.trim().replace(/\/+$/, ''),
      entryUrl,
      description: appData.description || '',
      icon: appData.icon || 'Layers',
      isEnabled: appData.isEnabled ?? true,
      isSystem: existingIndex >= 0 ? !!apps[existingIndex].isSystem : false,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      apps[existingIndex] = { ...apps[existingIndex], ...newApp };
    } else {
      apps.push(newApp);
    }

    localStorage.setItem(REGISTERED_APPS_STORAGE_KEY, JSON.stringify(apps));
    this.syncManifestWithRegisteredApps();
    this.emit(SUPERAPP_EVENTS.APPS_UPDATED, apps);
    return newApp;
  };

  private getHiddenDefaults = (): Set<string> => {
    try { return new Set<string>(JSON.parse(localStorage.getItem(HIDDEN_DEFAULT_APPS_STORAGE_KEY) || '[]')); } catch { return new Set(); }
  };

  public normalizeAppId = (id: string) => (id || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/^-+|-+$/g, '');

  public updateApp = (id: string, updates: AppUpdateInput): RegisteredApp => {
    const apps = this.getRegisteredApps();
    const index = apps.findIndex(a => a.id === id);
    if (index === -1) throw new Error(`App [${id}] not found`);

    const app = apps[index];
    const patch: AppUpdateInput = { ...updates };
    if (patch.url) {
      patch.url = patch.url.trim().replace(/\/+$/, '');
      (patch as any).entryUrl = this.formatAppEntryUrl(patch.url);
    }

    // 🔁 Rename: new slug becomes the route key (/app/<id>) and manifest key
    const nextId = patch.id !== undefined ? this.normalizeAppId(patch.id) : id;
    if (patch.id !== undefined && !nextId) throw new Error('Application ID is required');
    if (nextId !== id) {
      if (apps.some(a => a.id === nextId)) throw new Error(`App [${nextId}] already exists`);
      if (this.$config?.moduleManifest) delete this.$config.moduleManifest[id];
      if (app.isSystem) {
        const hidden = this.getHiddenDefaults(); hidden.add(id);
        localStorage.setItem(HIDDEN_DEFAULT_APPS_STORAGE_KEY, JSON.stringify([...hidden]));
      }
      this.state.installedModules.delete(id);
      console.log(`🔁 [sys-kernel] App renamed: ${id} -> ${nextId}`);
    }
    patch.id = nextId;

    apps[index] = { ...app, ...patch, updatedAt: new Date().toISOString() };
    localStorage.setItem(REGISTERED_APPS_STORAGE_KEY, JSON.stringify(apps));
    this.syncManifestWithRegisteredApps();
    this.emit(SUPERAPP_EVENTS.APPS_UPDATED, apps);
    return apps[index];
  };

  public deleteApp = (id: string): boolean => {
    const apps = this.getRegisteredApps();
    const target = apps.find(a => a.id === id);
    if (!target) return false;
    if (target.isSystem) {
      throw new Error(`System application [${id}] cannot be removed.`);
    }

    const filtered = apps.filter(a => a.id !== id);
    localStorage.setItem(REGISTERED_APPS_STORAGE_KEY, JSON.stringify(filtered));
    if (this.$config?.moduleManifest) {
      delete this.$config.moduleManifest[id];
    }
    this.emit(SUPERAPP_EVENTS.APPS_UPDATED, filtered);
    return true;
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

        if (erpModule?.install) {
          // ESA Protocol: Unified Installation via Bridge (same door as in-process modules)
          console.log(`🛠️ [sys-kernel] Installing remote [${moduleId}]...`);
          // Hand the module its Admin registry record so it can honour the configured slug/prefix, name, icon…
          const record = this.getRegisteredApps().find(a => a.id === moduleId) ?? null;
          await this.install(erpModule, { moduleId, basePath: `/app/${moduleId}`, app: record });
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
