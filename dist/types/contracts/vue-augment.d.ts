/**
 * Template globals provided by createSapp (Shell) and createMiniApp (mini apps).
 * Prefer `$c('ui.button')` in templates over injecting the kernel just to resolve a component.
 */
import type { ISuperApp } from './kernel';
import type { IAppState } from './app-state';
import type { IThemeConfig } from './theme';
import type { DialogService, MessageService, ToastService } from './ui';
import type { II18n, TranslateParams } from './i18n';
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
        $i18n: II18n;
        /** Translate: `{{ $t('common.save') }}`, `{{ $t('orders.count', { n: 3 }) }}`. */
        $t: (key: string, params?: TranslateParams & {
            default?: string;
        }) => string;
    }
}
export {};
//# sourceMappingURL=vue-augment.d.ts.map