import type { IFeatureRouter, MiniAppSetupContext } from '../contracts';
/** Feature router of the current mini app (navigation, current route, nav routes). */
export declare function useMiniRouter(): IFeatureRouter;
/** Translation service of the Shell plus a `t()` that tries the module namespace first. */
export declare function useI18n(): {
    i18n: import("..").II18n;
    t: (key: string, params?: any) => string;
    readonly locale: string;
    setLocale: (l: string) => void;
};
/** `{ app, superApp, moduleId, router }` of the current mini app. */
export declare function useMiniApp(): MiniAppSetupContext;
//# sourceMappingURL=composables.d.ts.map