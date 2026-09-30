const s = {
  VERSION: "2.0.0",
  ENDPOINTS: {
    AUTH: "/auth/v1",
    SYSTEM: "/system/v1",
    INTEGRATION: "/v1/integration",
    PRODUCTION: "/production/v1",
    DB_QUERY: "/system/v1/db-query",
    SUPERAPP_CALL: "/v1/superapp/call",
    DISCOVERY: "/system/v1/discovery"
  }
}, _ = {
  SYSTEM_ERROR: "system:error",
  SYSTEM_GOVERNANCE: "system:governance",
  APPS_UPDATED: "apps:updated",
  /** The user asked to sign out. Emitted before the Shell drops the token, so an auth provider (SSO) can end its own session. */
  AUTH_LOGOUT: "auth:logout"
}, e = "app_state", a = "erp_registered_apps", t = "erp_registered_apps_hidden", A = "accessToken", S = "activeWorkspaceId", T = "__MF_BRIDGE__", o = "$superApp";
function P(E) {
  return E;
}
const R = "sapp.locale", c = "i18n:locale-changed", n = "—";
export {
  A,
  n as E,
  t as H,
  c as I,
  T as M,
  a as R,
  _ as S,
  S as a,
  e as b,
  R as c,
  P as d,
  o as e,
  s as f
};
//# sourceMappingURL=format-BUIIBrkU.js.map
