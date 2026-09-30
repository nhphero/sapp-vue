# @nhphero/vue-sapp

Super App (ESA) architecture extracted from `master-app`: the host kernel, core protocols, discovery/app-state services, the micro-frontend bridge and the contracts every party codes against.

## Layout

| Path | Contents |
| --- | --- |
| `src/contracts/` | `ISuperApp`, `ISuperAppCore`, `IProtocol`, `ISuperAppModule`, `IMfeModule`, registry shapes, transport/discovery/app-state contracts, storage keys, events, endpoints |
| `src/kernel/` | `SuperApp` class (implements `ISuperApp`) |
| `src/protocols/` | `ApiProtocol` (`$api`), `SocketProtocol` (`$socket`) |
| `src/services/` | `discoveryService`, `createAppState` |
| `src/bridge/` | `installMfBridge` (Shell) and `vue` / `pinia` / `vue-router` proxies for MFE bundles |
| `src/app/` | `createSapp` (boots the whole Shell) and `defineShellFeature` |
| `src/mfe/` | `createMiniApp`, `defineFeature`, feature router, `FeatureView`, `useMiniRouter` / `useMiniApp` for mini apps |
| `src/vite/` | `vueBridgePlugin` for MFE `vite.config.ts` |

## Usage

Shell (`master-app/src/main.ts`):

```ts
import { createSapp } from '@nhphero/vue-sapp';
const sapp = await createSapp({ root: App, layout: DashboardLayout, theme: defaultTheme, tokens: THEME, manifest: APP_REGISTRY, modules: installBusinessModules, features: shellFeatures });
sapp.mount('#app');
// the low-level pieces stay exported: SuperApp, ApiProtocol, SocketProtocol, discoveryService, createAppState, installMfBridge
```

Micro-frontend entry (`admin-app`, `demo-app` template):

```ts
import { createMiniApp, defineFeature } from '@nhphero/vue-sapp/mfe';

const dashboard = defineFeature({
  id: 'dashboard',
  install(ctx) {
    ctx.registerRoute({ path: '', component: () => import('./features/dashboard/DashboardView.vue'), meta: { title: 'Dashboard', nav: true } });
    ctx.registerComponent({ id: 'hello-card', component: () => import('./features/dashboard/HelloCard.vue') }); // → mini.hello-card
  },
});

export default createMiniApp({ id: 'mini', name: 'Mini App', layout: () => import('./layouts/MainLayout.vue'), features: [dashboard] });
// or hand-written: defineMfeModule({ id, name, install(app, superApp: ISuperApp) { ... } }) from '@nhphero/vue-sapp/contracts'
```

MFE `vite.config.ts`:

```ts
import { vueBridgePlugin } from '../../../packages/vue-sapp/src/vite';
```

## Install (outside this repo)

```bash
npm i @nhphero/vue-sapp            # Shell or mini app
npm i -g @nhphero/sapp-cli && sapp create my-app --id my --port 4420
```

Entries: `@nhphero/vue-sapp` (Shell: createSapp, kernel…), `/contracts`, `/mfe` (createMiniApp, defineFeature…), `/app`, `/vite` (vueBridgePlugin, mfeScopedCssPlugin), `/bridge/vue|pinia|vue-router`. Build with `npm run build` (vite lib + vue-tsc declarations).

## Resolution (inside this monorepo)

Apps consume the package as source. Each app aliases `@nhphero/vue-sapp` to `../../../packages/vue-sapp/src/index.ts` in `vite.config.ts` and `tsconfig.json`, and `docker-compose.yml` mounts `./packages` at `/packages` so the same relative path resolves inside containers.
