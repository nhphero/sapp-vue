/**
 * 🌐 Translation Contracts
 * One reactive dictionary for the Shell and every mini app. Keys are dot paths (`common.save`,
 * `orders.list.title`); mini apps register their own keys under their module namespace.
 */
/** Nested or flat message tree for ONE locale. */
export type MessageTree = {
    [key: string]: string | MessageTree;
};
/** Messages for several locales: `{ en: {...}, vi: {...} }`. */
export type LocaleMessages = Record<string, MessageTree>;
export type TranslateParams = Record<string, string | number | boolean | null | undefined>;
export interface II18n {
    /** Current locale (reactive). */
    locale: string;
    readonly fallbackLocale: string;
    /** Locales that have at least one message. */
    readonly availableLocales: string[];
    /** Translate a key; `{name}` placeholders are replaced from `params`. Missing key → the key itself (or `params.default`). */
    t(key: string, params?: TranslateParams & {
        default?: string;
    }): string;
    /** True when the key exists in the current or fallback locale. */
    te(key: string, locale?: string): boolean;
    setLocale(locale: string): void;
    /**
     * Add messages for several locales, optionally under a namespace:
     * `addMessages({ en: { title: 'Orders' } }, 'orders')` → key `orders.title`.
     * Later registrations override earlier ones.
     */
    addMessages(messages: LocaleMessages, namespace?: string): void;
    /** Add messages for one locale. */
    addLocaleMessages(locale: string, messages: MessageTree, namespace?: string): void;
    /** Flat snapshot `{ key: text }` of one locale (merged with fallback when `withFallback`). */
    getMessages(locale?: string, withFallback?: boolean): Record<string, string>;
    onLocaleChange(handler: (locale: string, previous: string) => void): () => void;
}
export interface I18nOptions {
    locale?: string;
    fallbackLocale?: string;
    messages?: LocaleMessages;
    /** Persist the chosen locale in localStorage (default true). */
    persist?: boolean;
}
export declare const I18N_STORAGE_KEY = "sapp.locale";
export declare const I18N_EVENT_LOCALE_CHANGED = "i18n:locale-changed";
//# sourceMappingURL=i18n.d.ts.map