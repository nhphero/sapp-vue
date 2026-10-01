import { a as E, d as W, M as _ } from "./chunks/feature-CQOHnwJM.js";
import { reactive as P, defineComponent as b, inject as y, h as F, markRaw as j, defineAsyncComponent as x } from "vue";
const v = (n) => (n || "").split("/").filter(Boolean).join("/"), B = (n) => {
  const t = v(n.path).split("/").filter(Boolean).map((l) => {
    if (l === "*") return { name: "pathMatch", optional: !0, catchAll: !0 };
    if (l.startsWith(":")) {
      const e = l.endsWith("?");
      return { name: e ? l.slice(1, -1) : l.slice(1), optional: e, catchAll: !1 };
    }
    return { name: "", optional: !1, catchAll: !1, literal: l };
  }), a = t.reduce((l, e) => l + (e.catchAll ? 100 : e.literal !== void 0 ? 0 : e.optional ? 2 : 1), 0);
  return { route: n, segments: t, score: a };
}, V = (n, t) => {
  const a = {};
  let l = 0;
  for (const e of n.segments) {
    if (e.catchAll)
      return a[e.name] = t.slice(l).join("/"), a;
    const c = t[l];
    if (c === void 0) {
      if (e.optional) continue;
      return null;
    }
    if (e.literal !== void 0) {
      if (e.literal !== c) return null;
    } else
      a[e.name] = decodeURIComponent(c);
    l++;
  }
  return l === t.length ? a : null;
};
function T(n, t) {
  const a = [], l = P([]), e = P({ path: "", route: null, params: {} }), c = P({ id: n }), M = (u) => {
    const r = v(u);
    return typeof t.appPath == "function" ? t.appPath(c.id, r) : r ? `/app/${c.id}/${r}` : `/app/${c.id}`;
  }, w = (u) => {
    const r = v(u), m = r.split("/").filter(Boolean);
    for (const d of a) {
      const i = V(d, m);
      if (i) return { path: r, route: d.route, params: i };
    }
    return { path: r, route: null, params: {} };
  };
  return {
    moduleId: n,
    get mountId() {
      return c.id;
    },
    setMountId(u) {
      c.id = u;
    },
    routes: l,
    current: e,
    addRoute(u, r) {
      const m = { ...r, path: v(r.path), featureId: u, fullPath: M(r.path) };
      return l.push(m), a.push(B(m)), a.sort((d, i) => d.score - i.score), m;
    },
    resolve: w,
    href: M,
    push(u) {
      t.$router?.push(M(u));
    },
    pathOf(u) {
      return v(u.path).split("/").filter((r) => r && r !== "*" && !(r.startsWith(":") && r.endsWith("?"))).join("/");
    },
    sync(u) {
      const r = w(u);
      return e.path = r.path, e.route = r.route, e.params = r.params, r;
    }
  };
}
const R = /* @__PURE__ */ new WeakMap(), U = (n) => {
  if (R.has(n)) return R.get(n);
  const t = n.component, a = j(typeof t == "function" ? x(t) : t);
  return R.set(n, a), a;
}, K = b({
  name: "FeatureView",
  setup(n, { attrs: t, slots: a }) {
    const l = y(E);
    if (!l) throw new Error("[FeatureView] No feature router provided. Use createMiniApp().");
    return () => {
      const { route: e, params: c } = l.current;
      if (!e)
        return a.fallback ? a.fallback({ path: l.current.path }) : null;
      const M = e.props ? { ...c } : {};
      return F(U(e), { ...t, ...M, key: e.fullPath });
    };
  }
}), L = (n, t) => t.startsWith(`${n}.`) ? t : `${n}.${t}`;
function z(n) {
  const { id: t, name: a, aliases: l = [], features: e, layout: c, setup: M, messages: w } = n;
  let u = !1, r = null;
  const m = (d, i, p, $, g, I, C) => ({
    app: d,
    superApp: i,
    moduleId: t,
    mountId: $,
    basePath: g,
    config: I,
    router: p,
    featureId: C,
    registerRoute: (s) => p.addRoute(C ?? t, s),
    registerComponent: (s) => {
      const o = L(t, s.id);
      return i.registerComponent({ ...s, id: o }), o;
    },
    registerGlobalComponent: (s) => (i.registerComponent(s), s.id),
    registerMessages: (s, o) => i.$i18n?.addMessages(s, o ?? t),
    t: (s, o) => {
      const h = i.$i18n;
      return h ? h.te(`${t}.${s}`) ? h.t(`${t}.${s}`, o) : h.t(s, o) : o?.default ?? s;
    },
    provide: (s, o) => d.provide(s, o)
  });
  return W({
    id: t,
    name: a,
    aliases: l,
    async install(d, i, p) {
      const $ = p?.moduleId || t, g = p?.basePath || `/app/${$}`, I = p?.app ?? null, C = Array.from(/* @__PURE__ */ new Set([$, ...l]));
      if (C.every((o) => i.isModuleInstalled(o))) return;
      if (console.log(`🚀 [${t}] Installing mini app as [${$}] with ${e.length} feature(s)...`), r ??= T(t, i), r.setMountId($), !u) {
        u = !0, d.provide(E, r), d.provide(_, m(d, i, r, $, g, I));
        const o = d.config.globalProperties;
        o.$c || (o.$c = (f) => i.getComponent(f)), o.$s || (o.$s = i), o.$superApp || (o.$superApp = i), !o.$t && i.$i18n && (o.$i18n = i.$i18n, o.$t = (f, N) => i.$i18n.t(f, N)), w && i.$i18n?.addMessages(w, t), await M?.(m(d, i, r, $, g, I));
        const h = /* @__PURE__ */ new Set();
        for (const f of e) {
          if (h.has(f.id)) throw new Error(`[${t}] Duplicate feature id: ${f.id}`);
          h.add(f.id), await f.install(m(d, i, r, $, g, I, f.id)), console.log(`🧩 [${t}] Feature installed: ${f.id}`);
        }
      }
      const s = r;
      for (const o of C)
        i.isModuleInstalled(o) || (i.registerComponent({
          id: `${o}.main`,
          name: `${a} Main`,
          category: "Main Views",
          component: c ?? K
        }), i.registerModuleEntry({ moduleId: o, entryComponentId: `${o}.main` }), i.onPathChange(o, (h) => {
          if (s.setMountId(o), !(h || "").split("/").filter(Boolean).length && n.defaultPath) {
            i.$router?.replace(s.href(n.defaultPath));
            return;
          }
          s.sync(h);
        }), i.markModuleInstalled(o));
      console.log(`🎉 [${t}] Installed`);
    }
  });
}
function D() {
  const n = y(E);
  if (!n) throw new Error("[useMiniRouter] Not inside a mini app created with createMiniApp().");
  return n;
}
function G() {
  const { superApp: n, moduleId: t } = S(), a = n.$i18n;
  return { i18n: a, t: (e, c) => a.te(`${t}.${e}`) ? a.t(`${t}.${e}`, c) : a.t(e, c), get locale() {
    return a.locale;
  }, setLocale: (e) => a.setLocale(e) };
}
function S() {
  const n = y(_);
  if (!n) throw new Error("[useMiniApp] Not inside a mini app created with createMiniApp().");
  return n;
}
export {
  K as FeatureView,
  T as createFeatureRouter,
  z as createMiniApp,
  W as defineMfeModule,
  G as useI18n,
  S as useMiniApp,
  D as useMiniRouter
};
//# sourceMappingURL=mfe.js.map
