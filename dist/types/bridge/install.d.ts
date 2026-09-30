/**
 * 🌉 Shell-side bridge installer.
 * Call once in the Shell's `main.ts` before loading any remote module.
 */
import type { MfBridge } from '../contracts';
export declare function installMfBridge(bridge: MfBridge): MfBridge;
export declare function getMfBridge(): MfBridge | undefined;
//# sourceMappingURL=install.d.ts.map