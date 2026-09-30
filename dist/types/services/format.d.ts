import type { II18n } from '../contracts';
import { type Formatter, type IFormatService } from '../contracts';
/**
 * Formatters added by apps. Kept apart from the service object so `withLocale()` inherits them:
 * a formatter is the same function whatever locale it renders in.
 */
interface FormatterRegistry {
    /** namespace → its own formatters. */
    groups: Map<string, Record<string, Formatter>>;
    /** flat name → the namespace that claimed it first. */
    owners: Map<string, string>;
}
export interface FormatServiceOptions {
    /** Used when no `$i18n` is available yet, and as the fallback for an unknown locale. */
    fallbackLocale?: string;
    /** Default currency for `formatMoney`. */
    currency?: string;
    /** Internal: shared so `withLocale()` keeps the formatters apps registered. */
    registry?: FormatterRegistry;
}
/**
 * @param getLocale Reads the ACTIVE locale on every call — pass `() => i18n.locale`, never the
 *                  string itself, or the service freezes at whatever the locale was at startup.
 */
export declare function createFormatService(getLocale: () => string, options?: FormatServiceOptions): IFormatService;
/** Convenience for the Shell: build the service straight from the i18n service. */
export declare function createFormatServiceFromI18n(i18n: II18n, options?: FormatServiceOptions): IFormatService;
export {};
//# sourceMappingURL=format.d.ts.map