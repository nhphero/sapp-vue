import { reactive, watch } from 'vue';
import type { I18nOptions, II18n, LocaleMessages, MessageTree, TranslateParams } from '../contracts';
import { I18N_STORAGE_KEY } from '../contracts';

/** Base vocabulary shared by the Shell UI and mini apps (override or extend with addMessages). */
export const BASE_MESSAGES: LocaleMessages = {
  en: {
    common: {
      ok: 'OK', cancel: 'Cancel', close: 'Close', save: 'Save', delete: 'Delete', edit: 'Edit', create: 'Create',
      search: 'Search…', loading: 'Loading…', empty: 'Nothing here yet', error: 'Something went wrong', retry: 'Retry',
      confirm: 'Confirm', yes: 'Yes', no: 'No', back: 'Back', next: 'Next', submit: 'Submit', understood: 'Got it',
      page: 'Page', perPage: 'Per page', of: 'of', prev: 'Previous',
    },
    shell: { home: 'Home', apps: 'Apps', all: 'All', favorites: 'Favorites', favoritesEmpty: 'No favorites yet — press the star on an app.', recent: 'Recent', toggleFavorite: 'Toggle favorite', searchApps: 'Search apps…', settings: 'Settings', theme: 'Appearance', language: 'Language', logout: 'Sign out', profile: 'Profile' },
    theme: { mode: 'Mode', light: 'Light', dark: 'Dark', system: 'System', brand: 'Brand colour', fontSize: 'Text size', density: 'Density',
      compact: 'Compact', normal: 'Normal', spacious: 'Spacious', radius: 'Corner radius', shadow: 'Shadow', font: 'Font', reset: 'Reset',
      exportTokens: 'Export tokens', copied: 'Copied', fullPage: 'Full page', contrast: 'Contrast', contrastDefault: 'Standard', contrastHigh: 'High', contrastMax: 'Maximum', header: 'Header', headerLight: 'Light', headerTint: 'Tint', headerBrand: 'Brand', headerGradient: 'Gradient', headerDark: 'Dark', savedOnDevice: 'Saved on this browser', locked: 'Set by your administrator',
      surface: 'Page background', surfaceDefault: 'Default', surfacePaper: 'Paper', surfaceDeep: 'Deep', surfaceTint: 'Brand tint',
      fontsLocal: 'On this machine', fontsWeb: 'Web (full Vietnamese)' },
  },
  vi: {
    common: {
      ok: 'OK', cancel: 'Huỷ', close: 'Đóng', save: 'Lưu', delete: 'Xoá', edit: 'Sửa', create: 'Tạo',
      search: 'Tìm…', loading: 'Đang tải…', empty: 'Chưa có dữ liệu', error: 'Có lỗi xảy ra', retry: 'Thử lại',
      confirm: 'Xác nhận', yes: 'Có', no: 'Không', back: 'Quay lại', next: 'Tiếp', submit: 'Gửi', understood: 'Đã hiểu',
      page: 'Trang', perPage: 'Mỗi trang', of: 'trên', prev: 'Trước',
    },
    shell: { home: 'Trang chủ', apps: 'Ứng dụng', all: 'Tất cả', favorites: 'Yêu thích', favoritesEmpty: 'Chưa có mục yêu thích — bấm ngôi sao trên ứng dụng.', recent: 'Gần đây', toggleFavorite: 'Yêu thích', searchApps: 'Tìm ứng dụng…', settings: 'Cài đặt', theme: 'Giao diện', language: 'Ngôn ngữ', logout: 'Đăng xuất', profile: 'Hồ sơ' },
    theme: { mode: 'Chế độ', light: 'Sáng', dark: 'Tối', system: 'Hệ thống', brand: 'Màu thương hiệu', fontSize: 'Cỡ chữ', density: 'Mật độ',
      compact: 'Gọn', normal: 'Chuẩn', spacious: 'Thoáng', radius: 'Bo góc', shadow: 'Đổ bóng', font: 'Font chữ', reset: 'Đặt lại',
      exportTokens: 'Xuất token', copied: 'Đã copy', fullPage: 'Trang đầy đủ', contrast: 'Độ tương phản', contrastDefault: 'Chuẩn', contrastHigh: 'Cao', contrastMax: 'Tối đa', header: 'Header', headerLight: 'Sáng', headerTint: 'Ám brand', headerBrand: 'Màu brand', headerGradient: 'Gradient', headerDark: 'Tối', savedOnDevice: 'Lưu trên trình duyệt này', locked: 'Do quản trị viên thiết lập',
      surface: 'Nền trang', surfaceDefault: 'Mặc định', surfacePaper: 'Sáng', surfaceDeep: 'Đậm', surfaceTint: 'Ám brand',
      fontsLocal: 'Có sẵn trên máy', fontsWeb: 'Web (đủ dấu tiếng Việt)' },
  },
};

