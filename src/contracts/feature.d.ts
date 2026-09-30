/**
 * 🧩 Feature Contracts
 * A mini app is composed of features. Each feature is installed like a Vue
 * plugin (`install(ctx)`) and registers its routes, components, skills and
 * commands through the FeatureContext, which namespaces ids by module.
 */
import type { App } from 'vue';
import type { ISuperApp } from './kernel';
import type { CommandRegistration, ComponentRegistration, ComponentSource, SkillRegistration } from './registry';
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
    readonly moduleId: string;
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
}
export interface FeatureContext {
    app: App;
    superApp: ISuperApp;
    moduleId: string;
    featureId: string;
    router: IFeatureRouter;
    /** Register a route under this feature. */
    registerRoute(route: FeatureRoute): ResolvedFeatureRoute;
    /** Register a component as `<moduleId>.<id>`; returns the full id. */
    registerComponent(config: ComponentRegistration): string;
    /** Register a component with the exact id given (shared/global ids such as `integration.form.sql`). */
    registerGlobalComponent(config: ComponentRegistration): string;
    /** Register a skill as `<moduleId>.<id>`; `handler` defaults to navigating to `route` when given. */
    registerSkill(config: Omit<SkillRegistration, 'handler'> & {
        handler?: SkillRegistration['handler'];
        route?: string;
    }): string;
    /** Register a command as `<moduleId>.<id>`. */
    registerCommand(config: CommandRegistration): string;
    /** `app.provide` shorthand. */
    provide<T>(key: string | symbol, value: T): void;
}
export interface IMfeFeature {
    /** Unique within the mini app. */
    id: string;
    name?: string;
    install(ctx: FeatureContext): void | Promise<void>;
}
export declare function defineFeature<T extends IMfeFeature>(feature: T): T;
export interface MiniAppSetupContext {
    app: App;
    superApp: ISuperApp;
    moduleId: string;
    router: IFeatureRouter;
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
    setup?(ctx: MiniAppSetupContext): void | Promise<void>;
}
/** Injection keys provided by createMiniApp. */
export declare const MINI_APP_ROUTER_KEY: "$miniRouter";
export declare const MINI_APP_CONTEXT_KEY: "$miniApp";
//# sourceMappingURL=feature.d.ts.map