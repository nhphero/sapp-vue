import type { IEnvironment } from '../contracts';

/** `superApp.$env` over the kernel's reactive `state.environment` (see contracts/env.ts). */
export function createEnvironment(source: () => Record<string, string> | undefined): IEnvironment {
  const value = (key: string): string | undefined => {
    const raw = source()?.[key];
    return typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : undefined;
  };
  return {
    get values() {
      return { ...(source() ?? {}) };
    },
    get(key: string, fallback?: string): any {
      return value(key) ?? fallback;
    },
    has: key => value(key) !== undefined,
    missing: (...keys) => keys.filter(key => value(key) === undefined),
    require(key) {
      const found = value(key);
      if (found === undefined) {
        const error = new Error(`The public environment ${key} is not set — Admin → Public Environment.`);
        error.name = 'EnvironmentMissing';
        throw error;
      }
      return found;
    },
  };
}
