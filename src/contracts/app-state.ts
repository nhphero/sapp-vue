/**
 * 🧠 Global App State Contract (ESA v5)
 * Cross-module reactive state persisted to localStorage, exposed as
 * `superApp.$appState` and `globalProperties.$appState`.
 */

export interface IAppState {
  /** Id of the MFE currently in the foreground. */
  current_app: string;
}

export const APP_STATE_STORAGE_KEY = 'app_state';
export const REGISTERED_APPS_STORAGE_KEY = 'erp_registered_apps';
/** Default (system) app ids the user renamed; they are not re-added by getRegisteredApps. */
export const HIDDEN_DEFAULT_APPS_STORAGE_KEY = 'erp_registered_apps_hidden';
export const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';
