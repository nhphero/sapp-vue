import type { IMfeModule, MiniAppOptions } from '../contracts';
/**
 * Compose a mini app from features. Produces the `IMfeModule` the Shell expects
 * and handles the boilerplate: feature router, module entry, path sync,
 * idempotent install per module id.
 */
export declare function createMiniApp(options: MiniAppOptions): IMfeModule;
//# sourceMappingURL=createMiniApp.d.ts.map