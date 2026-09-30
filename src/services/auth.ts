import { reactive } from 'vue';
import type { AuthProvider, AuthSession, AuthUser, IAuthState } from '../contracts';

/**
 * Reactive auth state behind `$auth` / `superApp.$authState`. It holds no storage and knows no
 * token format: the Shell decides what a session is (SSO or password) and tells it here.
 */
export function createAuthState(): IAuthState {
  const data = reactive({
    user: null as AuthUser | null,
    realmRoles: [] as string[],
    clientRoles: {} as Record<string, string[]>,
    provider: null as AuthProvider | null,
  });

  function allRoles(): string[] {
    return [...new Set([...data.realmRoles, ...Object.values(data.clientRoles).flat()])];
  }

  /**
   * Role codes compare case-insensitively: Keycloak mixes `admin` and `ADMIN`, legacy accounts use
   * `ADMIN`, and a rule must not depend on how one realm happened to spell it. Both sides are
   * lowercased; the stored lists keep their original spelling for display.
   */
  const norm = (role: string) => role.toLowerCase();
  const heldAnywhere = () => new Set(allRoles().map(norm));

  return reactive({
    get user() {
      return data.user;
    },
    get roles() {
      return allRoles();
    },
    get realmRoles() {
      return data.realmRoles;
    },
    get clientRoles() {
      return data.clientRoles;
    },
    get provider() {
      return data.provider;
    },
    get isAuthenticated() {
      return data.user !== null;
    },
    hasRole(role: string, client?: string): boolean {
      if (client !== undefined) {
        return (data.clientRoles[client] ?? []).some(held => norm(held) === norm(role));
      }
      return heldAnywhere().has(norm(role));
    },
    hasAnyRole(...roles: string[]): boolean {
      const held = heldAnywhere();
      return roles.some(role => held.has(norm(role)));
    },
    set(session: AuthSession): void {
      // An internal account has one legacy role and no realm; it still answers `hasRole()`.
      const fallback = session.user.role ? [session.user.role] : [];
      data.realmRoles = [...(session.realmRoles ?? fallback)];
      data.clientRoles = Object.fromEntries(
        Object.entries(session.clientRoles ?? {}).map(([client, roles]) => [client, [...roles]]),
      );
      data.provider = session.provider;
      // The roles are also on the user, so `{{ $auth.user }}` is the whole picture in one object.
      data.user = {
        ...session.user,
        roles: allRoles(),
        realmRoles: data.realmRoles,
        clientRoles: data.clientRoles,
      };
    },
    patchUser(fields: Partial<AuthUser>): void {
      if (!data.user) {
        return;
      }
      // Roles come from the session (`set()`), never from a profile patch that may carry a stale copy.
      const { roles, realmRoles, clientRoles, ...profile } = fields;
      data.user = { ...data.user, ...profile };
    },
    clear(): void {
      data.user = null;
      data.realmRoles = [];
      data.clientRoles = {};
      data.provider = null;
    },
  }) as IAuthState;
}
