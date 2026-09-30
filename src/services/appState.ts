import { reactive } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import type { IAppState } from '../contracts';
import { APP_STATE_STORAGE_KEY } from '../contracts';

/**
 * 🛰️ AppState (ESA v5 - Global Hub)
 * Centralized state for cross-module synchronization.
 * Handles persistence for active app and active workspace via VueUse.
 */
export const createAppState = (): IAppState => {
  // 💾 Reactive Persistent State using VueUse
  const storage = useLocalStorage<any>(APP_STATE_STORAGE_KEY, {
    current_app: 'workspace',
    current_workspace: null
  });

  // 🛡️ Guard: If storage was polluted with a string or invalid data, reset it
  if (typeof storage.value !== 'object' || storage.value === null) {
    console.warn('⚠️ [AppState] Invalid storage detected, resetting to defaults.');
    storage.value = {
      current_app: 'workspace',
      current_workspace: null
    };
  }

  // Return a reactive proxy so we don't have to deal with .value everywhere
  return reactive<IAppState>({
    get current_app() { return storage.value.current_app },
    set current_app(val) { storage.value.current_app = val },
    
    get current_workspace() { return storage.value.current_workspace },
    set current_workspace(val) { 
      // Ensure we have an object to write to
      if (typeof storage.value !== 'object') {
        storage.value = { current_app: 'workspace', current_workspace: val };
      } else {
        storage.value.current_workspace = val;
      }
    },

    // 🏢 Global Workspace Cache (Populated from Discovery)
    workspaces: [] as any[]
  });
};
