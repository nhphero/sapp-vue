import type { IEnvironment } from './env';
/**
 * Template globals provided by createSapp (Shell) and createMiniApp (mini apps).
 * Prefer `$c('ui.button')` in templates over injecting the kernel just to resolve a component.
 */
import type { ISuperApp } from './kernel';
import type { IAppState } from './app-state';
import type { IThemeConfig } from './theme';
import type { DialogService, MessageService } from './ui';
import type { II18n, TranslateParams } from './i18n';
import type { IFormatService } from './format';
import type { IAuthState } from './auth';
import type { IPolicyService } from './policy';

declare module 'vue' {
  interface ComponentCustomProperties {
    /** Resolve a registered component by id: `<component :is="$c('ui.button')" />`. */
    $c: (id: string) => any;
    /** The kernel (`superApp`). */
    $s: ISuperApp;
    $superApp: ISuperApp;
    $appState: IAppState;
    /** Signed-in user: `{{ $auth.user?.name }}`, `v-if="$auth.hasRole('X')"`. */
    $auth: IAuthState;
    /** Authorisation checks: `v-if="$policy.can('role', 'X')"`. Registered by the Shell's policy feature. */
    $policy: IPolicyService;
    $message: MessageService;
    $dialog: DialogService;
    $themeConfig: IThemeConfig;
    $i18n: II18n;
    /** Translate: `{{ $t('common.save') }}`, `{{ $t('orders.count', { n: 3 }) }}`. */
    $t: (key: string, params?: TranslateParams & { default?: string }) => string;
    /** Format: `{{ $f.formatMoney(row.price) }}`, `{{ $f.formatDate(row.updatedAt) }}`. */
    $f: IFormatService;
    /** Public environment: `{{ $env.get('BIZ_API_SERVER') }}`, `v-if="$env.has('BIZ_API_SERVER')"`. */
    $env: IEnvironment;
  }
}

export {};
