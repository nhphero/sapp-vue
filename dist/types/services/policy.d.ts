import type { IPolicyService, PolicyContext } from '../contracts';
/**
 * The policy engine: a registry of strategies and `can()`. It knows no rule itself — the Shell
 * registers them (see master-app `features/policy`). `context` is read on every call so a check
 * inside a template tracks the reactive auth state.
 */
export declare function createPolicyService(context: () => PolicyContext): IPolicyService;
//# sourceMappingURL=policy.d.ts.map