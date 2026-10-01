/**
 * The platform environment (Admin → Environment): `GET <backend>/environment.json` — the backend serves
 * it lazily from its cache file, built from the database on a miss. Key → value, merged over the Shell's
 * local config by the DiscoveryService. An unreachable backend gives `{}` (the local config stands).
 */
export declare function fetchEnvironment(apiBase: string): Promise<Record<string, string>>;
/** Keys the environment never overrides: how the Shell finds the backend that serves it. */
export declare const ENVIRONMENT_LOCAL_ONLY: string[];
//# sourceMappingURL=environment.d.ts.map