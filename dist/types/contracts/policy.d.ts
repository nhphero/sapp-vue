/**
 * 🛡️ Policy contract — one place that answers "may the current user do X?".
 *
 *   {{ $policy.can('role', 'DOCS_MNGT_SIGN_REQUEST_SIGN') }}
 *   <button v-if="$policy.can('role', { any: ['P_BP_E_SIGNER', 'P_BP_E_SIGN_REQUEST'] })">…</button>
 *   superApp.$policy.can('role', { all: ['manage-users'], client: 'realm-management' })
 *
 * A policy is a set of named **strategies**. Each strategy owns one kind of rule (roles today;
 * data access later) and is registered once by the Shell. Callers never look at roles or tokens
 * themselves — they ask the policy, so the rule can change in one place.
 *
 * Template global `$policy`, `inject('$policy')`, `superApp.$policy` (registered as a protocol),
 * and `app.usePolicy()` in a mini app.
 */
import type { IAuthState } from './auth';
/** What a strategy gets to decide with. Grows as strategies need more (e.g. the current workspace). */
export interface PolicyContext {
    auth: IAuthState;
}
/**
 * Requirement of the `role` strategy:
 * - `'CODE'` — holds that role (realm or any client);
 * - `['A', 'B']` — holds at least one;
 * - `{ any?, all?, client? }` — every `all` and at least one `any`, optionally on one client only.
 */
export type RoleRequirement = string | readonly string[] | {
    any?: readonly string[];
    all?: readonly string[];
    client?: string;
};
/**
 * Strategy id → the requirement it accepts. Augment it when registering a new strategy, so
 * `can('<id>', …)` is type-checked everywhere:
 *
 *   declare module '@nhphero/vue-sapp/contracts' {
 *     interface PolicyStrategies { data: DataRequirement }
 *   }
 */
export interface PolicyStrategies {
    role: RoleRequirement;
}
export type PolicyStrategyId = keyof PolicyStrategies & string;
export interface PolicyStrategy<TRequirement = unknown> {
    id: string;
    /** Pure and synchronous: it runs inside templates and must stay reactive on `ctx`. */
    check(requirement: TRequirement, ctx: PolicyContext): boolean;
}
export interface IPolicyService {
    readonly id: 'policy';
    /** Adds a strategy. Throws if the id is taken — two rules for one name is a bug, not an override. */
    register<K extends PolicyStrategyId>(strategy: PolicyStrategy<PolicyStrategies[K]> & {
        id: K;
    }): void;
    has(id: string): boolean;
    /** Registered strategy ids. */
    strategies(): string[];
    /**
     * Evaluates one strategy. An unknown strategy **denies** (and warns once) — a typo must never grant access.
     */
    can<K extends PolicyStrategyId>(id: K, requirement: PolicyStrategies[K]): boolean;
    cannot<K extends PolicyStrategyId>(id: K, requirement: PolicyStrategies[K]): boolean;
}
//# sourceMappingURL=policy.d.ts.map