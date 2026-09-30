import { inject } from 'vue';
import type { IFeatureRouter, MiniAppContext } from '../contracts';
import { MINI_APP_CONTEXT_KEY, MINI_APP_ROUTER_KEY } from '../contracts';

/** Feature router of the current mini app (navigation, current route, nav routes). */
export function useMiniRouter(): IFeatureRouter {
  const router = inject<IFeatureRouter>(MINI_APP_ROUTER_KEY);
  if (!router) throw new Error('[useMiniRouter] Not inside a mini app created with createMiniApp().');
  return router;
}

/** Translation service of the Shell plus a `t()` that tries the module namespace first. */
export function useI18n() {
  const { superApp, moduleId } = useMiniApp();
  const i18n = superApp.$i18n;
  const t = (key: string, params?: any) => (i18n.te(`${moduleId}.${key}`) ? i18n.t(`${moduleId}.${key}`, params) : i18n.t(key, params));
  return { i18n, t, get locale() { return i18n.locale; }, setLocale: (l: string) => i18n.setLocale(l) };
}

/** `{ app, superApp, moduleId, router }` of the current mini app. */
export function useMiniApp(): MiniAppContext {
  const ctx = inject<MiniAppContext>(MINI_APP_CONTEXT_KEY);
  if (!ctx) throw new Error('[useMiniApp] Not inside a mini app created with createMiniApp().');
  return ctx;
}
