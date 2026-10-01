import { a as E, d as W, M as _ } from "./chunks/feature-CQOHnwJM.js";
import { reactive as R, defineComponent as b, inject as y, h as F, markRaw as j, defineAsyncComponent as x } from "vue";
const v = (n) => (n || "").split("/").filter(Boolean).join("/"), B = (n) => {
  const t = v(n.path).split("/").filter(Boolean).map((s) => {
    if (s === "*") return { name: "pathMatch", optional: !0, catchAll: !0 };
    if (s.startsWith(":")) {
      const e = s.endsWith("?");
      return { name: e ? s.slice(1, -1) : s.slice(1), optional: e, catchAll: !1 };
    }
    return { name: "", optional: !1, catchAll: !1, literal: s };
  }), a = t.reduce((s, e) => s + (e.catchAll ? 100 : e.literal !== void 0 ? 0 : e.optional ? 2 : 1), 0);
  return { route: n, segments: t, score: a };
}, V = (n, t) => {
  const a = {};
  let s = 0;
  for (const e of n.segments) {
    if (e.catchAll)
      return a[e.name] = t.slice(s).join("/"), a;
    const u = t[s];
    if (u === void 0) {
      if (e.optional) continue;
      return null;
    }
    if (e.literal !== void 0) {
      if (e.literal !== u) return null;
    } else
      a[e.name] = decodeURIComponent(u);
    s++;
  }
  return s === t.length ? a : null;
};
function T(n, t) {
  const a = [], s = R([]), e = R({ path: "", route: null, params: {} }), u = R({ id: n }), M = (c) => {
    const i = v(c);
    return i ? `/app/${u.id}/${i}` : `/app/${u.id}`;
  }, w = (c) => {
    const i = v(c), m = i.split("/").filter(Boolean);
    for (const d of a) {
      const r = V(d, m);
      if (r) return { path: i, route: d.route, params: r };
    }
    return { path: i, route: null, params: {} };
  };
  return {
    moduleId: n,
    get mountId() {
      return u.id;
    },
    setMountId(c) {
      u.id = c;
    },
    routes: s,
    current: e,
    addRoute(c, i) {
      const m = { ...i, path: v(i.path), featureId: c, fullPath: M(i.path) };
      return s.push(m), a.push(B(m)), a.sort((d, r) => d.score - r.score), m;
    },
    resolve: w,
    href: M,
    push(c) {
      t.$router?.push(M(c));
    },
    pathOf(c) {
      return v(c.path).split("/").filter((i) => i && i !== "*" && !(i.startsWith(":") && i.endsWith("?"))).join("/");
    },
    sync(c) {
      const i = w(c);
      return e.path = i.path, e.route = i.route, e.params = i.params, i;
    }
  };
}
const P = /* @__PURE__ */ new WeakMap(), U = (n) => {
  if (P.has(n)) return P.get(n);
  const t = n.component, a = j(typeof t == "function" ? x(t) : t);
  return P.set(n, a), a;
}, K = b({
  name: "FeatureView",
  setup(n, { attrs: t, slots: a }) {
    const s = y(E);
    if (!s) throw new Error("[FeatureView] No feature router provided. Use createMiniApp().");
    return () => {
      const { route: e, params: u } = s.current;
      if (!e)
        return a.fallback ? a.fallback({ path: s.current.path }) : null;
      const M = e.props ? { ...u } : {};
      return F(U(e), { ...t, ...M, key: e.fullPath });
    };
  }
}), L = (n, t) => t.startsWith(`${n}.`) ? t : `${n}.${t}`;
function z(n) {
  const { id: t, name: a, aliases: s = [], features: e, layout: u, setup: M, messages: w } = n;
  let c = !1, i = null;
  const m = (d, r, p, $, g, I, C) => ({
    app: d,
    superApp: r,
    moduleId: t,
    mountId: $,
    basePath: g,
    config: I,
    router: p,
    featureId: C,
    registerRoute: (l) => p.addRoute(C ?? t, l),
    registerComponent: (l) => {
      const o = L(t, l.id);
      return r.registerComponent({ ...l, id: o }), o;
    },
    registerGlobalComponent: (l) => (r.registerComponent(l), l.id),
    registerMessages: (l, o) => r.$i18n?.addMessages(l, o ?? t),
    t: (l, o) => {
      const h = r.$i18n;
      return h ? h.te(`${t}.${l}`) ? h.t(`${t}.${l}`, o) : h.t(l, o) : o?.default ?? l;
    },
    provide: (l, o) => d.provide(l, o)
  });
  return W({
    id: t,
    name: a,
    aliases: s,
    async install(d, r, p) {
      const $ = p?.moduleId || t, g = p?.basePath || `/app/${$}`, I = p?.app ?? null, C = Array.from(/* @__PURE__ */ new Set([$, ...s]));
      if (C.every((o) => r.isModuleInstalled(o))) return;
      if (console.log(`🚀 [${t}] Installing mini app as [${$}] with ${e.length} feature(s)...`), i ??= T(t, r), i.setMountId($), !c) {
        c = !0, d.provide(E, i), d.provide(_, m(d, r, i, $, g, I));
        const o = d.config.globalProperties;
        o.$c || (o.$c = (f) => r.getComponent(f)), o.$s || (o.$s = r), o.$superApp || (o.$superApp = r), !o.$t && r.$i18n && (o.$i18n = r.$i18n, o.$t = (f, N) => r.$i18n.t(f, N)), w && r.$i18n?.addMessages(w, t), await M?.(m(d, r, i, $, g, I));
        const h = /* @__PURE__ */ new Set();
        for (const f of e) {
          if (h.has(f.id)) throw new Error(`[${t}] Duplicate feature id: ${f.id}`);
          h.add(f.id), await f.install(m(d, r, i, $, g, I, f.id)), console.log(`🧩 [${t}] Feature installed: ${f.id}`);
        }
      }
      const l = i;
      for (const o of C)
        r.isModuleInstalled(o) || (r.registerComponent({
          id: `${o}.main`,
          name: `${a} Main`,
          category: "Main Views",
          component: u ?? K
        }), r.registerModuleEntry({ moduleId: o, entryComponentId: `${o}.main` }), r.onPathChange(o, (h) => {
          if (l.setMountId(o), !(h || "").split("/").filter(Boolean).length && n.defaultPath) {
            r.$router?.replace(l.href(n.defaultPath));
            return;
          }
          l.sync(h);
        }), r.markModuleInstalled(o));
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
  return { i18n: a, t: (e, u) => a.te(`${t}.${e}`) ? a.t(`${t}.${e}`, u) : a.t(e, u), get locale() {
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
