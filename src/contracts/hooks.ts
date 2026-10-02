/**
 * 🪝 Hooks — `superApp.$hook` (template `$hook`): the extension points packages plug into.
 *
 * Three kinds:
 * - **Slots** — places in the Shell's UI where a component goes: a button right of the menu, an item in
 *   the user menu, a drawer over everything. `add(slot, { id, component })`; the theme renders each slot
 *   with `<component :is="$c('shell.hook-slot')" name="…" />`.
 * - **Events** — things that happen: the Shell loaded, a mini app mounted, an API call failed.
 *   `on(event, handler)`; the kernel and the theme `emit` them.
 * - **Providers** — capabilities a package offers to everyone: a viewer / editor for a kind of file
 *   (`file.viewer`). `provide(capability, { id, match, component })`; a consumer asks `resolve(capability, input)`.
 *
 * A **plugin** (a package of type `plugin`, enabled in Admin → Plugins) is a module whose default export is
 * `definePlugin({ id, install(ctx) })`; the Shell loads every enabled plugin at start, hands it a scoped
 * `ctx.hook` (everything it registers goes when the plugin is turned off) and its `ctx.config` (the
 * values an admin set, reactive — a save reaches the running plugin).
 */
import type { Component } from 'vue';

/** Slots the Shell themes render. A theme may add its own; a missing slot simply shows nothing. */
export const HOOK_SLOTS = {
  /** Header, after the logo / app switcher (left side). */
  HEADER_START: 'shell.header.start',
  /** Header, right side, before language and the user menu. */
  HEADER_END: 'shell.header.end',
  /** The end of the app's menu (the band's right end, or the header's right in the sidebar layout). */
  MENU_END: 'shell.menu.end',
  /** Items in the user menu, above Sign out. */
  USER_MENU: 'shell.user-menu',
  /** The bottom of the sidebar (sidebar layout). */
  SIDEBAR_BOTTOM: 'shell.sidebar.bottom',
  /** Under every page. */
  FOOTER: 'shell.footer',
  /** Mounted once over everything — drawers, floating panels, toasts of a plugin. */
  OVERLAY: 'shell.overlay',
} as const;

/** Events the kernel and the themes emit. Packages may emit their own (namespace them: `chat.message`). */
export const HOOK_EVENTS = {
  /** The Shell mounted (once). Payload: `{ superApp }`. */
  APP_LOAD: 'app.load',
  /** A mini app mounted in the Shell. Payload: `{ appId, moduleId }`. */
  APP_MOUNT: 'app.mount',
  /** A navigation finished. Payload: `{ to, from }` (route locations). */
  ROUTE_CHANGE: 'route.change',
  /** An HTTP call through `createApi` failed. Payload: the `ApiClientError`. */
  API_ERROR: 'api.error',
  /** The user signs out (before the token is dropped). */
  AUTH_LOGOUT: 'auth.logout',
  /** The language changed. Payload: `{ locale, previous }`. */
  LOCALE_CHANGE: 'locale.change',
  /** A plugin's config changed (an admin saved it). Payload: `{ id, config }`. */
  PLUGIN_CONFIG: 'plugin.config',
} as const;

/** Capabilities known to the themes. */
export const HOOK_PROVIDERS = {
  /** View / edit a file: `match(file)`, component props `{ file, mode: 'view' | 'edit' }` (theme `display.file`). */
  FILE_VIEWER: 'file.viewer',
} as const;

/** One component in a slot. */
export interface HookSlotEntry {
  /** Unique in its slot; adding the same id again replaces it. */
  id: string;
  component: Component;
  /** Props given to the component. */
  props?: Record<string, unknown>;
  /** Lower first (default 100). */
  order?: number;
  /** Shown only while it returns true (reactive — read reactive state inside). */
  when?: () => boolean;
  /** Who added it (set by a plugin's scoped hook). */
  owner?: string;
}

/** One provider of a capability. */
export interface HookProvider<I = any> {
  id: string;
  /** Takes the input (a file…)? Missing = takes everything. */
  match?: (input: I) => boolean;
  /** Higher wins among those that match (default 0). */
  priority?: number;
  component?: Component;
  /** Anything else the capability defines (a label, an icon, a function…). */
  [key: string]: unknown;
}

/** A file handed to `display.file` / a `file.viewer` provider. */
export interface HookFile {
  name: string;
  url: string;
  /** MIME type, if known. */
  type?: string;
  size?: number;
}

export type HookHandler<P = any> = (payload: P) => void | Promise<void>;

export interface IHooks {
  // ── slots ──
  /** Puts a component in a slot; returns the function that takes it out. */
  add(slot: string, entry: HookSlotEntry): () => void;
  remove(slot: string, id: string): void;
  /** The entries of a slot, ordered, `when` applied (reactive — use in a render / computed). */
  entries(slot: string): HookSlotEntry[];

  // ── events ──
  /** Listens; returns the function that stops listening. */
  on<P = any>(event: string, handler: HookHandler<P>): () => void;
  off(event: string, handler: HookHandler): void;
  /** Calls every listener (in order, each awaited; one that throws does not stop the others). */
  emit<P = any>(event: string, payload?: P): Promise<void>;

  // ── providers ──
  /** Offers a capability; returns the function that withdraws it. */
  provide<I = any>(capability: string, provider: HookProvider<I>): () => void;
  /** Every provider of a capability, highest priority first (reactive). */
  providers<I = any>(capability: string): HookProvider<I>[];
  /** The best provider that takes `input`, or null. */
  resolve<I = any>(capability: string, input: I): HookProvider<I> | null;

  /**
   * The same API, recording everything registered through it under `owner`; `dispose()` undoes it all.
   * Plugins get one (a plugin turned off leaves nothing behind).
   */
  scope(owner: string): IHooks & { dispose(): void };
}

/** What a plugin's `install` gets. */
export interface PluginContext<C extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  /** Scoped to this plugin. */
  hook: IHooks;
  /** The values an admin set in Admin → Plugins (reactive; `secret` fields stay on the server). */
  config: C;
  superApp: import('./kernel').ISuperApp;
}

/** A plugin field shown in Admin → Plugins (from the package's manifest.json `plugin.config`). */
export interface PluginConfigField {
  key: string;
  label?: string;
  type?: 'text' | 'url' | 'number' | 'boolean' | 'select' | 'secret' | 'textarea';
  default?: unknown;
  description?: string;
  required?: boolean;
  /** For `select`. */
  options?: Array<{ value: string; label?: string }>;
}

export interface PluginDefinition<C extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  name?: string;
  install(ctx: PluginContext<C>): void | Promise<void>;
  /** Called when the plugin is turned off (its hooks are removed anyway). */
  uninstall?(ctx: PluginContext<C>): void | Promise<void>;
}

/** Identity helper with types: `export default definePlugin({ id: 'chat', install(ctx) { … } })`. */
export function definePlugin<C extends Record<string, unknown> = Record<string, unknown>>(plugin: PluginDefinition<C>): PluginDefinition<C> {
  return plugin;
}

/** A plugin the server says to load (discovery `plugins`). */
export interface PluginDescriptor {
  id: string;
  package: string;
  /** The concrete version (its files on the server) — unless `url` is set. */
  version?: string | null;
  /** A URL of its own (a dev server, another host) instead of the package files. */
  url?: string | null;
  config?: Record<string, unknown>;
}
