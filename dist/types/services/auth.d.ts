import type { IAuthState } from '../contracts';
/**
 * Reactive auth state behind `$auth` / `superApp.$authState`. It holds no storage and knows no
 * token format: the Shell decides what a session is (SSO or password) and tells it here.
 */
export declare function createAuthState(): IAuthState;
//# sourceMappingURL=auth.d.ts.map