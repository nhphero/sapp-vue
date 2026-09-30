import type { ISapp, SappOptions } from '../contracts';
/**
 * 🚀 createSapp — boot the Super App shell.
 *
 * Order matters and mirrors the kernel expectations: bridge → Vue/Pinia → discovery → kernel →
 * theme (registers `ui.*` etc.) → protocols → business modules → kernel init → app state →
 * features (pages/components of this Shell) → mount.
 */
export declare function createSapp(options: SappOptions): Promise<ISapp>;
//# sourceMappingURL=createSapp.d.ts.map