import * as Vue from 'vue';
import * as Pinia from 'pinia';
import * as VueRouter from 'vue-router';
import * as VueUse from '@vueuse/core';
import { createApp, defineComponent, h } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory, RouterView, type RouteRecordRaw } from 'vue-router';
import type { ISapp, ISuperApp, SappContext, SappOptions, ShellFeatureContext } from '../contracts';
import { SuperApp } from '../kernel/SuperApp';
import { ApiProtocol } from '../protocols/ApiProtocol';
import { SocketProtocol } from '../protocols/SocketProtocol';
import { discoveryService } from '../services/DiscoveryService';
import { createAppState } from '../services/appState';
import { createApiFactory } from '../services/apiClient';
import { createI18n } from '../services/i18n';
import { createFormatServiceFromI18n } from '../services/format';
import { installMfBridge } from '../bridge/install';

const ROOT_ROUTE = 'Root';
const env = (import.meta as any).env ?? {};

const resolveApiBase = (discovered?: string) =>
  discovered || env.VITE_MASTER_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:4400' : '');

/** Dev shell on :4401 talks to the backend on :4400; otherwise same host. */
const resolveSocketUrl = () => {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host.replace(':4401', ':4400');
  return `${proto}//${host}/socket`;
};

/** Route component that resolves a registry id at navigation time. */
const registryRoute = (superApp: ISuperApp, id: string) => async () => {
  const comp = superApp.getComponent(id);
  if (!comp) throw new Error(`[sapp] Route component not registered: ${id}`);
  return typeof comp === 'function' ? comp() : comp;
};

/**
 * 🚀 createSapp — boot the Super App shell.
 *
 * Order matters and mirrors the kernel expectations: bridge → Vue/Pinia → discovery → kernel →
 * theme (registers `ui.*` etc.) → protocols → business modules → kernel init → app state →
 * features (pages/components of this Shell) → mount.
 */
