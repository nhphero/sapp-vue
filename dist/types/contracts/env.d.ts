/**
 * 🌐 `superApp.$env` — the public environment (Admin → Public Environment): key → value, the same for
 * every user, loaded with the Shell's discovery (`<backend>/discovery.json`) before anything renders and
 * reloaded when an admin changes it. Reactive: a `computed` / template that reads it updates by itself.
 *
 *   superApp.$env.get('BIZ_API_SERVER')                → string | undefined
 *   superApp.$env.get('PAGE_SIZE', '20')               → string (the fallback when unset)
 *   superApp.$env.has('BIZ_API_SERVER')                → boolean
 *   superApp.$env.missing('BIZ_API_SERVER', 'X_URL')   → the keys that are not set
 *   superApp.$env.require('BIZ_API_SERVER')            → string, or throws EnvironmentMissing
 *   {{ $env.get('BIZ_API_SERVER') }} · v-if="$env.has('…')"   in templates
 *
 * Values are public (anyone can read discovery.json): never a secret. An empty value counts as unset.
 */
export interface IEnvironment {
    /** Every key → value (read-only snapshot, reactive). */
    readonly values: Readonly<Record<string, string>>;
    get(key: string): string | undefined;
    get(key: string, fallback: string): string;
    has(key: string): boolean;
    /** The keys among `keys` that are not set. */
    missing(...keys: string[]): string[];
    /** The value, or throws an `Error` named `EnvironmentMissing` that says which key to set. */
    require(key: string): string;
}
//# sourceMappingURL=env.d.ts.map