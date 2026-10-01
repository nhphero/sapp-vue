import { createRequire as d } from "module";
import { join as f } from "path";
function v() {
  let o = null;
  return {
    name: "vite-plugin-vue-bridge",
    enforce: "pre",
    configResolved(t) {
      try {
        const u = d(f(t.root, "package.json"))("vue"), c = Object.keys(u).filter(
          (n) => n !== "__esModule" && n !== "default" && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(n)
        ), e = [
          "const _Vue = window.__MF_BRIDGE__?.Vue;",
          'if (!_Vue) console.error("🚨 [VUE_BRIDGE] Fatal: window.__MF_BRIDGE__.Vue not found!");'
        ];
        for (const n of c)
          e.push(`export const ${n} = _Vue.${n};`);
        e.push("export const isVue2 = false;"), e.push("export const isVue3 = true;"), e.push("export const Vue = _Vue;"), e.push("export const Vue2 = undefined;"), e.push("export const install = function() {};"), e.push("export const set = function(t, k, v) { t[k] = v; };"), e.push("export const del = function(t, k) { delete t[k]; };"), e.push("export default _Vue;"), o = e.join(`
`);
      } catch (s) {
        console.error("[VUE_BRIDGE] Failed to read Vue exports:", s), o = `export * from 'vue';
export { default } from 'vue';`;
      }
    },
    resolveId(t) {
      return t === "vue" || t === "vue-demi" ? "\0virtual:vue-bridge" : null;
    },
    load(t) {
      return t === "\0virtual:vue-bridge" ? o : null;
    }
  };
}
function m(o) {
  let t = 2166136261;
  for (let s = 0; s < o.length; s++)
    t ^= o.charCodeAt(s), t = Math.imul(t, 16777619);
  return (t >>> 0).toString(16).padStart(8, "0");
}
const l = /@property\s+--[\w-]+\s*\{[^}]*\}/g;
function g(o = {}) {
  const t = o.match ?? ((u) => /\/mfe\.css(\?|$)/.test(u)), s = o.scope ?? "#module-viewport, [data-portal]";
  return {
    name: "sapp:mfe-scoped-css",
    transform(u, c) {
      if (!t(c) || !u.trim()) return null;
      const e = u.match(l) ?? [], n = u.replace(l, "");
      return { code: `${e.join(`
`)}
@scope (${s}) {
${n}
}
`, map: null };
    },
    // `post`: Vite's own CSS plugin emits the library's style.css in generateBundle — run after it.
    generateBundle: {
      order: "post",
      handler(u, c) {
        if (o.inlineCss === !1) return;
        const e = Object.values(c).filter((r) => r.type === "asset" && r.fileName.endsWith(".css")), n = Object.values(c).find((r) => r.type === "chunk" && r.isEntry);
        if (!e.length || !n || n.type !== "chunk") return;
        const i = e.map((r) => r.type === "asset" ? String(r.source) : "").join(`
`), p = `sapp-css-${m(i)}`, a = `(()=>{if(typeof document==='undefined'||document.getElementById(${JSON.stringify(p)}))return;const s=document.createElement('style');s.id=${JSON.stringify(p)};s.textContent=${JSON.stringify(i)};document.head.appendChild(s);})();
`;
        n.code = a + n.code;
        for (const r of e) delete c[r.fileName];
      }
    }
  };
}
export {
  g as mfeScopedCssPlugin,
  v as vueBridgePlugin
};
//# sourceMappingURL=vite.js.map
