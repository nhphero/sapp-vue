import { reactive, markRaw, ref, watch, watchEffect, nextTick, defineAsyncComponent, shallowRef, triggerRef, defineComponent, h, provide, inject, type App } from 'vue';
import type { Router } from 'vue-router';
import { useLocalStorage } from '@vueuse/core';
import type { ISuperApp, ISuperAppModule, SappInstallable, IProtocol, KernelInitOptions, KernelConfig, KernelState, ComponentRegistration, SkillRegistration, CommandRegistration, ModuleEntryRegistration, PathChangeHandler, RegisteredApp, AppRegistrationInput, AppUpdateInput, PingResult, IAppState } from '../contracts';
/** @deprecated Use `KernelInitOptions` from `@nhphero/vue-sapp` contracts. */
export type AppConfig = KernelInitOptions;
export declare class SuperApp implements ISuperApp {
    [dynamic: `$${string}`]: any;
    private modules;
    private components;
    private _protocols;
    private _modules;
    private _eventHandlers;
    state: KernelState;
    private loadingPromises;
    $app: App | null;
    $router: Router | null;
    $config: KernelConfig | null;
    $theme: any;
    $toast: any;
    $message: any;
    $dialog: any;
    $api: any;
    $appState: IAppState | null;
    constructor();
    on: (event: string, handler: Function) => void;
    emit: (event: string, data?: any) => void;
    off: (event: string, handler: Function) => void;
    isModuleActive: (id: string) => boolean;
    setModuleEnabled: (id: string, state: boolean) => void;
    registerProtocol: (id: string, instance: IProtocol) => void;
    registerBusinessModule: (id: string, instance: ISuperAppModule | any) => void;
    registerModule: (id: string, instance: ISuperAppModule) => void;
    /**
     * 🔌 Install a module, Vue-plugin style. The kernel is the subject: `superApp.install(module)`.
     * `install(superApp)` → business module · `install(app, superApp)` → MFE-style module · function → called with the kernel.
     */
    install: (plugin: SappInstallable, ...options: any[]) => Promise<ISuperApp>;
    getProtocol: <T = any>(id: string) => T | undefined;
    getModule: <T = any>(id: string) => T | undefined;
    /**
     * ⚡ [sys-kernel] Invoke a SuperApp Action via the default API Bridge
     */
    doAction: <T = any>(action: string, params?: any) => Promise<T>;
    /**
     * 🏗️ ESA PLATFORM CORE: Unified Framework Context
     * Exposing Vue's reactive core to MFEs to ensure a single unified runtime.
     */
    $vue: {
        ref: typeof ref;
        reactive: typeof reactive;
        computed: typeof import("@vue/reactivity").computed;
        watch: typeof watch;
        watchEffect: typeof watchEffect;
        nextTick: typeof nextTick;
        markRaw: typeof markRaw;
        defineAsyncComponent: typeof defineAsyncComponent;
        shallowRef: typeof shallowRef;
        triggerRef: typeof triggerRef;
        onMounted: (hook: any, target?: import("vue").ComponentInternalInstance | null) => void;
        onUnmounted: (hook: any, target?: import("vue").ComponentInternalInstance | null) => void;
        defineComponent: typeof defineComponent;
        h: typeof h;
        provide: typeof provide;
        inject: typeof inject;
        useLocalStorage: typeof useLocalStorage;
    };
    init: (config: KernelInitOptions) => void;
    formatAppEntryUrl: (url: string) => string;
    private getDefaultApps;
    getRegisteredApps: () => RegisteredApp[];
    syncManifestWithRegisteredApps: () => void;
    registerApp: (appData: AppRegistrationInput) => RegisteredApp;
    private getHiddenDefaults;
    normalizeAppId: (id: string) => string;
    updateApp: (id: string, updates: AppUpdateInput) => RegisteredApp;
    deleteApp: (id: string) => boolean;
    pingApp: (targetUrl: string) => Promise<PingResult>;
    isModuleInstalled: (id: string) => boolean;
    markModuleInstalled: (id: string) => void;
    /**
     * 🔗 ESA PROTOCOL: Unified Module Activation
     */
    resolveModule: (moduleId: string) => Promise<void>;
    private pathListeners;
    /**
     * 🧠 MODULE STATE MANAGEMENT
     * Retrieves or initializes a reactive state container for a specific module.
     */
    getModuleState: (moduleId: string, defaultState?: any) => any;
    createApi: (_baseUrl: string) => any;
    /**
     * 🗺️ [sys-kernel] MFE Entry Registration
     */
    registerModuleEntry: (config: ModuleEntryRegistration) => void;
    getModuleEntry: (id: string) => any;
    registerComponent: (config: ComponentRegistration) => void;
    private componentCache;
    getComponent: (id: string) => any;
    skills: SkillRegistration[];
    commands: CommandRegistration[];
    registerSkill: (config: SkillRegistration) => void;
    getSkill: (id: string) => SkillRegistration | undefined;
    registerCommand: (config: CommandRegistration) => void;
    /**
     * ⚡ [sys-kernel] Run Global Command (ESA Standard)
     */
    runCommand: (id: string) => void;
    onPathChange: (moduleId: string, handler: PathChangeHandler) => void;
    runPathAction: (moduleId: string, path: string) => void;
}
//# sourceMappingURL=SuperApp.d.ts.map