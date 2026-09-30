/**
 * 🎨 Theme Contract
 * A theme registers the Shell UI (layout, providers, UI kit) into the kernel
 * component registry and creates the UI services the kernel exposes as
 * `$toast`, `$message`, `$dialog`.
 */
import type { App } from 'vue';
import type { ISuperApp } from './kernel';
import type { IAppState } from './app-state';
import type { DialogService, MessageService, ToastService } from './ui';
export interface ThemeServices {
    toastService: ToastService;
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
    register(app: App, superApp: ISuperApp, context?: {
        uiStore?: any;
    }): ThemeServices;
}
/** Component ids every theme is expected to register. */
export declare const THEME_COMPONENT_IDS: {
    readonly header: "layout.header";
    readonly sidebar: "layout.sidebar";
    readonly modulePage: "layout.module-page";
    readonly moduleHeader: "layout.module-header";
    readonly commandPalette: "layout.command-palette";
    readonly themeConnector: "ThemeConnector";
    readonly toastContainer: "ToastContainer";
    readonly messageProvider: "MessageProvider";
    readonly dialogProvider: "DialogProvider";
    readonly themePanel: "layout.theme-panel";
};
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
}
export interface IThemeConfig {
    /** Reactive current state (mutate through `set`). */
    readonly state: ThemeConfigState;
    /** Reactive: whether the customization panel is open. */
    open: boolean;
    readonly defaults: Readonly<ThemeConfigState>;
    readonly swatches: ReadonlyArray<{
        name: string;
        hex: string;
    }>;
    readonly fontStacks: Readonly<Record<string, string>>;
    set(patch: Partial<ThemeConfigState>): void;
    reset(): void;
    /** Re-apply the current state to `:root` (called automatically by `set`). */
    apply(): void;
    toggle(force?: boolean): void;
    /** CSS lines to paste into tokens.css once the look is final. */
    exportTokens(): string;
}
//# sourceMappingURL=theme.d.ts.map