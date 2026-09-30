import type { II18n } from '../contracts';
import { EMPTY_VALUE, type Formatter, type IFormatService } from '../contracts';

/**
 * 🔢 Format service — `superApp.$f`
 *
 * One implementation of "how this product writes a date, a price, a count", so every app spells
 * them the same way and a locale switch moves all of them at once. It reads `$i18n.locale` through
 * a getter, so a template that calls `$f.formatDate(row.updatedAt)` re-renders on a locale change
 * with nothing to wire up.
 *
 * In a template: `{{ $f.formatMoney(row.price) }}`.
 * In script: `const { superApp } = useApp(); superApp.$f.formatDate(iso)`.
 */

/** Maps our locale codes onto the tags `Intl` expects. */
function toIntlLocale(locale: string): string {
  if (locale === 'vi') {
    return 'vi-VN';
  }
  if (locale === 'en') {
    return 'en-US';
  }
  return locale;
}

/** `Intl` objects are expensive to build and cheap to keep. */
const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat>();

function cached<T extends Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat>(key: string, create: () => T): T {
  const hit = cache.get(key);
  if (hit) {
    return hit as T;
  }

  const made = create();
  cache.set(key, made);
  return made;
}

/** Everything date-shaped the callers actually pass, or `null` when it is not a usable date. */
function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

const RELATIVE_STEPS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { unit: 'year', ms: 365 * 86_400_000 },
  { unit: 'month', ms: 30 * 86_400_000 },
  { unit: 'day', ms: 86_400_000 },
  { unit: 'hour', ms: 3_600_000 },
  { unit: 'minute', ms: 60_000 },
  { unit: 'second', ms: 1_000 },
];

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

/** Names an app may not take: they are the contract every app relies on. */
const BUILT_IN = new Set([
  'locale', 'currency', 'withLocale', 'register', 'of', 'ownerOf',
  'formatMoney', 'formatNumber', 'formatPercent',
  'formatDate', 'formatDateTime', 'formatTime', 'formatRelative', 'formatBytes',
]);

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

