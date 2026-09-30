/**
 * @nhphero/vue-sapp/mfe — runtime helpers for mini apps.
 * Imports `vue`, which resolves to the Shell bridge inside an MFE bundle
 * (vueBridgePlugin / dedupe). Do not import from the Shell.
 */
export { createMiniApp } from './createMiniApp';
export { createFeatureRouter } from './router';
export { FeatureView } from './FeatureView';
export { useMiniRouter, useMiniApp, useI18n } from './composables';
export { defineFeature, defineMfeModule } from '../contracts';
export type * from '../contracts/feature';
//# sourceMappingURL=index.d.ts.map