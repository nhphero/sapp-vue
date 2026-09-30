const e = window.__MF_BRIDGE__;
(!e || !e.VueRouter) && console.error("🚨 [MF_BRIDGE] FATAL: VueRouter Bridge not found! Ensure Shell is loaded first.");
const {
  createRouter: o,
  createWebHistory: r,
  createWebHashHistory: t,
  createMemoryHistory: u,
  useRouter: i,
  useRoute: a,
  onBeforeRouteLeave: s,
  onBeforeRouteUpdate: n,
  RouterView: R,
  RouterLink: c,
  parseQuery: d,
  stringifyQuery: y,
  NavigationFailureType: f,
  isNavigationFailure: l
} = e.VueRouter, _ = e.VueRouter;
export {
  f as NavigationFailureType,
  c as RouterLink,
  R as RouterView,
  u as createMemoryHistory,
  o as createRouter,
  t as createWebHashHistory,
  r as createWebHistory,
  _ as default,
  l as isNavigationFailure,
  s as onBeforeRouteLeave,
  n as onBeforeRouteUpdate,
  d as parseQuery,
  y as stringifyQuery,
  a as useRoute,
  i as useRouter
};
//# sourceMappingURL=bridge-vue-router.js.map
