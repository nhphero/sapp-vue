import type { Plugin } from 'vite';

export interface MfeScopedCssOptions {
  /** Which CSS modules to wrap (default: files named `mfe.css`). */
  match?: (id: string) => boolean;
  /** `@scope` selector list: the module viewport of the Shell plus any teleported surfaces. */
  scope?: string;
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
  };
}
