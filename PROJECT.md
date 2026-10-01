# PROJECT.md — `@nhphero/vue-sapp`

> Tài liệu chi tiết của package kernel. Kiến trúc chung của Super App: [`PROJECT.md`](../../PROJECT.md) ở gốc repo.

Kernel của Super App cho Vue 3: `SuperApp` (registry), protocol, service, bridge Vue dùng chung, `createSapp` (Shell), `createMiniApp` (mini app) và toàn bộ contract. Repo GitHub: `nhphero/sapp-vue` (thư mục này là một git repo riêng).

## Cấu trúc package

| Thư mục | Nội dung | Ai dùng |
| --- | --- | --- |
| `src/contracts/` | `ISuperApp`, `ISuperAppCore`, `IProtocol`, `ISuperAppModule`, `IMfeModule`, registry shapes, transport, discovery, app-state, bridge, hằng số | Shell + mini app |
| `src/kernel/` | class `SuperApp` (implements `ISuperApp`) | Shell |
| `src/protocols/` | `ApiProtocol` (`$api`), `SocketProtocol` (`$socket`) | Shell |
| `src/services/` | `discoveryService` (discovery API → `/config.json` → **`<backend>/environment.json`** đè lên, chờ đầu tiên khi init; `master_api_url` giữ local; `reloadEnvironment()`), `fetchEnvironment`, `createAppState` | Shell |
| `src/bridge/` | `installMfBridge` (Shell), proxy `vue` / `pinia` / `vue-router` (mini app) | cả hai |
| `src/mfe/` | `createMiniApp`, feature router, `FeatureView`, `useMiniRouter`, `useMiniApp` (mini app dùng `app.useApp()` thay vì hook này) | mini app |
| `src/vite/` | `vueBridgePlugin` cho `vite.config.ts` của mini app | mini app |

Entry point:

```ts
import { ... } from '@nhphero/vue-sapp';            // Shell: toàn bộ (kernel + protocols + services + contracts)
import { ... } from '@nhphero/vue-sapp/contracts';  // Mini app: chỉ contracts, không kéo kernel vào bundle
import { ... } from '@nhphero/vue-sapp/mfe';        // Mini app: createMiniApp / FeatureView (import 'vue' qua bridge); feature là object thường
import { vueBridgePlugin } from './node_modules/@nhphero/vue-sapp/src/vite';  // vite.config.ts của mini app
```

## Kernel `SuperApp` — các registry

| Registry | Đăng ký | Resolve | Ghi chú |
| --- | --- | --- | --- |
| Protocol | `registerProtocol(id, instance)` | `getProtocol(id)` hoặc `superApp.$<id>` | `$api`, `$socket` |
| Business module | `await superApp.install(module)` (module tự `registerBusinessModule` trong `install(superApp)`) | `getModule(id)` hoặc `superApp.$<id>` | `$auth`, `$system`; có governance `setModuleEnabled`. `install` nhận cả module kiểu MFE `install(app, superApp)` và hàm thuần; `superApp` truyền vào luôn là Proxy của kernel nên `$api`, `$i18n`… resolve được |
| Component | `registerComponent({ id, component, category? })` | `getComponent(id)` | loader function được bọc `defineAsyncComponent` và cache theo id |
| Module entry | `registerModuleEntry({ moduleId, entryComponentId })` | `getModuleEntry(moduleId)` | root component của mini app |
| Skill | `registerSkill({ id, name, category, icon, handler })` | `superApp.skills` | hiển thị ở sidebar / command palette |
| Command | `registerCommand({ id, name, category, shortcut, handler })` | `runCommand(id)` | ⌘K |
| Path listener | `onPathChange(moduleId, handler)` | `runPathAction(moduleId, subPath)` | routing nội bộ của mini app |
| App (remote / package) | `registerApp / updateApp / deleteApp` (async, admin) | `getRegisteredApps()` | **registry trên server** (bảng `sys_apps`): ghi qua action `apps.registry.save/remove`, Shell đọc file tĩnh `<package files>/registry.json` lúc boot (`loadServerApps()`), sync vào `moduleManifest`. `id` là khoá cố định (UUID do server sinh), `code` là tên máy cố định tuỳ chọn (`admin`…; `getApp` / `appPath` / `findAppByRoute` nhận cả code), `slug` là route đổi được (`updateApp(id, { slug })`). Remote app để trống URL = lấy `<code>.url` của config Shell. Server chưa trả lời thì chỉ có built-in (`admin`, `workspace`) + `registry.apps` của config. `importLocalApps()` đẩy app cũ trong localStorage `erp_registered_apps` (+ `registry.apps` của config) lên server một lần |

