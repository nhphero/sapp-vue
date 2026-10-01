import { A as i, a as n, b as A, E as P, H as d, I as p, c as T, M as f, R as O, S as R, e as l, f as M, d as I } from "./chunks/format-BUIIBrkU.js";
import { M as N, a as u, d as g, b as y } from "./chunks/feature-CQOHnwJM.js";
import { THEME_COMPONENT_IDS as h, defineErpModule as C } from "./contracts.js";
import { A as L, B as Y, D as m, S as v, a as w, b as B, d as F, e as U, f as k, g as x, h as b, c as H, i as V, j as $, k as j } from "./chunks/createSapp-DkbMp8Bt.js";
function S(o) {
  const a = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Set();
  function t(e, r) {
    const E = a.get(e);
    return E ? E.check(r, o()) : (s.has(e) || (s.add(e), console.warn(`[policy] Unknown strategy "${e}" — denied. Registered: ${[...a.keys()].join(", ") || "none"}.`)), !1);
  }
  return {
    id: "policy",
    register(e) {
      if (a.has(e.id))
        throw new Error(`[policy] Strategy "${e.id}" is already registered.`);
      a.set(e.id, e);
    },
    has: (e) => a.has(e),
    strategies: () => [...a.keys()],
    can: (e, r) => t(e, r),
    cannot: (e, r) => !t(e, r)
  };
}
export {
  i as ACCESS_TOKEN_STORAGE_KEY,
  n as ACTIVE_WORKSPACE_STORAGE_KEY,
  A as APP_STATE_STORAGE_KEY,
  L as ApiProtocol,
  Y as BASE_MESSAGES,
  m as DiscoveryService,
  P as EMPTY_VALUE,
  d as HIDDEN_DEFAULT_APPS_STORAGE_KEY,
  p as I18N_EVENT_LOCALE_CHANGED,
  T as I18N_STORAGE_KEY,
  f as MF_BRIDGE_GLOBAL,
  N as MINI_APP_CONTEXT_KEY,
  u as MINI_APP_ROUTER_KEY,
  O as REGISTERED_APPS_STORAGE_KEY,
  R as SUPERAPP_EVENTS,
  l as SUPERAPP_GLOBAL,
  M as SUPERAPP_PROTOCOL,
  v as SocketProtocol,
  w as SuperApp,
  h as THEME_COMPONENT_IDS,
  B as createApiFactory,
  F as createAppState,
  U as createAuthState,
  k as createFormatService,
  x as createFormatServiceFromI18n,
  b as createI18n,
  S as createPolicyService,
  H as createSapp,
  C as defineErpModule,
  g as defineMfeModule,
  I as defineShellFeature,
  y as defineSubApp,
  V as discoveryService,
  $ as getMfBridge,
  j as installMfBridge
};
//# sourceMappingURL=index.js.map
