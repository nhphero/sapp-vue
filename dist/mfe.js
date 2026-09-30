import { a as b, b as N, M as F } from "./chunks/feature-DYESLk3l.js";
import { d as q } from "./chunks/feature-DYESLk3l.js";
import { reactive as P, defineComponent as W, inject as y, h as x, markRaw as j, defineAsyncComponent as S } from "vue";
const I = (o) => (o || "").split("/").filter(Boolean).join("/"), V = (o) => {
  const t = I(o.path).split("/").filter(Boolean).map((a) => {
    if (a === "*") return { name: "pathMatch", optional: !0, catchAll: !0 };
    if (a.startsWith(":")) {
      const e = a.endsWith("?");
      return { name: e ? a.slice(1, -1) : a.slice(1), optional: e, catchAll: !1 };
    }
    return { name: "", optional: !1, catchAll: !1, literal: a };
  }), i = t.reduce((a, e) => a + (e.catchAll ? 100 : e.literal !== void 0 ? 0 : e.optional ? 2 : 1), 0);
  return { route: o, segments: t, score: i };
}, k = (o, t) => {
  const i = {};
  let a = 0;
  for (const e of o.segments) {
    if (e.catchAll)
      return i[e.name] = t.slice(a).join("/"), i;
    const d = t[a];
    if (d === void 0) {
      if (e.optional) continue;
      return null;
    }
    if (e.literal !== void 0) {
      if (e.literal !== d) return null;
    } else
      i[e.name] = decodeURIComponent(d);
    a++;
  }
  return a === t.length ? i : null;
};
function B(o, t) {
  const i = [], a = P([]), e = P({ path: "", route: null, params: {} }), d = P({ id: o }), M = (u) => {
    const r = I(u);
    return r ? `/app/${d.id}/${r}` : `/app/${d.id}`;
  }, g = (u) => {
    const r = I(u), p = r.split("/").filter(Boolean);
    for (const f of i) {
      const n = k(f, p);
      if (n) return { path: r, route: f.route, params: n };
    }
    return { path: r, route: null, params: {} };
  };
  return {
    moduleId: o,
    get mountId() {
      return d.id;
    },
    setMountId(u) {
      d.id = u;
    },
    routes: a,
    current: e,
    addRoute(u, r) {
      const p = { ...r, path: I(r.path), featureId: u, fullPath: M(r.path) };
      return a.push(p), i.push(V(p)), i.sort((f, n) => f.score - n.score), p;
    },
    resolve: g,
    href: M,
    push(u) {
      t.$router?.push(M(u));
    },
    pathOf(u) {
      return I(u.path).split("/").filter((r) => r && r !== "*" && !(r.startsWith(":") && r.endsWith("?"))).join("/");
    },
    sync(u) {
      const r = g(u);
      return e.path = r.path, e.route = r.route, e.params = r.params, r;
    }
  };
}
const R = /* @__PURE__ */ new WeakMap(), T = (o) => {
  if (R.has(o)) return R.get(o);
  const t = o.component, i = j(typeof t == "function" ? S(t) : t);
  return R.set(o, i), i;
}, U = W({
  name: "FeatureView",
  setup(o, { attrs: t, slots: i }) {
    const a = y(b);
    if (!a) throw new Error("[FeatureView] No feature router provided. Use createMiniApp().");
    return () => {
      const { route: e, params: d } = a.current;
      if (!e)
        return i.fallback ? i.fallback({ path: a.current.path }) : null;
      const M = e.props ? { ...d } : {};
      return x(T(e), { ...t, ...M, key: e.fullPath });
    };
  }
}), E = (o, t) => t.startsWith(`${o}.`) ? t : `${o}.${t}`;
function z(o) {
  const { id: t, name: i, aliases: a = [], features: e, layout: d, setup: M, messages: g } = o;
  let u = !1, r = null;
  const p = (f, n, w, m) => {
    const C = {
      app: f,
      superApp: n,
      moduleId: t,
      featureId: m.id,
      router: w,
      registerRoute: (s) => w.addRoute(m.id, s),
      registerComponent: (s) => {
        const c = E(t, s.id);
        return n.registerComponent({ ...s, id: c }), c;
      },
      registerGlobalComponent: (s) => (n.registerComponent(s), s.id),
      registerSkill: ({ route: s, handler: c, ...h }) => {
        const l = E(t, h.id);
        return n.registerSkill({
          ...h,
          id: l,
          handler: c ?? (() => {
            w.push(s ?? "");
          })
        }), l;
      },
      registerMessages: (s, c) => n.$i18n?.addMessages(s, c ?? t),
      t: (s, c) => {
        const h = n.$i18n;
        return h ? h.te(`${t}.${s}`) ? h.t(`${t}.${s}`, c) : h.t(s, c) : c?.default ?? s;
      },
      registerCommand: (s) => {
        const c = E(t, s.id);
        return n.registerCommand({ ...s, id: c }), c;
      },
      provide: (s, c) => f.provide(s, c)
    };
    return m.install(C);
  };
  return N({
    id: t,
    name: i,
    aliases: a,
    async install(f, n, w) {
      const m = w?.moduleId || t, C = w?.basePath || `/app/${m}`, s = w?.app ?? null, c = Array.from(/* @__PURE__ */ new Set([m, t, ...a]));
      if (c.every((l) => n.isModuleInstalled(l))) return;
      if (console.log(`🚀 [${t}] Installing mini app as [${m}] with ${e.length} feature(s)...`), r ??= B(t, n), r.setMountId(m), !u) {
        u = !0, f.provide(b, r), f.provide(F, { app: f, superApp: n, moduleId: t, mountId: m, basePath: C, config: s, router: r });
        const l = f.config.globalProperties;
        l.$c || (l.$c = ($) => n.getComponent($)), l.$s || (l.$s = n), l.$superApp || (l.$superApp = n), !l.$t && n.$i18n && (l.$i18n = n.$i18n, l.$t = ($, _) => n.$i18n.t($, _)), g && n.$i18n?.addMessages(g, t), await M?.({ app: f, superApp: n, moduleId: t, mountId: m, basePath: C, config: s, router: r });
        const v = /* @__PURE__ */ new Set();
        for (const $ of e) {
          if (v.has($.id)) throw new Error(`[${t}] Duplicate feature id: ${$.id}`);
          v.add($.id), await p(f, n, r, $), console.log(`🧩 [${t}] Feature installed: ${$.id}`);
        }
      }
      const h = r;
      for (const l of c)
        n.isModuleInstalled(l) || (n.registerComponent({
          id: `${l}.main`,
          name: `${i} Main`,
          category: "Main Views",
          component: d ?? U
        }), n.registerModuleEntry({ moduleId: l, entryComponentId: `${l}.main` }), n.onPathChange(l, (v) => {
          h.setMountId(l), h.sync(v);
        }), n.markModuleInstalled(l));
      console.log(`🎉 [${t}] Installed`);
    }
  });
}
function D() {
  const o = y(b);
  if (!o) throw new Error("[useMiniRouter] Not inside a mini app created with createMiniApp().");
  return o;
}
function G() {
  const { superApp: o, moduleId: t } = K(), i = o.$i18n;
  return { i18n: i, t: (e, d) => i.te(`${t}.${e}`) ? i.t(`${t}.${e}`, d) : i.t(e, d), get locale() {
    return i.locale;
  }, setLocale: (e) => i.setLocale(e) };
}
function K() {
  const o = y(F);
  if (!o) throw new Error("[useMiniApp] Not inside a mini app created with createMiniApp().");
  return o;
}
export {
  U as FeatureView,
  B as createFeatureRouter,
  z as createMiniApp,
  q as defineFeature,
  N as defineMfeModule,
  G as useI18n,
  K as useMiniApp,
  D as useMiniRouter
};
//# sourceMappingURL=mfe.js.map
