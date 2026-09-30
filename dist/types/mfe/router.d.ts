import type { IFeatureRouter, ISuperApp } from '../contracts';
/**
 * Minimal router for the sub-path a mini app receives from the Shell
 * (`/app/<moduleId>/<subPath>`). Paths are matched against feature routes;
 * navigation is delegated to the Shell's vue-router.
 */
export declare function createFeatureRouter(moduleId: string, superApp: ISuperApp): IFeatureRouter;
//# sourceMappingURL=router.d.ts.map