import type { I18nOptions, II18n, LocaleMessages } from '../contracts';
/** Base vocabulary shared by the Shell UI and mini apps (override or extend with addMessages). */
export declare const BASE_MESSAGES: LocaleMessages;
/**
 * Create the shared translation service. Reactive: components re-render on `setLocale` and
 * when new messages are registered (mini apps register keys at install time).
 */
export declare function createI18n(options?: I18nOptions): II18n;
//# sourceMappingURL=i18n.d.ts.map