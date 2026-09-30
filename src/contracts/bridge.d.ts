/**
 * 🌉 MF Bridge Contract (Operation Bridge of Truth)
 * The Shell publishes its framework singletons on `globalThis.__MF_BRIDGE__`;
 * MFEs resolve `vue`, `pinia`, `vue-router` through it so every bundle shares
 * one reactivity runtime.
 */
export interface MfBridge {
    Vue: typeof import('vue');
    Pinia: typeof import('pinia');
    VueRouter: typeof import('vue-router');
    VueUse?: typeof import('@vueuse/core');
    [extra: string]: any;
}
export declare const MF_BRIDGE_GLOBAL: "__MF_BRIDGE__";
export declare const SUPERAPP_GLOBAL: "$superApp";
declare global {
    interface Window {
        __MF_BRIDGE__?: MfBridge;
        $superApp?: any;
    }
}
//# sourceMappingURL=bridge.d.ts.map