function createRegistry(): FormatterRegistry {
  return { groups: new Map(), owners: new Map() };
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
export function createFormatService(getLocale: () => string, options: FormatServiceOptions = {}): IFormatService {
  const fallbackLocale = options.fallbackLocale ?? 'vi';
  let currency = options.currency ?? 'VND';
  const registry = options.registry ?? createRegistry();

  const service: IFormatService = {
    get locale(): string {
      return getLocale() || fallbackLocale;
    },

    get currency(): string {
      return currency;
    },

    set currency(next: string) {
      currency = next;
    },

    formatMoney(value, currencyCode) {
      if (value === null || value === undefined || !Number.isFinite(value)) {
        return EMPTY_VALUE;
      }

      const code = currencyCode ?? currency;
      const intlLocale = toIntlLocale(service.locale);
      const formatter = cached(`money:${intlLocale}:${code}`, () => new Intl.NumberFormat(intlLocale, {
        style: 'currency',
        currency: code,
        maximumFractionDigits: 0,
      }));
      return formatter.format(value);
    },

    formatNumber(value, maximumFractionDigits = 0) {
      if (value === null || value === undefined || !Number.isFinite(value)) {
        return EMPTY_VALUE;
      }

      const intlLocale = toIntlLocale(service.locale);
      const formatter = cached(`number:${intlLocale}:${maximumFractionDigits}`, () => new Intl.NumberFormat(intlLocale, {
        maximumFractionDigits,
      }));
      return formatter.format(value);
    },

    formatPercent(value, maximumFractionDigits = 1) {
      if (value === null || value === undefined || !Number.isFinite(value)) {
        return EMPTY_VALUE;
      }

      const intlLocale = toIntlLocale(service.locale);
      const formatter = cached(`percent:${intlLocale}:${maximumFractionDigits}`, () => new Intl.NumberFormat(intlLocale, {
        style: 'percent',
        maximumFractionDigits,
      }));
      return formatter.format(value);
    },

    formatDate(value) {
      const date = toDate(value);
      if (!date) {
        return EMPTY_VALUE;
      }

      const intlLocale = toIntlLocale(service.locale);
      const formatter = cached(`date:${intlLocale}`, () => new Intl.DateTimeFormat(intlLocale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }));
      return formatter.format(date);
    },

    formatDateTime(value) {
      const date = toDate(value);
      if (!date) {
        return EMPTY_VALUE;
      }

      const intlLocale = toIntlLocale(service.locale);
      const formatter = cached(`datetime:${intlLocale}`, () => new Intl.DateTimeFormat(intlLocale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }));
      return formatter.format(date);
    },

    formatTime(value) {
      const date = toDate(value);
      if (!date) {
        return EMPTY_VALUE;
      }

      const intlLocale = toIntlLocale(service.locale);
      const formatter = cached(`time:${intlLocale}`, () => new Intl.DateTimeFormat(intlLocale, {
        hour: '2-digit',
        minute: '2-digit',
      }));
      return formatter.format(date);
    },

    formatRelative(value) {
      const date = toDate(value);
      if (!date) {
        return EMPTY_VALUE;
      }

      const intlLocale = toIntlLocale(service.locale);
      const formatter = cached(`relative:${intlLocale}`, () => new Intl.RelativeTimeFormat(intlLocale, {
        numeric: 'auto',
      }));

      const diff = date.getTime() - Date.now();
      for (const step of RELATIVE_STEPS) {
        if (Math.abs(diff) >= step.ms) {
          return formatter.format(Math.round(diff / step.ms), step.unit);
        }
      }

      return formatter.format(0, 'second');
    },

    formatBytes(value, maximumFractionDigits = 1) {
      if (value === null || value === undefined || !Number.isFinite(value)) {
        return EMPTY_VALUE;
      }

      let size = Math.abs(value);
      let unit = 0;
      while (size >= 1024 && unit < BYTE_UNITS.length - 1) {
        size = size / 1024;
        unit = unit + 1;
      }

      const sign = value < 0 ? '-' : '';
      const digits = unit === 0 ? 0 : maximumFractionDigits;
      return `${sign}${service.formatNumber(size, digits)} ${BYTE_UNITS[unit]}`;
    },

    withLocale(locale) {
      // Same registry: a formatter an app added is still there when you format in another locale.
      return createFormatService(() => locale, { fallbackLocale, currency, registry });
    },

    register(namespace, formatters) {
      if (!namespace) {
        throw new Error('[format] register() needs a namespace — use the module id.');
      }

      const group = registry.groups.get(namespace) ?? {};

      for (const [name, fn] of Object.entries(formatters)) {
        if (BUILT_IN.has(name)) {
          throw new Error(`[format] "${name}" is a built-in formatter and cannot be replaced.`);
        }

        group[name] = fn;

        const owner = registry.owners.get(name);
        if (!owner) {
          registry.owners.set(name, namespace);
          continue;
        }

        if (owner === namespace) {
          continue;   // same app registering again (hot reload) — the group above already replaced it
        }

        console.warn(
          `⚠️ [format] "${name}" is already registered by [${owner}], so $f.${name} stays theirs. `
          + `[${namespace}] can reach its own as $f.of('${namespace}').${name}.`,
        );
      }

      registry.groups.set(namespace, group);
      return group as typeof formatters;
    },

    of(namespace) {
      return registry.groups.get(namespace) ?? {};
    },

    ownerOf(name) {
      return registry.owners.get(name) ?? null;
    },
  };

  /**
   * Registered formatters are resolved here, not copied onto the object, so `$f.formatSku` works
   * on every instance whenever it was registered — including a `withLocale()` child created
   * before the app that owns the name had installed.
   */
  return new Proxy(service, {
    get(target, prop, receiver) {
      if (typeof prop !== 'string' || prop in target) {
        return Reflect.get(target, prop, receiver);
      }

      const owner = registry.owners.get(prop);
      if (!owner) {
        return undefined;
      }

      return registry.groups.get(owner)?.[prop];
    },

    has(target, prop) {
      if (prop in target) {
        return true;
      }
      return typeof prop === 'string' && registry.owners.has(prop);
    },

    ownKeys(target) {
      return [...new Set([...Reflect.ownKeys(target), ...registry.owners.keys()])];
    },

    getOwnPropertyDescriptor(target, prop) {
      const own = Reflect.getOwnPropertyDescriptor(target, prop);
      if (own) {
        return own;
      }
      if (typeof prop === 'string' && registry.owners.has(prop)) {
        return { configurable: true, enumerable: true, value: undefined };
      }
      return undefined;
    },
  });
}

/** Convenience for the Shell: build the service straight from the i18n service. */
export function createFormatServiceFromI18n(i18n: II18n, options: FormatServiceOptions = {}): IFormatService {
  return createFormatService(() => i18n.locale, options);
}
