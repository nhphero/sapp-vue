/**
 * 🌉 Shell-side bridge installer.
 * Call once in the Shell's `main.ts` before loading any remote module.
 */
import type { MfBridge } from '../contracts';
import { MF_BRIDGE_GLOBAL } from '../contracts';

export function installMfBridge(bridge: MfBridge): MfBridge {
  (globalThis as any)[MF_BRIDGE_GLOBAL] = bridge;
  return bridge;
}

export function getMfBridge(): MfBridge | undefined {
  return (globalThis as any)[MF_BRIDGE_GLOBAL];
}
