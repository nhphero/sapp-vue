/**
 * The platform environment (Admin → Environment): `GET <backend>/environment.json` — the backend serves
 * it lazily from its cache file, built from the database on a miss. Key → value, merged over the Shell's
 * local config by the DiscoveryService. An unreachable backend gives `{}` (the local config stands).
 */
export async function fetchEnvironment(apiBase: string): Promise<Record<string, string>> {
  if (!apiBase) return {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`${apiBase.replace(/\/+$/, '')}/environment.json`, { cache: 'no-cache', signal: controller.signal });
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Object.fromEntries(Object.entries(data ?? {}).filter(([, value]) => typeof value === 'string')) as Record<string, string>;
  } catch (err: any) {
    console.warn(`🌐 [Environment] ${apiBase}/environment.json unavailable (${err?.message ?? err}) — local config only.`);
    return {};
  } finally {
    clearTimeout(timer);
  }
}

/** Keys the environment never overrides: how the Shell finds the backend that serves it. */
export const ENVIRONMENT_LOCAL_ONLY = ['master_api_url'];
