/**
 * 🏛️ Shell (master app) composition contracts.
 * `createSapp()` boots the whole Shell — Vue app, Pinia, router, MF bridge, discovery, protocols,
 * kernel, theme, business modules — and the Shell's own code only registers *features*.
 */
import type { App, Component } from 'vue';
import type { Router, RouteRecordRaw } from 'vue-router';
import type { Pinia } from 'pinia';
import type { ISuperApp, BrandingOptions } from './kernel';
import type { ITheme } from './theme';
import type { IDiscoveryService } from './discovery';
import type { IApiProtocol, ISocketProtocol } from './transport';
import type { ModuleManifest, ComponentRegistration, SkillRegistration, CommandRegistration } from './registry';
import type { I18nOptions, LocaleMessages } from './i18n';

/** Everything created by the boot sequence, handed to modules, features and the caller. */
export interface SappContext {
  app: App;
  router: Router;
  pinia: Pinia;
  superApp: ISuperApp;
  discovery: IDiscoveryService;
  api: IApiProtocol;
  socket: ISocketProtocol;
}

export interface ShellFeatureContext extends SappContext {
  featureId: string;
  /** Add a page under the Shell layout (`/<path>`). */
  registerRoute(route: RouteRecordRaw): void;
  /** Add a top-level route outside the layout (e.g. a public page). */
  registerTopRoute(route: RouteRecordRaw): void;
  registerComponent(config: ComponentRegistration): void;
  registerSkill(config: SkillRegistration): void;
  registerCommand(config: CommandRegistration): void;
  /** Register translations (`{ en: {...}, vi: {...} }`), optionally under a namespace. */
  registerMessages(messages: LocaleMessages, namespace?: string): void;
  provide<T>(key: string | symbol, value: T): void;
}

/** A unit of the Shell (pages, components, skills) installed like a Vue plugin. */
export interface IShellFeature {
  id: string;
  name?: string;
  install(ctx: ShellFeatureContext): void | Promise<void>;
}

export function defineShellFeature<T extends IShellFeature>(feature: T): T {
  return feature;
}

export interface SappOptions {
  /** Root component (App.vue). */
  root: Component;
  /** Layout wrapping every page route (`/`); defaults to a bare `<RouterView>`. */
  layout?: Component;
  theme: ITheme;
  /** Design tokens exposed as `superApp.$theme` / `provide('$theme')`. */
  tokens?: any;
  /** Static module manifest merged under discovery (`<id>.url`). */
  manifest?: ModuleManifest;
  /** Install in-process business modules once protocols exist: `await ctx.superApp.install(new AuthModule(ctx.api))`. */
  modules?: (ctx: SappContext) => void | Promise<void>;
  features?: IShellFeature[];
  /** Additional top-level routes. */
  routes?: RouteRecordRaw[];
  api?: { baseUrl?: string };
  socket?: { url?: string };
  router?: { base?: string };
  auth?: {
    /** localStorage key holding the access token (default `accessToken`). */
    tokenKey?: string;
    /** Registry id of the login page component (default `auth.login`). */
    loginComponentId?: string;
    loginPath?: string;
  };
  discovery?: IDiscoveryService;
  /** Translation setup: default locale, fallback and Shell-level messages. */
  i18n?: I18nOptions;
  /** Default currency for `$f.formatMoney()` (default `VND`). A call site can still override it. */
  currency?: string;
  /** Logo / name shown by the theme; also sets the favicon and document title. */
  branding?: BrandingOptions;
}

export interface ISapp extends SappContext {
  /** Install the router and mount the app (default selector `#app`). */
  mount(selector?: string | Element): App;
}
