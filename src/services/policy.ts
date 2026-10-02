import type { IPolicyService, PolicyContext, PolicyStrategy } from '../contracts';

/**
 * The policy engine: a registry of strategies and `can()`. It knows no rule itself — the Shell
 * registers them (see the theme's `features/policy`, e.g. sapp-theme-dashboard). `context` is read on every call so a check
 * inside a template tracks the reactive auth state.
 */
export function createPolicyService(context: () => PolicyContext): IPolicyService {
  const strategies = new Map<string, PolicyStrategy<any>>();
  const warned = new Set<string>();

  function can(id: string, requirement: unknown): boolean {
    const strategy = strategies.get(id);
    if (!strategy) {
      if (!warned.has(id)) {
        warned.add(id);
        console.warn(`[policy] Unknown strategy "${id}" — denied. Registered: ${[...strategies.keys()].join(', ') || 'none'}.`);
      }
      return false;
    }
    return strategy.check(requirement, context());
  }

  return {
    id: 'policy',
    register(strategy) {
      if (strategies.has(strategy.id)) {
        throw new Error(`[policy] Strategy "${strategy.id}" is already registered.`);
      }
      strategies.set(strategy.id, strategy);
    },
    has: (id) => strategies.has(id),
    strategies: () => [...strategies.keys()],
    can: (id, requirement) => can(id, requirement),
    cannot: (id, requirement) => !can(id, requirement),
  };
}