Proxy `$`: mọi truy cập `superApp.$xyz` được resolve theo thứ tự protocol → business module (bị chặn nếu `isEnabled === false`) → field thật của class (`$router`, `$message`, `$vue`...).

`superApp.$vue` là bộ primitive Vue (`ref`, `reactive`, `computed`, `h`, `defineComponent`, `useLocalStorage`...) để mini app tạo state mà không cần import `vue`.

## Luồng load một mini app

1. User vào `/app/<slug>/*` (slug = route đổi được của app; id là khoá cố định — `findAppByRoute(slug)` → id, link theo id/slug cũ được chuyển sang slug hiện tại; link tạo bằng `appPath(id, sub)`) → route `AppGateway` render `AppContainer.vue`.
2. `AppContainer` tách `baseModuleId` và `subPath`, gọi `superApp.resolveModule(baseModuleId)`.
3. `resolveModule` tìm URL trong `config.moduleManifest` (từ discovery `admin.url` / `workspace.url`, env `VITE_*_URL`, hoặc registry app), `import(/* @vite-ignore */ url)`, gọi `module.default.install(app, superApp)`, đánh dấu `markModuleInstalled`.
4. `AppContainer` lấy `superApp.getModuleEntry(baseModuleId)` và render bằng `<component :is>`.
5. `superApp.runPathAction(baseModuleId, subPath)` để mini app đồng bộ tab / state nội bộ. Khi route đổi trong cùng module, chỉ bước 5 chạy lại, không remount.

## Contracts chính (tham chiếu nhanh)

```ts
// packages/vue-sapp/src/contracts
interface IMfeModule            { id; name; aliases?; install(app: App, superApp: ISuperApp) }
interface IMfeFeature           { id; name?; install(ctx: MiniAppContext) }                       // object thường, không có defineFeature
interface MiniAppContext        { app; superApp; moduleId; mountId; basePath; config; router: IFeatureRouter; featureId?;
                                  registerRoute; registerComponent; registerGlobalComponent; registerMessages; t; provide }   // không có registerSkill/registerCommand
interface FeatureRoute          { path; name?; component; props?; meta?: { title?; nav?; icon?; order?; [key]: any } }    // titleKey, groupKey, hideTitle, policy… là quy ước của layout
interface IFeatureRouter        { routes; current: { path; route; params }; push(subPath); href(subPath); resolve; sync }
interface MiniAppOptions        { id; name; aliases?; features: IMfeFeature[]; layout?; messages?; defaultPath?; setup?(ctx) }
interface ISuperAppModule       { id; isEnabled?; status?; install(superApp: ISuperAppCore) }   // business module in-process
interface IProtocol             { id; bind?(superApp); request?(path, opts); doAction?(action, params) }
interface ISuperAppCore         extends IEventEmitter { registerProtocol; registerModule; getProtocol; getModule; doAction; ... }
interface ISuperApp             extends ISuperAppCore { state; $vue; $app; $router; $api; $appState; $authState; $message; $dialog; install(plugin);
                                  registerComponent; getComponent; registerModuleEntry; getModuleEntry;
                                  registerSkill; registerCommand; onPathChange; runPathAction;
                                  resolveModule; isModuleInstalled; markModuleInstalled;
                                  registerApp; updateApp; deleteApp; getRegisteredApps; pingApp; [`$${string}`]: any }
interface ComponentRegistration { id; name?; description?; category?; component: Component | () => Promise<any> }
interface SkillRegistration     { id; name; category; description?; icon?; handler }
interface CommandRegistration   { id; name; category; shortcut?; handler }
interface RegisteredApp         { id; name; url; entryUrl; isSystem?; isEnabled?; ... }
interface IAppState             { current_app; current_workspace; workspaces }
interface MfBridge              { Vue; Pinia; VueRouter; VueUse? }
interface ITheme                { id; name; register(app, superApp, { uiStore }): ThemeServices }   // implement bởi sapp-theme-default
interface MessageService / DialogService   // $message (toast + alert/confirm/prompt) / $dialog (contracts/ui.ts)
interface IAuthState                       // $auth trong template, superApp.$authState trong script, app.useAuth() ở mini app (contracts/auth.ts)
interface CreateApi / ApiClientError       // superApp.createApi({ baseURL, headers, onError… }) → axios instance cho backend riêng của app (contracts/api-client.ts)
interface IPolicyService                   // $policy.can('role', …) — protocol `policy`, feature master-app/src/features/policy, app.usePolicy() ở mini app (contracts/policy.ts)

const SUPERAPP_PROTOCOL.ENDPOINTS = { AUTH, SYSTEM, INTEGRATION, PRODUCTION, DB_QUERY, SUPERAPP_CALL, DISCOVERY }
const SUPERAPP_EVENTS            = { SYSTEM_ERROR: 'system:error', SYSTEM_GOVERNANCE: 'system:governance', APPS_UPDATED: 'apps:updated' }
```