export async function createSapp(options: SappOptions): Promise<ISapp> {
  // 0. Framework singletons for micro-frontends
  installMfBridge({ Vue, Pinia, VueRouter, VueUse });

  // 1. Vue + Pinia
  const app = createApp(options.root);
  const pinia = createPinia();
  app.use(pinia);

  // 2. Runtime config
  const discovery = options.discovery ?? discoveryService;
  await discovery.initialize();
  const apiBase = options.api?.baseUrl ?? resolveApiBase(discovery.get('master_api_url'));
  console.log('💉 [sapp] apiBase:', apiBase);

  // 3. Kernel + theme (theme first: modules and features resolve `ui.*` components)
  const superApp = new SuperApp() as unknown as ISuperApp;
  superApp.$app = app; // available to `install(app, superApp)` modules before kernel init
  (window as any).$superApp = superApp;
  const services = options.theme.register(app, superApp);
  const uiStore = services.uiStore;

  // 3b. Translations (protocol `i18n`, template `$t`)
  const i18n = createI18n(options.i18n);
  // Formatting for every app in the Shell. It reads `i18n.locale` through a getter, so a locale
  // switch moves every date and price on screen with nothing else to wire up.
  const format = createFormatServiceFromI18n(i18n, { currency: options.currency });
  superApp.registerProtocol('i18n', i18n as any);
  i18n.onLocaleChange((locale, previous) => superApp.emit('i18n:locale-changed', { locale, previous }));

  // 4. Protocols
  const api = new ApiProtocol(apiBase);
  const socket = new SocketProtocol(options.socket?.url ?? resolveSocketUrl());
  socket.connect();
  superApp.registerProtocol('api', api);
  superApp.registerProtocol('socket', socket);
  api.bind(superApp);

  // 5. Router: login + layout root; features add their pages as children of the root
  const tokenKey = options.auth?.tokenKey ?? 'accessToken';
  // Client factory for app backends (mini apps build their own client with it).
  superApp.createApi = createApiFactory({
    tokenKey,
    message: services.messageService,
    appState: () => superApp.$appState,
  });
  const loginPath = options.auth?.loginPath ?? '/login';
  const Layout = options.layout ?? defineComponent({ name: 'SappLayout', setup: () => () => h(RouterView) });
  const routes: RouteRecordRaw[] = [
    { path: loginPath, name: 'Login', component: registryRoute(superApp, options.auth?.loginComponentId ?? 'auth.login'), meta: { public: true } },
    {
      path: '/',
      name: ROOT_ROUTE,
      component: Layout,
      children: [
        { path: 'app/:moduleId(.*)*', name: 'AppGateway', component: registryRoute(superApp, 'layout.app-container') },
      ],
    },
    ...(options.routes ?? []),
  ];
  const router = createRouter({ history: createWebHistory(options.router?.base), routes });
  router.beforeEach((to, _from, next) => {
    const token = localStorage.getItem(tokenKey);
    if (!to.meta.public && !token) return next(loginPath);
    next();
  });

  const ctx: SappContext = { app, router, pinia, superApp, discovery, api, socket };

  // 6. Business modules (auth, db, system…)
  await options.modules?.(ctx);

  // 7. Kernel init with manifest + theme services
  superApp.state.discovery = discovery.getAll();
  superApp.init({
    app, router,
    config: { moduleManifest: { ...(options.manifest ?? {}), ...discovery.getAll() }, branding: options.branding },
    theme: options.tokens,
    message: services.messageService, dialog: services.dialogService,
  });

  // 7b. Branding → favicon + title
  if (options.branding) {
    const { name, icon, logo } = options.branding;
    if (name) document.title = name;
    const href = icon || logo;
    if (href) {
      const link = (document.querySelector('link[rel~="icon"]') as HTMLLinkElement | null) ?? Object.assign(document.createElement('link'), { rel: 'icon' });
      link.href = href; if (!link.parentNode) document.head.appendChild(link);
    }
  }

  // 8. Global app state (workspaces pre-filled from discovery)
  const appState = services.appState ?? createAppState();
  const workspaces = discovery.get('system.workspaces');
  if (workspaces) appState.workspaces = workspaces;
  superApp.$appState = appState;
  app.config.globalProperties.$appState = appState;

  // 8b. Auth state — empty until the Shell's sign-in code fills it (see contracts/auth.ts)
  app.config.globalProperties.$auth = superApp.$authState;
  app.provide('$auth', superApp.$authState);

  // 9. Shell features
  for (const feature of options.features ?? []) {
    const fctx: ShellFeatureContext = {
      ...ctx,
      featureId: feature.id,
      registerRoute: route => router.addRoute(ROOT_ROUTE, route),
      registerTopRoute: route => router.addRoute(route),
      registerComponent: config => superApp.registerComponent(config),
      registerSkill: config => superApp.registerSkill(config),
      registerCommand: config => superApp.registerCommand(config),
      registerMessages: (messages, namespace) => i18n.addMessages(messages, namespace),
      provide: (key, value) => app.provide(key as any, value),
    };
    await feature.install(fctx);
    console.log(`🧩 [sapp] Shell feature installed: ${feature.id}`);
  }

  // 10. Template globals + provides used by shell components and mini apps
  const gp = app.config.globalProperties;
  gp.$c = (id: string) => superApp.getComponent(id);
  gp.$s = superApp;
  gp.$superApp = superApp;
  gp.$message = services.messageService;
  gp.$dialog = services.dialogService;
  gp.$i18n = i18n;
  gp.$t = (key: string, params?: any) => i18n.t(key, params);
  gp.$f = format;
  superApp.$f = format;
  app.provide('$i18n', i18n);
  app.provide('$f', format);
  app.provide('ui-store', uiStore);
  app.provide('$theme', options.tokens);
  app.provide('$superApp', superApp);
  app.provide('$s', superApp);
  app.provide('$message', services.messageService);
  // $dialog was reachable as a template global and as `superApp.$dialog`, but was the
  // only UI service missing from `provide` — so `inject('$dialog')` returned undefined
  // while `$message` worked. Keep them symmetrical.
  app.provide('$dialog', services.dialogService);

  return {
    ...ctx,
    mount(selector = '#app') {
      app.use(router);
      app.mount(selector);
      return app;
    },
  };
}
