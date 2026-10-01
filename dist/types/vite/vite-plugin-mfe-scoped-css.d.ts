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
export declare function mfeScopedCssPlugin(options?: MfeScopedCssOptions): Plugin;
//# sourceMappingURL=vite-plugin-mfe-scoped-css.d.ts.map