## Phân phối và build (cùng sapp-theme-default)

Hai package được phân phối qua **GitHub**, không qua npm registry:

| Package | Repo | Build |
| --- | --- | --- |
| `@nhphero/vue-sapp` | `nhphero/sapp-vue` | `vite build` (lib, ESM, một chunk mỗi entry: `.`, `./contracts`, `./mfe`, `./app`, `./vite`, `./bridge/*`) + `vue-tsc` sinh `.d.ts` vào `dist/types/` |
| `@nhphero/sapp-theme-default` | `nhphero/sapp-vue-theme-default` | `vite build` + `vue-tsc` + copy CSS (`dist/theme.css`, `dist/utilities.css`, `dist/hoff/*.css`) |

- Mỗi thư mục trong `packages/` là một git repo riêng (remote là repo trên); `dist/` được commit để cài từ git không cần build.
- App ghim package vào **tarball GitHub theo commit** (§2.2 của [`PROJECT.md`](../../PROJECT.md) gốc): `"https://github.com/nhphero/sapp-vue/archive/<commit>.tar.gz"`. Không dùng `github:owner/repo` vì npm "prepare" git dependency có script `build` và đi tìm peer `@nhphero/vue-sapp` trên npmjs (404).
- Build trong container (`nhphero/erp-node24`): build `vue-sapp` trước, theme sau (devDependency của theme trỏ tới tarball `vue-sapp`), commit + push từng repo, rồi đổi commit trong `package.json` các app (hoặc `sapp update`).
- Script npm workspace ở root (`build:packages`, `pack:packages`, `publish:packages`) vẫn còn nhưng hiện không dùng để phân phối.

## Application Registry: type `remote` | `package`

`RegisteredApp.type` (contract `contracts/registry.ts`, mặc định `remote` cho bản ghi cũ):

- **`remote`** — app có host riêng; `url` là base, entry = `formatAppEntryUrl(url)` (`/src/index.ts` khi dev, `/index.js` khi prod).
- **`package`** — bundle do backend phục vụ (`sapp publish` + `package-manager.apps.set`): không cần URL; entry trỏ **thẳng vào version đã giải nén** — `packageFilesEntryUrl(package, version)` = `<package files>/<package>/<version>/index.js`, với `package` / `version` lấy từ `<package files>/apps.json` (`loadServerApps`). `<package files>` = `getPackageFilesBaseUrl()`: `packages.url` trong config của Shell (host tĩnh nginx), else `<api>/package-files`. Khi chưa biết version (server chưa trả lời) mới dùng shim `packageEntryUrl(id)` = `<api>/packages/<id>/index.js`. `url` / `entryUrl` được tính lại mỗi lần đọc registry; đổi version → entry đổi ở lần tải registry sau (form Admin gọi `loadServerApps()` sau khi lưu).

Kernel: `getApiBaseUrl()` (discovery `master_api_url`, else base của protocol `api`), `packageFilesEntryUrl(pkg, version)`, `packageEntryUrl(appId)` (shim), `resolveAppEntry(app)`; `registerApp` / `updateApp` tính entry theo type (đổi id thì entry của app package đổi theo). `config.json` `registry.apps` khai báo được app package: `{ "id": "master-data-live", "name": "…", "type": "package", "package": "master-data" }` (không cần `<id>.url`).

Mount một bundle dưới id khác (bundle `master-data` → registry `master-data-live`): `createMiniApp` chỉ nhận `mountId` (+ `aliases`), **không** nhận luôn id gốc của bundle — nên `/app/master-data` vẫn nạp từ nguồn riêng của nó. Component và namespace i18n vẫn theo id gốc của bundle (`master-data.*`): hai nguồn của cùng một bundle trong một phiên dùng chung namespace đó.

`loadAppManifest(appId)` đọc `manifest.json` của nguồn hiện tại của một app (cache theo URL): app package → `<package files>/<package>/<version>/manifest.json` (có `version`, `publishedAt`, `publishedBy` do server ghi); app remote → `<remote root>/manifest.json` (dev server phục vụ file ở gốc app, không có `version`). Header của theme dùng nó để hiện version dưới tên app.