const flatten = (tree: MessageTree, prefix = '', out: Record<string, string> = {}) => {
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v as MessageTree, key, out);
    else out[key] = String(v);
  }
  return out;
};

const interpolate = (text: string, params?: TranslateParams) =>
  params ? text.replace(/\{(\w+)\}/g, (m, name) => (params[name] === undefined || params[name] === null ? m : String(params[name]))) : text;

/**
 * Plural forms, separated by `|`, chosen by `params.count`:
 *   `"{count} product | {count} products"`        → one | other
 *   `"No products | {count} product | {count} products"` → zero | one | other
 *
 * Only runs when a numeric `count` is passed, so a message that merely contains a
 * pipe (a path, a shell snippet) is left alone. Vietnamese has no plural inflection,
 * so its entries stay single-form — the split exists for locales that need it.
 */
const plural = (text: string, params?: TranslateParams) => {
  if (params?.count === undefined || params.count === null || !text.includes('|')) return text;
  const n = Number(params.count);
  if (!Number.isFinite(n)) return text;
  const forms = text.split('|').map(f => f.trim());
  if (forms.length === 2) return n === 1 ? forms[0] : forms[1];
  if (forms.length >= 3) return n === 0 ? forms[0] : n === 1 ? forms[1] : forms[2];
  return forms[0];
};

/**
 * Create the shared translation service. Reactive: components re-render on `setLocale` and
 * when new messages are registered (mini apps register keys at install time).
 */
export function createI18n(options: I18nOptions = {}): II18n {
  const fallbackLocale = options.fallbackLocale ?? 'en';
  const persist = options.persist ?? true;
  const saved = persist ? (() => { try { return localStorage.getItem(I18N_STORAGE_KEY); } catch { return null; } })() : null;
  const state = reactive({ locale: saved || options.locale || fallbackLocale, messages: {} as Record<string, Record<string, string>> });
  const listeners = new Set<(locale: string, previous: string) => void>();

  const addLocaleMessages = (locale: string, messages: MessageTree, namespace?: string) => {
    const flat = flatten(messages, namespace || '');
    state.messages[locale] = { ...(state.messages[locale] ?? {}), ...flat };
  };
  const addMessages = (messages: LocaleMessages, namespace?: string) => {
    for (const [locale, tree] of Object.entries(messages)) addLocaleMessages(locale, tree, namespace);
  };
  addMessages(BASE_MESSAGES);
  if (options.messages) addMessages(options.messages);

  const lookup = (key: string, locale: string) => state.messages[locale]?.[key];

  const i18n: II18n = {
    get locale() { return state.locale; },
    set locale(v: string) { i18n.setLocale(v); },
    fallbackLocale,
    get availableLocales() { return Object.keys(state.messages); },
    t(key, params) {
      // Missing key → the key itself. With natural-language keys that means the
      // source-language sentence, not a raw identifier leaking onto the screen.
      const text = lookup(key, state.locale) ?? lookup(key, fallbackLocale) ?? params?.default ?? key;
      return interpolate(plural(text, params), params);
    },
    te(key, locale) { return lookup(key, locale ?? state.locale) !== undefined || (!locale && lookup(key, fallbackLocale) !== undefined); },
    setLocale(locale) {
      if (!locale || locale === state.locale) return;
      const previous = state.locale;
      state.locale = locale;
      if (persist) { try { localStorage.setItem(I18N_STORAGE_KEY, locale); } catch { /* ignore */ } }
      document.documentElement.setAttribute('lang', locale);
      listeners.forEach(h => h(locale, previous));
    },
    addMessages,
    addLocaleMessages,
    getMessages(locale = state.locale, withFallback = true) {
      return withFallback ? { ...(state.messages[fallbackLocale] ?? {}), ...(state.messages[locale] ?? {}) } : { ...(state.messages[locale] ?? {}) };
    },
    onLocaleChange(handler) { listeners.add(handler); return () => listeners.delete(handler); },
  };

  if (typeof document !== 'undefined') document.documentElement.setAttribute('lang', state.locale);
  watch(() => state.locale, () => { /* keep reactive dependency alive for consumers reading i18n.locale */ });
  return i18n;
}
