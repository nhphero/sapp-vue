import type { Plugin } from 'vite';

export interface MfeScopedCssOptions {
  /** Which CSS modules to wrap (default: files named `mfe.css`). */
  match?: (id: string) => boolean;
  /** `@scope` selector list: the module viewport of the Shell plus any teleported surfaces. */
  scope?: string;
  /**
   * Build only: put the app's extracted CSS into its entry chunk, injected as a `<style>` when the
   * Shell imports it (default true). A library build writes CSS to a separate `style.css` that
   * nothing loads — the Shell only imports the entry JS.
   */
  inlineCss?: boolean;
}

/** FNV-1a — a short, stable key for the injected `<style>` (no node built-ins in this module). */
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
 * `@scope (#module-viewport, [data-portal]) { … }`.
 *
 * Two Tailwind builds share one document (Shell + mini app). Without scoping, the mini app's
 * base utilities (`.text-sm`, `.grid-cols-1`) come later in the document and beat the Shell's
 * responsive rules (`.md:text-lg`) on Shell pages. Scoping keeps mini-app utilities inside the
 * module viewport, where the mini app's own sheet is self-consistent.
 *
 * In a build it also inlines the CSS into the entry chunk (see `inlineCss`): a bundle served as
 * static files (a package version, a production image) then carries its own styles. The `<style>`
 * is keyed by a hash of the CSS, so loading the same build twice injects it once.
 */
export function mfeScopedCssPlugin(options: MfeScopedCssOptions = {}): Plugin {
  const match = options.match ?? ((id: string) => /\/mfe\.css(\?|$)/.test(id));
  const scope = options.scope ?? '#module-viewport, [data-portal]';
  return {
    name: 'sapp:mfe-scoped-css',
    transform(code, id) {
      if (!match(id) || !code.trim()) return null;
      const properties = code.match(PROPERTY_RE) ?? [];
      const body = code.replace(PROPERTY_RE, '');
      return { code: `${properties.join('\n')}\n@scope (${scope}) {\n${body}\n}\n`, map: null };
    },
    generateBundle(_options, bundle) {
      if (options.inlineCss === false) return;
      const sheets = Object.values(bundle).filter(file => file.type === 'asset' && file.fileName.endsWith('.css'));
      const entry = Object.values(bundle).find(file => file.type === 'chunk' && file.isEntry);
      if (!sheets.length || !entry || entry.type !== 'chunk') return;
      const css = sheets.map(sheet => (sheet.type === 'asset' ? String(sheet.source) : '')).join('\n');
      const key = `sapp-css-${hash(css)}`;
      const inject = `(()=>{if(typeof document==='undefined'||document.getElementById(${JSON.stringify(key)}))return;`
        + `const s=document.createElement('style');s.id=${JSON.stringify(key)};s.textContent=${JSON.stringify(css)};`
        + `document.head.appendChild(s);})();\n`;
      entry.code = inject + entry.code;
      for (const sheet of sheets) delete bundle[sheet.fileName];
    },
  };
}
