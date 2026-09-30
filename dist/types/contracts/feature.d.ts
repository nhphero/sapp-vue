/**
 * 🧩 Feature Contracts
 * A mini app is composed of features. Each feature is installed like a Vue plugin
 * (`install(ctx)`) and registers its routes and components through `MiniAppContext`,
 * which namespaces ids by module.
 */
import type { App } from 'vue';
import type { ISuperApp } from './kernel';
import type { RegisteredApp } from './registry';
import type { LocaleMessages, TranslateParams } from './i18n';
import type { ComponentRegistration, ComponentSource } from './registry';
export interface FeatureRouteMeta {
    /** Label used by layouts for navigation. */
    title?: string;
    /** Show this route in the module navigation. */
    nav?: boolean;
    icon?: any;
    order?: number;
    [key: string]: any;
}
export interface FeatureRoute {
    /**
     * Path relative to the module root, without leading slash.
     * Supports `:param`, optional `:param?` and a trailing `*` catch-all.
     * `''` is the module index route.
     */
    path: string;
    name?: string;
    component: ComponentSource;
    /** `true` passes route params as props to the component. */
    props?: boolean;
    meta?: FeatureRouteMeta;
}
export interface ResolvedFeatureRoute extends FeatureRoute {
    featureId: string;
    /** Absolute Shell path, e.g. `/app/mini/settings/:id?`. */
    fullPath: string;
}
export interface FeatureRouteMatch {
    /** Sub-path the Shell delivered through `onPathChange`. */
    path: string;
    route: ResolvedFeatureRoute | null;
    params: Record<string, string>;
}
export interface IFeatureRouter {
    /** Id the bundle was authored with (`createMiniApp({ id })`). */
    readonly moduleId: string;
    /** Id the Shell currently mounts the bundle under (registry id); drives `/app/<mountId>/…` hrefs. */
    readonly mountId: string;
    setMountId(id: string): void;
    readonly routes: ResolvedFeatureRoute[];
    /** Reactive: mutated in place on every path change. */
    readonly current: FeatureRouteMatch;
    addRoute(featureId: string, route: FeatureRoute): ResolvedFeatureRoute;
    resolve(subPath: string): FeatureRouteMatch;
    /** Navigate through the Shell router (`/app/<moduleId>/<subPath>`). */
    push(subPath: string): void;
    /** Build the absolute href for a sub-path. */
    href(subPath: string): string;
    /** Apply a sub-path delivered by the Shell (called by createMiniApp). */
    sync(subPath: string): FeatureRouteMatch;
    /** Concrete sub-path of a route for navigation (optional params and catch-all removed). */
    pathOf(route: FeatureRoute): string;
}
/**
 * ONE context for a mini app. `setup(ctx)` gets it, every `install(ctx)` gets it, and a view
 * reads the same shape back from its own `useApp()` — there is no second "feature context" to
 * learn, because a feature is not a smaller kind of app, it is a folder of this app's routes.
 *
 * The object a feature receives is this context with `featureId` filled in and `registerRoute`
 * bound to that feature; everything else is the same. Registration is install-time work — a view
 * holds the same object but has nothing to register.
 *
 * `registerSkill` / `registerCommand` are deliberately absent: the Shell's sidebar and ⌘K palette
 * are shared surfaces, and a mini app does not write into them (see demo-app/.rules/structure.md).
 * A Shell feature has its own `ShellFeatureContext`, which does have them.
 */
export interface MiniAppContext {
    app: App;
    superApp: ISuperApp;
    /** Id the bundle was authored with. */
    moduleId: string;
    /** Id the Shell mounted the bundle under (registry slug). */
    mountId: string;
    /** `/app/<mountId>` */
    basePath: string;
    /** Registry record from Admin → Application Registry, or null when mounted from a static manifest. */
    config: RegisteredApp | null;
    router: IFeatureRouter;
    /** The feature currently installing; absent in `setup()` and outside install time. */
    featureId?: string;
    /** Register a route under the installing feature. */
    registerRoute(route: FeatureRoute): ResolvedFeatureRoute;
    /** Register a component as `<moduleId>.<id>`; returns the full id. */
    registerComponent(config: ComponentRegistration): string;
    /** Register a component with the exact id given (shared/global ids such as `integration.form.sql`). */
    registerGlobalComponent(config: ComponentRegistration): string;
    /**
     * Register translations for this mini app. Prefer `createMiniApp({ messages })` — one JSON file
     * per app, registered once (see demo-app/.rules/i18n.md); this stays for the rare late addition.
     */
    registerMessages(messages: LocaleMessages, namespace?: string): void;
    /** Translate with the module namespace first (`t('title')` → `<moduleId>.title`), then the raw key. */
    t(key: string, params?: TranslateParams & {
        default?: string;
    }): string;
    /** `app.provide` shorthand. */
    provide<T>(key: string | symbol, value: T): void;
}
export interface IMfeFeature {
    /** Unique within the mini app. */
    id: string;
    name?: string;
    install(ctx: MiniAppContext): void | Promise<void>;
}
export interface MiniAppOptions {
    id: string;
    name: string;
    aliases?: string[];
    features: IMfeFeature[];
    /**
     * Root component rendered by the Shell for this module. Defaults to a bare
     * `FeatureView`. A custom layout normally renders navigation + `<FeatureView />`.
     */
    layout?: ComponentSource;
    /** Runs once before features are installed (provide global state, register `$c`...). */
    setup?(ctx: MiniAppContext): void | Promise<void>;
    /** Translations registered under the module namespace before features install. */
    messages?: LocaleMessages;
    /**
     * Sub-path opened when the app is reached at its root (`/app/<id>`), e.g. `'projects'`. The URL is
     * replaced, so the address bar, the active menu tab and the back button all reflect the real page.
     * Omit it and the root renders whatever route is registered at `''`.
     */
    defaultPath?: string;
}
/** Injection keys provided by createMiniApp. */
export declare const MINI_APP_ROUTER_KEY: "$miniRouter";
export declare const MINI_APP_CONTEXT_KEY: "$miniApp";
//# sourceMappingURL=feature.d.ts.map