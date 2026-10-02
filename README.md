# vue-sapp — the Super App kernel

The kernel of the Super App: `createSapp` boots a Shell, `createMiniApp` defines a mini app, and the
contracts both code against — registry, protocols, discovery, the public environment, auth, policy,
formatting, i18n, the HTTP client and the bridge that makes every mini app share one Vue runtime.

| | |
|---|---|
| Package | npm `@nhphero/vue-sapp` |
| Repo | `nhphero/sapp-vue` (pinned by commit tarball) |
| Used by | every Shell theme and every mini app |
| Peers | `vue`, `pinia`, `vue-router`, `@vueuse/core`, `axios` |

## Features

- **`createSapp`** — boots a Shell in one call: bridge, Vue app, Pinia, discovery, kernel, theme,
  protocols, router, business modules, Shell features.
- **Kernel registry** — components, skills, commands, module entries, protocols, apps; everything is
  resolved by id (`superApp.getComponent(id)`, `$c(id)`).
- **Discovery** — one request at start (`<api>/discovery.json`): public environment, platform
  config, app registry; `superApp.$env` reads the public environment reactively.
- **Mini apps** (`/mfe`) — `createMiniApp({ id, features, layout, messages, setup })`, feature
  router, `FeatureView`; loaded by URL at runtime, CSS scoped per app.
- **Services** — `$auth`, `$policy`, `$f` (format), `$i18n`, `createApi()` (the app's axios client:
  token, request id, errors).
- **Vite plugins** (`/vite`) — `vueBridgePlugin` (one Vue through the Shell's bridge),
  `mfeScopedCssPlugin` (a mini app's utilities apply only inside its viewport).

## Configuration

None of its own: a Shell passes its options to `createSapp`; values come from the Shell's build
environment and the server's discovery.

## Use it

```ts
// a Shell theme — src/bootstrap.ts
import { createSapp } from '@nhphero/vue-sapp';
const sapp = await createSapp({ root: App, layout: DashboardLayout, theme: defaultTheme, tokens: THEME, features: shellFeatures });
sapp.mount('#app');
```

```ts
// a mini app — src/index.ts
import { createMiniApp } from '@nhphero/vue-sapp/mfe';
export default createMiniApp({ id: MODULE_ID, name: MODULE_NAME, layout: () => import('./layouts/MainLayout.vue'), features, messages, setup });
```

```ts
// a mini app — vite.config.ts
import { vueBridgePlugin, mfeScopedCssPlugin } from './node_modules/@nhphero/vue-sapp/src/vite';
```

Entries: `@nhphero/vue-sapp` (Shell), `/contracts`, `/mfe`, `/app`, `/vite`, `/bridge/vue|pinia|vue-router`.

## Develop

```bash
npm install              # from the repo root (npm workspace)
npm run typecheck -w @nhphero/vue-sapp
```

A contract changes first, then the Shell implementation and every caller.

## Deploy

Push to `main`, then re-pin the apps (`sapp update @nhphero/vue-sapp`, or the commit SHA in each
`package.json`, theme included) and reinstall.

## Changes

- **2026-10-02** — No workspace on the frontend (no `x-workspace-id`, no `createApi({ workspace })`, no
  `$appState.current_workspace`); a registry app loads a package build or a URL of its own.
- **2026-10-02** — `IThemeConfig.preview()`, `PlatformConfig.look`; the Shell is a theme.
- **2026-10-01** — `superApp.$env`; `createApi` with a lazy `baseURL` and `onSuccess`; API under `/api`.
