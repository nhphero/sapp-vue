import { defineComponent, defineAsyncComponent, h, inject, markRaw } from 'vue';
import type { IFeatureRouter, ResolvedFeatureRoute } from '../contracts';
import { MINI_APP_ROUTER_KEY } from '../contracts';

const cache = new WeakMap<ResolvedFeatureRoute, any>();

const resolveComponent = (route: ResolvedFeatureRoute) => {
  if (cache.has(route)) return cache.get(route);
  const raw = route.component as any;
  const comp = markRaw(typeof raw === 'function' ? defineAsyncComponent(raw) : raw);
  cache.set(route, comp);
  return comp;
};

/**
 * Renders the component of the currently matched feature route.
 * Route params are passed as props when the route sets `props: true`.
 */
export const FeatureView = defineComponent({
  name: 'FeatureView',
  setup(_, { attrs, slots }) {
    const router = inject<IFeatureRouter>(MINI_APP_ROUTER_KEY);
    if (!router) throw new Error('[FeatureView] No feature router provided. Use createMiniApp().');

    return () => {
      const { route, params } = router.current;
      if (!route) {
        return slots.fallback ? slots.fallback({ path: router.current.path }) : null;
      }
      const props = route.props ? { ...params } : {};
      return h(resolveComponent(route), { ...attrs, ...props, key: route.fullPath });
    };
  },
});
