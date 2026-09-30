import { createRequire as c } from "module";
import { join as i } from "path";
function f() {
  let n = null;
  return {
    name: "vite-plugin-vue-bridge",
    enforce: "pre",
    configResolved(t) {
      try {
        const r = c(i(t.root, "package.json"))("vue"), s = Object.keys(r).filter(
          (o) => o !== "__esModule" && o !== "default" && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(o)
        ), e = [
          "const _Vue = window.__MF_BRIDGE__?.Vue;",
          'if (!_Vue) console.error("🚨 [VUE_BRIDGE] Fatal: window.__MF_BRIDGE__.Vue not found!");'
        ];
        for (const o of s)
          e.push(`export const ${o} = _Vue.${o};`);
        e.push("export const isVue2 = false;"), e.push("export const isVue3 = true;"), e.push("export const Vue = _Vue;"), e.push("export const Vue2 = undefined;"), e.push("export const install = function() {};"), e.push("export const set = function(t, k, v) { t[k] = v; };"), e.push("export const del = function(t, k) { delete t[k]; };"), e.push("export default _Vue;"), n = e.join(`
`);
      } catch (u) {
        console.error("[VUE_BRIDGE] Failed to read Vue exports:", u), n = `export * from 'vue';
export { default } from 'vue';`;
      }
    },
    resolveId(t) {
      return t === "vue" || t === "vue-demi" ? "\0virtual:vue-bridge" : null;
    },
    load(t) {
      return t === "\0virtual:vue-bridge" ? n : null;
    }
  };
}
const p = /@property\s+--[\w-]+\s*\{[^}]*\}/g;
function d(n = {}) {
  const t = n.match ?? ((r) => /\/mfe\.css(\?|$)/.test(r)), u = n.scope ?? "#module-viewport, [data-portal]";
  return {
    name: "sapp:mfe-scoped-css",
    transform(r, s) {
      if (!t(s) || !r.trim()) return null;
      const e = r.match(p) ?? [], o = r.replace(p, "");
      return { code: `${e.join(`
`)}
@scope (${u}) {
${o}
}
`, map: null };
    }
  };
}
export {
  d as mfeScopedCssPlugin,
  f as vueBridgePlugin
};
//# sourceMappingURL=vite.js.map
