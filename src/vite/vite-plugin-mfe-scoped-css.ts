import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

export interface MfeScopedCssOptions {
  /** Which CSS modules to wrap (default: files named `mfe.css`). */
  match?: (id: string) => boolean;
  /**
   * This app's scope key — the Shell marks the app's viewport `data-mfe="<key>"` and the app's
   * teleported surfaces `data-portal="<key>"`. Default: `app.id`, else `name`, of the app's
   * manifest.json (= its MODULE_ID), else the package.json name.
   */
  id?: string;
  /** `@scope` selector list (default: built from `id`). */
  scope?: string;
  /**
   * Build only: put the app's extracted CSS into its entry chunk, injected as a `<style>` when the
   * Shell imports it (default true). A library build writes CSS to a separate `style.css` that
   * nothing loads — the Shell only imports the entry JS.
   */
  inlineCss?: boolean;
}

/** FNV-1a — a short, stable id for the injected `<style>`. */
function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Top-level `@property` registrations are not allowed inside `@scope`; hoist them. */
const PROPERTY_RE = /@property\s+--[\w-]+\s*\{[^}]*\}/g;

/**
 * Vite plugin (mini apps): wraps the compiled utilities of `mfe.css` in
 * `@scope ([data-mfe="<id>"], [data-portal="<id>"]) { … }` — this app's viewport and its own
 * teleported surfaces, nothing else.
 *
 * Several Tailwind builds share one document (the Shell + every mini app opened so far — a sheet
 * stays in <head> after its app is left). Without scoping, a mini app's base utilities
 * (`.text-sm`, `.flex-col`) come later in the document and beat the responsive rules
 * (`.md:flex-row`) of the Shell and of every other app. Per-app scoping keeps each sheet on its own
 * app, where it is self-consistent. The Shell reads the key from the entry's `__sappCssScope`
 * export (written here in a build), else the module's id (`superApp.getModuleCssScope`).
 *
 * In a build it also inlines the CSS into the entry chunk (see `inlineCss`): a bundle served as
 * static files (a package version, a production image) then carries its own styles. The `<style>`
 * is keyed by a hash of the CSS, so loading the same build twice injects it once.
 */
export function mfeScopedCssPlugin(options: MfeScopedCssOptions = {}): Plugin {
  const match = options.match ?? ((id: string) => /\/mfe\.css(\?|$)/.test(id));
  let key = options.id ?? '';
  let scope = options.scope ?? '';
  return {
    name: 'sapp:mfe-scoped-css',
    configResolved(config) {
      if (!key) {
        const read = (file: string) => {
          try {
            return existsSync(join(config.root, file)) ? JSON.parse(readFileSync(join(config.root, file), 'utf8')) : null;
          } catch {
            return null;
          }
        };
        const manifest = read('manifest.json');
        key = String(manifest?.app?.id ?? manifest?.name ?? read('package.json')?.name ?? 'mfe').replace(/^@[^/]+\//, '');
      }
      const attr = JSON.stringify(key);
      scope ||= `[data-mfe=${attr}], [data-portal=${attr}]`;
    },
    transform(code, id) {
      if (!match(id) || !code.trim()) return null;
      const properties = code.match(PROPERTY_RE) ?? [];
      const body = code.replace(PROPERTY_RE, '');
      return { code: `${properties.join('\n')}\n@scope (${scope}) {\n${body}\n}\n`, map: null };
    },
    // `post`: Vite's own CSS plugin emits the library's style.css in generateBundle — run after it.
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const entry = Object.values(bundle).find(file => file.type === 'chunk' && file.isEntry);
        if (!entry || entry.type !== 'chunk') return;
        // The key the Shell marks this app's viewport with — read from the entry's exports.
        entry.code += `\nexport const __sappCssScope = ${JSON.stringify(key)};\n`;
        if (options.inlineCss === false) return;
        const sheets = Object.values(bundle).filter(file => file.type === 'asset' && file.fileName.endsWith('.css'));
        if (!sheets.length) return;
        const css = sheets.map(sheet => (sheet.type === 'asset' ? String(sheet.source) : '')).join('\n');
        const styleId = `sapp-css-${hash(css)}`;
        const inject = `(()=>{if(typeof document==='undefined'||document.getElementById(${JSON.stringify(styleId)}))return;`
          + `const s=document.createElement('style');s.id=${JSON.stringify(styleId)};s.textContent=${JSON.stringify(css)};`
          + `document.head.appendChild(s);})();\n`;
        entry.code = inject + entry.code;
        for (const sheet of sheets) delete bundle[sheet.fileName];
      },
    },
  };
}
