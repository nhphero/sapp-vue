/**
 * 🔑 Auth state contract — who is signed in, read the same way in every template and mini app.
 *
 *   {{ $auth.user?.name }}
 *   <button v-if="$auth.hasRole('DOCS_MNGT_SIGN_REQUEST_SIGN')">…</button>
 *
 * Template global `$auth`, `inject('$auth')`, and `superApp.$authState` in script — NOT
 * `superApp.$auth`, which the kernel resolves to the `auth` business module.
 *
 * Readers only read. The Shell's sign-in code (SSO or password) is the only writer: it calls
 * `set()` after a sign-in or token refresh, `patchUser()` after a profile change, `clear()` on
 * sign-out. It is reactive, so templates update on their own.
 */

export type AuthProvider = 'sso' | 'local';

export interface AuthUser {
  id: string;
  username: string;
  name?: string | null;
  email?: string | null;
  /** Data URL or URL; `null` when the user has none. */
  avatar?: string | null;
  /** Legacy single role of an internal account (`ADMIN`, `SUPERADMIN`, `USER`). */
  role?: string;
  /** Every role held (realm + all clients), de-duplicated — same as `$auth.roles`. Filled by the auth state. */
  roles?: string[];
  /** Realm roles — same as `$auth.realmRoles`. */
  realmRoles?: string[];
  /** Client roles by client id — same as `$auth.clientRoles`. */
  clientRoles?: Record<string, string[]>;
}

export interface AuthSession {
  user: AuthUser;
  /** Realm-level roles. For SSO: every `realm_access.roles` entry, unfiltered. */
  realmRoles?: string[];
  /** Client roles by client id. For SSO: every `resource_access.<client>.roles` entry, unfiltered. */
  clientRoles?: Record<string, string[]>;
  provider: AuthProvider;
}

export interface IAuthState {
  readonly user: AuthUser | null;
  /** Every role the user holds — realm and all clients — flattened and de-duplicated. The main authorisation input. */
  readonly roles: readonly string[];
  readonly realmRoles: readonly string[];
  readonly clientRoles: Readonly<Record<string, readonly string[]>>;
  readonly provider: AuthProvider | null;
  readonly isAuthenticated: boolean;
  /**
   * Role code, compared case-insensitively (`admin` = `ADMIN`). Without `client`: held anywhere (realm or any client).
   * With `client`: held on that client only — `hasRole('manage-users', 'realm-management')`.
   */
  hasRole(role: string, client?: string): boolean;
  /** Any of the codes, held anywhere. */
  hasAnyRole(...roles: string[]): boolean;

  // ── Writers: the Shell's sign-in code only ──
  set(session: AuthSession): void;
  patchUser(fields: Partial<AuthUser>): void;
  clear(): void;
}
