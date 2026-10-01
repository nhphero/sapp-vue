/**
 * 🎨 Theme Contract
 * A theme registers the Shell UI (layout, providers, UI kit) into the kernel
 * component registry and creates the UI services the kernel exposes as
 * `$message` (toasts + alert/confirm/prompt) and `$dialog`.
 */
import type { App } from 'vue';
import type { ISuperApp } from './kernel';
import type { IAppState } from './app-state';
import type { DialogService, MessageService } from './ui';

export interface ThemeServices {
  messageService: MessageService;
  dialogService: DialogService;
  appState: IAppState;
  /** Live customization service, also exposed as `superApp.$themeConfig`. */
  themeConfig?: IThemeConfig;
  /** Store backing toasts/messages/dialogs, provided by createSapp as `ui-store`. */
  uiStore?: any;
}

export interface ITheme {
  id: string;
  name: string;
  /**
   * Register components, services and global properties.
   * Must run BEFORE business modules and mini apps are installed so that
   * `ui.*`, `form.*`, `layout.*` ids resolve.
   */
  register(app: App, superApp: ISuperApp, context?: { uiStore?: any }): ThemeServices;
}

/** Component ids every theme is expected to register. */
export const THEME_COMPONENT_IDS = {
  header: 'layout.header',
  sidebar: 'layout.sidebar',
  modulePage: 'layout.module-page',
  moduleHeader: 'layout.module-header',
  commandPalette: 'layout.command-palette',
  themeConnector: 'ThemeConnector',
  toastContainer: 'ToastContainer',
  messageProvider: 'MessageProvider',
  dialogProvider: 'DialogProvider',
  themePanel: 'layout.theme-panel',
} as const;

// --- Live theme customization (color · size · shape), applied as CSS variables on :root ---

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfigState {
  /** Colour scheme. */
  mode: ThemeMode;
  /** Brand colour (#rrggbb). Empty = the tokens.css default. A full 50→950 scale is derived from it. */
  brand: string;
  /** Text scale multiplier (1 = tokens.css sizes). Also scales component sizes. */
  font: number;
  /** Extra spacing multiplier on top of `font` (0.9 compact · 1 default · 1.1 spacious). */
  density: number;
  /** Named font stack (see `fontStacks`) or a font family name. Empty = system UI. */
  fontFamily: string;
  /** Base corner radius in px (buttons/inputs); sm/lg are derived. */
  radius: number;
  /** Shadow intensity 0 (flat) → 2. */
  shadow: number;
  /** Page surface preset id (see `surfaces`). Empty = the tokens.css default. */
  surface: string;
}

export interface IThemeConfig {
  /** Reactive current state (mutate through `set`). */
  readonly state: ThemeConfigState;
  /** Reactive: whether the customization panel is open. */
  open: boolean;
  readonly defaults: Readonly<ThemeConfigState>;
  readonly swatches: ReadonlyArray<{ name: string; hex: string }>;
  readonly fontStacks: Readonly<Record<string, string>>;
  /** Web fonts (name → Google Fonts spec). Fetched only when one is selected. */
  readonly webFonts: Readonly<Record<string, string>>;
  /** Page surface presets; `label` is an i18n key. */
  readonly surfaces: ReadonlyArray<{ id: string; label: string; light: string; dark: string }>;
  set(patch: Partial<ThemeConfigState>): void;
  /** Back to the defaults — the platform's (Admin → Config) when set, else the theme's. */
  reset(): void;
  /**
   * The platform's look (Admin → Config): the base the user's own changes sit on. Only what the user
   * changed is kept in localStorage, so a later platform change reaches everyone who did not touch it.
   * `enforce` (users may not override): the user's changes are dropped and `set` does nothing.
   */
  useDefaults(patch: Partial<ThemeConfigState>, options?: { enforce?: boolean }): void;
  /** Reactive: true while the platform enforces its look (see `useDefaults`). */
  readonly locked: boolean;
  /** Re-apply the current state to `:root` (called automatically by `set`). */
  apply(): void;
  toggle(force?: boolean): void;
  /** CSS lines to paste into tokens.css once the look is final. */
  exportTokens(): string;
}
