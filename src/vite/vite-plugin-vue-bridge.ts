/**
 * Vite Plugin: Vue Bridge (Operation Bridge of Truth v2)
 * 
 * Dynamically generates a virtual module that re-exports ALL Vue APIs
 * from window.__MF_BRIDGE__.Vue (set by the Shell).
 * 
 * This ensures 100% singleton identity across micro-frontends.
 */
import { createRequire } from 'module';
import { join } from 'path';
import type { Plugin, ResolvedConfig } from 'vite';

export function vueBridgePlugin(): Plugin {
  let vueExportCode: string | null = null;

  return {
    name: 'vite-plugin-vue-bridge',
    enforce: 'pre',

    configResolved(config: ResolvedConfig) {
      // Generate virtual module code ONCE at startup by reading real Vue exports.
      // Resolve `vue` from the consuming app root: this file may live outside it (e.g. /packages).
      try {
        const req = createRequire(join(config.root, 'package.json'));
        const VueModule = req('vue');
        const exportNames = Object.keys(VueModule).filter(
          k => k !== '__esModule' && k !== 'default' && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k)
        );

        const lines = [
          'const _Vue = window.__MF_BRIDGE__?.Vue;',
          'if (!_Vue) console.error("🚨 [VUE_BRIDGE] Fatal: window.__MF_BRIDGE__.Vue not found!");',
        ];

        for (const name of exportNames) {
          lines.push(`export const ${name} = _Vue.${name};`);
        }

        // vue-demi compatibility
        lines.push('export const isVue2 = false;');
        lines.push('export const isVue3 = true;');
        lines.push('export const Vue = _Vue;');
        lines.push('export const Vue2 = undefined;');
        lines.push('export const install = function() {};');
        lines.push('export const set = function(t, k, v) { t[k] = v; };');
        lines.push('export const del = function(t, k) { delete t[k]; };');
        lines.push('export default _Vue;');

        vueExportCode = lines.join('\n');
      } catch (e) {
        console.error('[VUE_BRIDGE] Failed to read Vue exports:', e);
        // Fallback: re-export from real vue package (relative resolution)
        vueExportCode = `export * from 'vue';\nexport { default } from 'vue';`;
      }
    },

    resolveId(source: string) {
      if (source === 'vue' || source === 'vue-demi') {
        return '\0virtual:vue-bridge';
      }
      return null;
    },

    load(id: string) {
      if (id === '\0virtual:vue-bridge') {
        return vueExportCode;
      }
      return null;
    },
  };
}
