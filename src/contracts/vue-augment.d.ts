/**
 * Template globals provided by createSapp (Shell) and createMiniApp (mini apps).
 * Prefer `$c('ui.button')` in templates over injecting the kernel just to resolve a component.
 */
import type { ISuperApp } from './kernel';
import type { IAppState } from './app-state';
import type { IThemeConfig } from './theme';
import type { DialogService, MessageService, ToastService } from './ui';
declare module 'vue' {
    interface ComponentCustomProperties {
        /** Resolve a registered component by id: `<component :is="$c('ui.button')" />`. */
        $c: (id: string) => any;
        /** The kernel (`superApp`). */
        $s: ISuperApp;
        $superApp: ISuperApp;
        $appState: IAppState;
        $toast: ToastService;
        $message: MessageService;
        $dialog: DialogService;
        $themeConfig: IThemeConfig;
    }
}
export {};
//# sourceMappingURL=vue-augment.d.ts.map