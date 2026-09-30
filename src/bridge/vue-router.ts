// 🌉 VUE-ROUTER BRIDGE (Operation Bridge of Truth)
const bridge = (window as any).__MF_BRIDGE__;

if (!bridge || !bridge.VueRouter) {
  console.error('🚨 [MF_BRIDGE] FATAL: VueRouter Bridge not found! Ensure Shell is loaded first.');
}

export const {
  createRouter,
  createWebHistory,
  createWebHashHistory,
  createMemoryHistory,
  useRouter,
  useRoute,
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  RouterView,
  RouterLink,
  parseQuery,
  stringifyQuery,
  NavigationFailureType,
  isNavigationFailure
} = bridge.VueRouter;

export default bridge.VueRouter;
