/**
 * 🌉 Shell-side bridge installer.
 * Call once in the Shell's `main.ts` before loading any remote module.
 */
import type { MfBridge } from '../contracts';
import { MF_BRIDGE_GLOBAL } from '../contracts';

export function installMfBridge(bridge: MfBridge): MfBridge {
  (globalThis as any)[MF_BRIDGE_GLOBAL] = bridge;
  installHmrFallback();
  return bridge;
}

/**
 * A mini app on its Vite dev server, loaded into a production Shell: @vitejs/plugin-vue's hot code calls
 * `__VUE_HMR_RUNTIME__` (createRecord / rerender / reload / CHANGED_FILE), which only Vue's development
 * build defines — the Shell's Vue is the production one, so every edit threw "not defined". This stand-in
 * applies an edit by reloading the page (edits arriving together give one reload). A development Shell
 * keeps Vue's real runtime (true in-place hot reload); nothing is replaced then.
 */
function installHmrFallback(): void {
  const g = globalThis as any;
  if (g.__VUE_HMR_RUNTIME__ || typeof window === 'undefined') return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const reloadSoon = () => {
    clearTimeout(timer);
    timer = setTimeout(() => window.location.reload(), 150);
  };
  g.__VUE_HMR_RUNTIME__ = {
    isRecorded: () => true,
    createRecord: () => true,
    rerender: reloadSoon,
    reload: reloadSoon,
    CHANGED_FILE: undefined as string | undefined,
  };
}

export function getMfBridge(): MfBridge | undefined {
  return (globalThis as any)[MF_BRIDGE_GLOBAL];
}
