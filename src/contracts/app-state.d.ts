/**
 * 🧠 Global App State Contract (ESA v5)
 * Cross-module reactive state persisted to localStorage, exposed as
 * `superApp.$appState` and `globalProperties.$appState`.
 */
export interface IAppState {
    /** Id of the MFE currently in the foreground. */
    current_app: string;
    /** Id of the active workspace; sent as `x-workspace-id` by the api protocol. */
    current_workspace: string | number | null;
    /** Workspace cache populated from discovery. */
    workspaces: any[];
}
export declare const APP_STATE_STORAGE_KEY = "app_state";
export declare const REGISTERED_APPS_STORAGE_KEY = "erp_registered_apps";
/** Default (system) app ids the user renamed; they are not re-added by getRegisteredApps. */
export declare const HIDDEN_DEFAULT_APPS_STORAGE_KEY = "erp_registered_apps_hidden";
export declare const ACCESS_TOKEN_STORAGE_KEY = "accessToken";
export declare const ACTIVE_WORKSPACE_STORAGE_KEY = "activeWorkspaceId";
//# sourceMappingURL=app-state.d.ts.map