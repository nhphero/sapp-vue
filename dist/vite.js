import { createRequire as m } from "module";
import { join as h } from "path";
import { existsSync as _, readFileSync as g } from "node:fs";
import { join as l } from "node:path";
function S() {
  let o = null;
  return {
    name: "vite-plugin-vue-bridge",
    enforce: "pre",
    configResolved(n) {
      try {
        const a = m(h(n.root, "package.json"))("vue"), s = Object.keys(a).filter(
          (t) => t !== "__esModule" && t !== "default" && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(t)
        ), e = [
          "const _Vue = window.__MF_BRIDGE__?.Vue;",
          'if (!_Vue) console.error("🚨 [VUE_BRIDGE] Fatal: window.__MF_BRIDGE__.Vue not found!");'
        ];
        for (const t of s)
          e.push(`export const ${t} = _Vue.${t};`);
        e.push("export const isVue2 = false;"), e.push("export const isVue3 = true;"), e.push("export const Vue = _Vue;"), e.push("export const Vue2 = undefined;"), e.push("export const install = function() {};"), e.push("export const set = function(t, k, v) { t[k] = v; };"), e.push("export const del = function(t, k) { delete t[k]; };"), e.push("export default _Vue;"), o = e.join(`
`);
      } catch (r) {
        console.error("[VUE_BRIDGE] Failed to read Vue exports:", r), o = `export * from 'vue';
export { default } from 'vue';`;
      }
    },
    resolveId(n) {
      return n === "vue" || n === "vue-demi" ? "\0virtual:vue-bridge" : null;
    },
    load(n) {
      return n === "\0virtual:vue-bridge" ? o : null;
    }
  };
}
function y(o) {
  let n = 2166136261;
  for (let r = 0; r < o.length; r++)
    n ^= o.charCodeAt(r), n = Math.imul(n, 16777619);
  return (n >>> 0).toString(16).padStart(8, "0");
}
const d = /@property\s+--[\w-]+\s*\{[^}]*\}/g;
function j(o = {}) {
  const n = o.match ?? ((s) => /\/mfe\.css(\?|$)/.test(s));
  let r = o.id ?? "", a = o.scope ?? "";
  return {
    name: "sapp:mfe-scoped-css",
    configResolved(s) {
      if (!r) {
        const t = (i) => {
          try {
            return _(l(s.root, i)) ? JSON.parse(g(l(s.root, i), "utf8")) : null;
          } catch {
            return null;
          }
        }, c = t("manifest.json");
        r = String(c?.app?.id ?? c?.name ?? t("package.json")?.name ?? "mfe").replace(/^@[^/]+\//, "");
      }
      const e = JSON.stringify(r);
      a ||= `[data-mfe=${e}], [data-portal=${e}]`;
    },
    transform(s, e) {
      if (!n(e) || !s.trim()) return null;
      const t = s.match(d) ?? [], c = s.replace(d, "");
      return { code: `${t.join(`
`)}
@scope (${a}) {
${c}
}
`, map: null };
    },
    // `post`: Vite's own CSS plugin emits the library's style.css in generateBundle — run after it.
    generateBundle: {
      order: "post",
      handler(s, e) {
        const t = Object.values(e).find((u) => u.type === "chunk" && u.isEntry);
        if (!t || t.type !== "chunk" || (t.code += `
export const __sappCssScope = ${JSON.stringify(r)};
`, o.inlineCss === !1)) return;
        const c = Object.values(e).filter((u) => u.type === "asset" && u.fileName.endsWith(".css"));
        if (!c.length) return;
        const i = c.map((u) => u.type === "asset" ? String(u.source) : "").join(`
`), p = `sapp-css-${y(i)}`, f = `(()=>{if(typeof document==='undefined'||document.getElementById(${JSON.stringify(p)}))return;const s=document.createElement('style');s.id=${JSON.stringify(p)};s.textContent=${JSON.stringify(i)};document.head.appendChild(s);})();
`;
        t.code = f + t.code;
        for (const u of c) delete e[u.fileName];
      }
    }
  };
}
export {
  j as mfeScopedCssPlugin,
  S as vueBridgePlugin
};
//# sourceMappingURL=vite.js.map
