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
export declare function mfeScopedCssPlugin(options?: MfeScopedCssOptions): Plugin;
//# sourceMappingURL=vite-plugin-mfe-scoped-css.d.ts.map