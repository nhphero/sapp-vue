import { reactive } from 'vue';
import type { FeatureRoute, FeatureRouteMatch, IFeatureRouter, ISuperApp, ResolvedFeatureRoute } from '../contracts';

const normalize = (p: string) => (p || '').split('/').filter(Boolean).join('/');

interface Compiled {
  route: ResolvedFeatureRoute;
  segments: { name: string; optional: boolean; catchAll: boolean; literal?: string }[];
  /** Lower is more specific. */
  score: number;
}

const compile = (route: ResolvedFeatureRoute): Compiled => {
  const segments = normalize(route.path).split('/').filter(Boolean).map(seg => {
    if (seg === '*') return { name: 'pathMatch', optional: true, catchAll: true };
    if (seg.startsWith(':')) {
      const optional = seg.endsWith('?');
      return { name: optional ? seg.slice(1, -1) : seg.slice(1), optional, catchAll: false };
    }
    return { name: '', optional: false, catchAll: false, literal: seg };
  });
  const score = segments.reduce((s, seg) => s + (seg.catchAll ? 100 : seg.literal !== undefined ? 0 : seg.optional ? 2 : 1), 0);
  return { route, segments, score };
};

const match = (c: Compiled, parts: string[]): Record<string, string> | null => {
  const params: Record<string, string> = {};
  let i = 0;
  for (const seg of c.segments) {
    if (seg.catchAll) {
      params[seg.name] = parts.slice(i).join('/');
      return params;
    }
    const part = parts[i];
    if (part === undefined) {
      if (seg.optional) continue;
      return null;
    }
    if (seg.literal !== undefined) {
      if (seg.literal !== part) return null;
    } else {
      params[seg.name] = decodeURIComponent(part);
    }
    i++;
  }
  return i === parts.length ? params : null;
};

/**
 * Minimal router for the sub-path a mini app receives from the Shell
 * (`/app/<slug>/<subPath>`; the slug of the app id it is mounted as). Paths are matched against feature routes;
 * navigation is delegated to the Shell's vue-router.
 */
export function createFeatureRouter(moduleId: string, superApp: ISuperApp): IFeatureRouter {
  const compiled: Compiled[] = [];
  const routes: ResolvedFeatureRoute[] = reactive([]) as ResolvedFeatureRoute[];
  const current: FeatureRouteMatch = reactive({ path: '', route: null, params: {} });
  const mount = reactive({ id: moduleId });

  // The route follows the app's slug (changeable); `mount.id` is its id (the key).
  const href = (subPath: string) => {
    const p = normalize(subPath);
    if (typeof superApp.appPath === 'function') return superApp.appPath(mount.id, p);
    return p ? `/app/${mount.id}/${p}` : `/app/${mount.id}`;
  };

  const resolve = (subPath: string): FeatureRouteMatch => {
    const path = normalize(subPath);
    const parts = path.split('/').filter(Boolean);
    for (const c of compiled) {
      const params = match(c, parts);
      if (params) return { path, route: c.route, params };
    }
    return { path, route: null, params: {} };
  };

  return {
    moduleId,
    get mountId() { return mount.id; },
    setMountId(id: string) { mount.id = id; },
    routes,
    current,
    addRoute(featureId, route: FeatureRoute) {
      const resolved: ResolvedFeatureRoute = { ...route, path: normalize(route.path), featureId, fullPath: href(route.path) };
      routes.push(resolved);
      compiled.push(compile(resolved));
      compiled.sort((a, b) => a.score - b.score);
      return resolved;
    },
    resolve,
    href,
    push(subPath) {
      superApp.$router?.push(href(subPath));
    },
    pathOf(route: FeatureRoute) {
      return normalize(route.path).split('/').filter(seg => seg && seg !== '*' && !(seg.startsWith(':') && seg.endsWith('?'))).join('/');
    },
    sync(subPath) {
      const next = resolve(subPath);
      current.path = next.path;
      current.route = next.route;
      current.params = next.params;
      return next;
    },
  };
}
