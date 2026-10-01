import type { App } from 'vue';
import type {
  ComponentRegistration, IMfeModule, ISuperApp, MiniAppContext, MiniAppOptions,
} from '../contracts';
import { defineMfeModule, MINI_APP_CONTEXT_KEY, MINI_APP_ROUTER_KEY } from '../contracts';
import type { MfeInstallOptions } from '../contracts';
import { createFeatureRouter } from './router';
import { FeatureView } from './FeatureView';

const scoped = (moduleId: string, id: string) => (id.startsWith(`${moduleId}.`) ? id : `${moduleId}.${id}`);

/**
 * Compose a mini app from features. Produces the `IMfeModule` the Shell expects
 * and handles the boilerplate: feature router, module entry, path sync,
 * idempotent install per module id.
 */
export function createMiniApp(options: MiniAppOptions): IMfeModule {
  const { id: moduleId, name, aliases = [], features, layout, setup, messages } = options;
  let installed = false;
  let router: ReturnType<typeof createFeatureRouter> | null = null;

  /**
   * The app's ONE context. `setup()` and every `install()` receive this same shape — a feature is
   * not a smaller kind of app, so it does not get a context type of its own. A feature's copy
   * differs only in `featureId` and in `registerRoute` being bound to that feature.
   *
   * No `registerSkill` / `registerCommand`: the Shell's sidebar and ⌘K palette are shared
   * surfaces and a mini app does not write into them (demo-app/.rules/structure.md). A Shell
   * feature has `ShellFeatureContext`, which still does.
   */
  const createContext = (
    app: App,
    superApp: ISuperApp,
    router: ReturnType<typeof createFeatureRouter>,
    mountId: string,
    basePath: string,
    config: MiniAppContext['config'],
    featureId?: string,
  ): MiniAppContext => ({
    app,
    superApp,
    moduleId,
    mountId,
    basePath,
    config,
    router,
    featureId,
    registerRoute: route => router.addRoute(featureId ?? moduleId, route),
    registerComponent: (registration: ComponentRegistration) => {
      const full = scoped(moduleId, registration.id);
      superApp.registerComponent({ ...registration, id: full });
      return full;
    },
    registerGlobalComponent: (registration: ComponentRegistration) => {
      superApp.registerComponent(registration);
      return registration.id;
    },
    registerMessages: (messages, namespace) => superApp.$i18n?.addMessages(messages, namespace ?? moduleId),
    t: (key, params) => {
      const i18n = superApp.$i18n;
      if (!i18n) return params?.default ?? key;
      return i18n.te(`${moduleId}.${key}`) ? i18n.t(`${moduleId}.${key}`, params) : i18n.t(key, params);
    },
    provide: (key, value) => app.provide(key as any, value),
  });

  return defineMfeModule({
    id: moduleId,
    name,
    aliases,
    async install(app, superApp, installOptions?: MfeInstallOptions) {
      // The Shell may mount this bundle under a registry id that differs from `id` (e.g. "workspace" → this app).
      const mountId = installOptions?.moduleId || moduleId;
      const basePath = installOptions?.basePath || `/app/${mountId}`;
      const config = installOptions?.app ?? null;
      // Mounted under another registry id (e.g. "master-data-live" for the master-data bundle), claim only
      // that id: claiming the bundle id too would make /app/<bundle id> reuse this instance even when the
      // registry points that id at another source (another version, another host).
      const ids = Array.from(new Set([mountId, ...aliases]));
      if (ids.every(id => superApp.isModuleInstalled(id))) return;

      console.log(`🚀 [${moduleId}] Installing mini app as [${mountId}] with ${features.length} feature(s)...`);
      router ??= createFeatureRouter(moduleId, superApp);
      router.setMountId(mountId);

      if (!installed) {
        installed = true;
        app.provide(MINI_APP_ROUTER_KEY, router);
        app.provide(MINI_APP_CONTEXT_KEY, createContext(app, superApp, router, mountId, basePath, config));
        const gp = app.config.globalProperties;
        if (!gp.$c) gp.$c = (id: string) => superApp.getComponent(id);
        if (!gp.$s) gp.$s = superApp;
        if (!gp.$superApp) gp.$superApp = superApp;
        if (!gp.$t && superApp.$i18n) { gp.$i18n = superApp.$i18n; gp.$t = (key: string, params?: any) => superApp.$i18n.t(key, params); }
        if (messages) superApp.$i18n?.addMessages(messages, moduleId);

        await setup?.(createContext(app, superApp, router, mountId, basePath, config));

        const seen = new Set<string>();
        for (const feature of features) {
          if (seen.has(feature.id)) throw new Error(`[${moduleId}] Duplicate feature id: ${feature.id}`);
          seen.add(feature.id);
          await feature.install(createContext(app, superApp, router, mountId, basePath, config, feature.id));
          console.log(`🧩 [${moduleId}] Feature installed: ${feature.id}`);
        }
      }

      const r = router;
      for (const mId of ids) {
        if (superApp.isModuleInstalled(mId)) continue;
        superApp.registerComponent({
          id: `${mId}.main`,
          name: `${name} Main`,
          category: 'Main Views',
          component: layout ?? FeatureView,
        });
        superApp.registerModuleEntry({ moduleId: mId, entryComponentId: `${mId}.main` });
        superApp.onPathChange(mId, subPath => {
          r.setMountId(mId);
          // The app's root opens its declared default page — a redirect, not a second route.
          const atRoot = !(subPath || '').split('/').filter(Boolean).length;
          if (atRoot && options.defaultPath) {
            superApp.$router?.replace(r.href(options.defaultPath));
            return;
          }
          r.sync(subPath);
        });
        superApp.markModuleInstalled(mId);
      }

      console.log(`🎉 [${moduleId}] Installed`);
    },
  });
}
