/**
 * 🔢 Format Contract
 * Locale-aware formatting for every app in the Shell, exposed as `superApp.$f`,
 * `app.provide('$f')` and the template global `$f`.
 */
/** Shown wherever a value is missing, so table columns stay aligned. */
export declare const EMPTY_VALUE = "\u2014";
/** A formatter an app adds: values in, display string out. */
export type Formatter = (...args: any[]) => string;
/**
 * Augmentation point for formatters registered by an app, so `$f.formatSku(...)` typechecks
 * without an index signature that would swallow every typo. Declare them next to the
 * `register()` call:
 *
 * ```ts
 * declare module '@nhphero/vue-sapp/contracts' {
 *   interface CustomFormatters {
 *     formatSku(value: string): string;
 *   }
 * }
 * ```
 */
export interface CustomFormatters {
}
export interface IFormatService extends CustomFormatters {
    /** The locale every method uses by default. Follows `$i18n.locale`, so it is reactive. */
    readonly locale: string;
    /** Currency code `money()` uses when the call site does not name one. */
    currency: string;
    /** `8900000000` → `8.900.000.000 ₫` (vi) · `₫8,900,000,000` (en) */
    formatMoney(value: number | null | undefined, currency?: string): string;
    /** Grouped number for counts and stock — never money. `1234` → `1.234` (vi) */
    formatNumber(value: number | null | undefined, maximumFractionDigits?: number): string;
    /** `0.128` → `12,8%`. Pass a ratio, not an already-multiplied percentage. */
    formatPercent(value: number | null | undefined, maximumFractionDigits?: number): string;
    /** Date only, short month. `25 thg 9, 2026` (vi) · `25 Sep 2026` (en) */
    formatDate(value: string | number | Date | null | undefined): string;
    /** Date + time in the locale's default form. */
    formatDateTime(value: string | number | Date | null | undefined): string;
    /** Time only, `HH:mm`. */
    formatTime(value: string | number | Date | null | undefined): string;
    /** `3 ngày trước` / `in 2 hours`, relative to now. */
    formatRelative(value: string | number | Date | null | undefined): string;
    /** `1536` → `1,5 KB`. */
    formatBytes(value: number | null | undefined, maximumFractionDigits?: number): string;
    /** Same list, formatted in a locale other than the current one. */
    withLocale(locale: string): IFormatService;
    /**
     * Adds formatters belonging to one app. Call it once, at install time.
     *
     * `namespace` is the owner — use the module id. It is what makes a collision reportable
     * instead of silent: a name another app already took is kept by its first owner, this call
     * warns, and the loser still reaches its own through `$f.of(namespace)`.
     *
     * Built-in names (`formatDate`, `formatMoney`, …) are reserved and throw.
     *
     * @returns the namespace's own group, the same object `of(namespace)` returns.
     */
    register<TFormatters extends Record<string, Formatter>>(namespace: string, formatters: TFormatters): TFormatters;
    /** One app's formatters, by owner. Always correct, even when a name was claimed elsewhere. */
    of(namespace: string): Record<string, Formatter>;
    /** Is this name taken, and by whom? `null` when it is free. */
    ownerOf(name: string): string | null;
}
//# sourceMappingURL=format.d.ts.map