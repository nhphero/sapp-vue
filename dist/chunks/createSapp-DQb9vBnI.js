import * as Z from "vue";
import { reactive as h, inject as ee, provide as te, h as q, defineComponent as G, onUnmounted as se, onMounted as re, triggerRef as oe, shallowRef as ne, defineAsyncComponent as M, markRaw as E, nextTick as ie, watchEffect as ae, watch as V, computed as ce, ref as le, createApp as ue } from "vue";
import * as pe from "pinia";
import { createPinia as de } from "pinia";
import * as ge from "vue-router";
import { RouterView as fe, createRouter as he, createWebHistory as me } from "vue-router";
import * as ye from "@vueuse/core";
import { useLocalStorage as W } from "@vueuse/core";
import { S as b, R, A as Se, a as U, f as K, b as ve, c as D, E as v, M as H } from "./format-BUIIBrkU.js";
import N from "axios";
function we() {
  const n = h({
    user: null,
    realmRoles: [],
    clientRoles: {},
    provider: null
  });
  function e() {
    return [.../* @__PURE__ */ new Set([...n.realmRoles, ...Object.values(n.clientRoles).flat()])];
  }
  const t = (r) => r.toLowerCase(), s = () => new Set(e().map(t));
  return h({
    get user() {
      return n.user;
    },
    get roles() {
      return e();
    },
    get realmRoles() {
      return n.realmRoles;
    },
    get clientRoles() {
      return n.clientRoles;
    },
    get provider() {
      return n.provider;
    },
    get isAuthenticated() {
      return n.user !== null;
    },
    hasRole(r, o) {
      return o !== void 0 ? (n.clientRoles[o] ?? []).some((i) => t(i) === t(r)) : s().has(t(r));
    },
    hasAnyRole(...r) {
      const o = s();
      return r.some((i) => o.has(t(i)));
    },
    set(r) {
      const o = r.user.role ? [r.user.role] : [];
      n.realmRoles = [...r.realmRoles ?? o], n.clientRoles = Object.fromEntries(
        Object.entries(r.clientRoles ?? {}).map(([i, a]) => [i, [...a]])
      ), n.provider = r.provider, n.user = {
        ...r.user,
        roles: e(),
        realmRoles: n.realmRoles,
        clientRoles: n.clientRoles
      };
    },
    patchUser(r) {
      if (!n.user)
        return;
      const { roles: o, realmRoles: i, clientRoles: a, ...c } = r;
      n.user = { ...n.user, ...c };
    },
    clear() {
      n.user = null, n.realmRoles = [], n.clientRoles = {}, n.provider = null;
    }
  });
}
const Ae = {};
class ke {
  modules = /* @__PURE__ */ new Map();
  components = /* @__PURE__ */ new Map();
  // 🛰️ ESA v5: Reactive Registries
  _protocols = h(/* @__PURE__ */ new Map());
  _modules = h(/* @__PURE__ */ new Map());
  // 🧠 ESA v5: Event Bus (Central Nervous System)
  _eventHandlers = /* @__PURE__ */ new Map();
  // ⚡ Reactive state for UI elements (Navigation, Command Palette)
  state = h({
    isInitializing: !0,
    skills: [],
    commands: [],
    installedModules: /* @__PURE__ */ new Set(),
    moduleStates: {},
    // 🧠 Centralized Mini-App State
    discovery: {},
    // 🛰️ System discovery parameters
    serverApps: [],
    // 📦 Local apps served by the backend's package registry
    platformConfig: null,
    // ⚙️ Admin → Config
    activeCssScope: ""
    // 🎨 CSS scope of the mini app on screen (mfeScopedCssPlugin)
  });
  loadingPromises = /* @__PURE__ */ new Map();
  $app = null;
  $router = null;
  $config = null;
  $theme = null;
  $message = null;
  $dialog = null;
  $api = null;
  $appState = null;
  $authState = we();
  $f;
  /** The Proxy returned by the constructor; always hand THIS out (arrow fields capture the raw target as `this`). */
  _self;
  constructor() {
    const e = new Proxy(this, {
      get: (t, s) => {
        if (typeof s == "string" && s.startsWith("$")) {
          const r = s.slice(1);
          if (t._protocols.has(r)) return t._protocols.get(r);
          if (t._modules.has(r)) {
            const o = t._modules.get(r);
            return o.isEnabled === !1 ? (console.warn(`🛡️ [sys-kernel] Access denied: Module $${r} is currently DISABLED.`), null) : o;
          }
          if (r in t) return t[s];
        }
        return t[s];
      }
    });
    return this._self = e, e;
  }
  // --- 🛰️ EVENT BUS (IEventEmitter) ---
  on = (e, t) => {
    this._eventHandlers.has(e) || this._eventHandlers.set(e, /* @__PURE__ */ new Set()), this._eventHandlers.get(e).add(t);
  };
  emit = (e, t) => {
    this._eventHandlers.get(e)?.forEach((s) => s(t));
  };
  off = (e, t) => {
    this._eventHandlers.get(e)?.delete(t);
  };
  // --- 🛡️ GOVERNANCE ---
  isModuleActive = (e) => {
    const t = this._modules.get(e);
    return !!(t && t.isEnabled !== !1);
  };
  setModuleEnabled = (e, t) => {
    const s = this._modules.get(e);
    s && (s.isEnabled = t, console.log(`🛡️ [sys-kernel] Module status changed: $${e} -> ${t ? "ENABLED" : "DISABLED"}`), this.emit(b.SYSTEM_GOVERNANCE, { id: e, isEnabled: t }));
  };
  registerProtocol = (e, t) => {
    console.log(`📡 [sys-kernel] Protocol registered: $${e}`), this._protocols.set(e, t);
  };
  registerBusinessModule = (e, t) => {
    console.log(`🔌 [sys-kernel] Business module registered: $${e}`), t.isEnabled === void 0 && (t.isEnabled = !0), this._modules.set(e, t);
  };
  registerModule = (e, t) => {
    this.registerBusinessModule(e, t);
  };
  /**
   * 🔌 Install a module, Vue-plugin style. The kernel is the subject: `superApp.install(module)`.
   * `install(superApp)` → business module · `install(app, superApp)` → MFE-style module · function → called with the kernel.
   */
  install = async (e, ...t) => {
    const s = this._self ?? this;
    if (typeof e == "function")
      return await e(s, ...t), s;
    const r = e.install;
    if (typeof r != "function") throw new Error("[sys-kernel] install(): plugin has no install() method");
    const o = e.id ?? e.name ?? "anonymous";
    return console.log(`🔌 [sys-kernel] Installing module: ${o}`), r.length >= 2 ? await r.call(e, this.$app, s, ...t) : await r.call(e, s, ...t), s;
  };
  getProtocol = (e) => this._protocols.get(e);
  getModule = (e) => this._modules.get(e);
  /**
   * ⚡ [sys-kernel] Invoke a SuperApp Action via the default API Bridge
   */
  doAction = async (e, t = {}) => {
    const s = this.getProtocol("api");
    if (!s) throw new Error("API protocol not registered in SuperApp.");
    if (!s.doAction) throw new Error("API protocol does not support doAction.");
    return await s.doAction(e, t);
  };
  /**
   * 🏗️ ESA PLATFORM CORE: Unified Framework Context
   * Exposing Vue's reactive core to MFEs to ensure a single unified runtime.
   */
  $vue = {
    ref: le,
    reactive: h,
    computed: ce,
    watch: V,
    watchEffect: ae,
    nextTick: ie,
    markRaw: E,
    defineAsyncComponent: M,
    shallowRef: ne,
    triggerRef: oe,
    onMounted: re,
    onUnmounted: se,
    defineComponent: G,
    h: q,
    provide: te,
    inject: ee,
    useLocalStorage: W
  };
  init = (e) => {
    console.log("🚀 [sys-kernel] SuperApp Platform Kernel Initializing..."), this.$app = e.app, this.$router = e.router, this.$api = e.api, this.$config = e.config ? h({ ...e.config }) : null, this.$theme = e.theme, this.$message = e.message, this.$dialog = e.dialog, this.state.isInitializing = !1, this.syncManifestWithRegisteredApps();
  };
  // --- 🌐 DYNAMIC APPLICATION REGISTRY ---
  formatAppEntryUrl = (e) => {
    if (!e) return "";
    const t = e.trim().replace(/\/+$/, "");
    return t.endsWith(".js") || t.endsWith(".ts") ? t : `${t}/index.js`;
  };
  getApiBaseUrl = () => {
    const e = this.state.discovery?.master_api_url, t = this.getProtocol("api");
    return String(e || t?.getBaseUrl?.() || "").replace(/\/+$/, "");
  };
  packageEntryUrl = (e) => `${this.getApiBaseUrl()}/packages/${encodeURIComponent(e)}/index.js`;
  getPackageFilesBaseUrl = () => {
    const e = this.state.discovery?.["packages.url"];
    return String(e || `${this.getApiBaseUrl()}/package-files`).replace(/\/+$/, "");
  };
  packageFilesEntryUrl = (e, t) => `${this.getPackageFilesBaseUrl()}/${encodeURIComponent(e)}/${encodeURIComponent(t)}/index.js`;
  /**
   * A package app loads straight from its extracted version (`package-files/<package>/<version>`);
   * only while that version is unknown (no server answer yet) does it go through the id shim.
   */
  resolveAppEntry = (e) => e.type !== "package" ? this.formatAppEntryUrl(e.url) : e.package && e.version ? this.packageFilesEntryUrl(e.package, e.version) : this.packageEntryUrl(e.id);
  /** True once the server's registry answered — until then the built-ins stand in. */
  serverAppsLoaded = !1;
  /**
   * The app registry (backend sys_apps) from the static `<package files>/registry.json`; a server older
   * than the registry answers `apps.json` (package apps only) instead.
   */
  /**
   * The app registry — from `<backend>/discovery.json` (fetched again: call after a change); a backend
   * older than it: the static registry.json / apps.json.
   */
  loadServerApps = async () => await this.refreshDiscovery() ? this.state.serverApps : this.loadServerAppsFromFiles();
  loadServerAppsFromFiles = async () => {
    const e = async (t) => {
      const s = new AbortController(), r = setTimeout(() => s.abort(), 4e3);
      try {
        const o = await fetch(`${this.getPackageFilesBaseUrl()}/${t}`, { cache: "no-cache", signal: s.signal });
        if (!o.ok) throw new Error(`HTTP ${o.status}`);
        return await o.json();
      } finally {
        clearTimeout(r);
      }
    };
    try {
      let t;
      try {
        t = (await e("registry.json"))?.apps ?? [];
      } catch {
        t = (await e("apps.json") ?? []).map((s) => ({ ...s, id: s.appId, name: s.title, type: "package" }));
      }
      this.state.serverApps = t.filter((s) => s?.id).map((s) => this.toRegisteredApp(s)), this.serverAppsLoaded = !0;
    } catch (t) {
      return console.warn(`📦 [sys-kernel] App registry unavailable (${t?.message ?? t}) — built-in apps only.`), this.state.serverApps;
    }
    return this.syncManifestWithRegisteredApps(), this.emit(b.APPS_UPDATED, this.getRegisteredApps()), this.state.serverApps;
  };
  /** Built-in remote URLs per environment: the Shell config's `<id>.url`, else the build's env. */
  builtInUrl = (e) => {
    const t = Ae ?? {}, s = {
      admin: t.VITE_ADMIN_URL || "http://localhost:4403",
      workspace: t.VITE_WORKSPACE_URL || "http://localhost:4409"
    };
    return String(this.state.discovery?.[`${e}.url`] || s[e] || "").replace(/\/+$/, "");
  };
  /** A registry row (registry.json / apps.registry.*) as the Shell's record. */
  toRegisteredApp = (e) => {
    const t = String(e.id), s = e.code ? String(e.code) : null, r = {
      id: t,
      code: s,
      slug: e.slug || s || t,
      name: e.name || t,
      description: e.description || "",
      icon: e.icon || (e.type === "package" ? "Package" : "Layers"),
      isSystem: !!e.isSystem,
      isEnabled: e.isEnabled !== !1,
      managedBy: "server",
      updatedAt: e.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
    };
    if (e.type === "package") {
      const i = { ...r, type: "package", package: e.package ?? void 0, version: e.version ?? void 0, channel: e.channel ?? null, url: this.getApiBaseUrl() };
      return { ...i, entryUrl: this.resolveAppEntry(i) };
    }
    const o = String(e.url || this.builtInUrl(s ?? t)).replace(/\/+$/, "");
    return { ...r, type: "remote", url: o, entryUrl: o ? this.formatAppEntryUrl(o) : "" };
  };
  /** The Shell's runtime config source (set by createSapp): reloads the environment. */
  discoveryService = null;
  /** Fetches `<backend>/discovery.json` again and applies it; false when the backend does not serve it. */
  refreshDiscovery = async () => !this.discoveryService?.reload || !await this.discoveryService.reload() ? !1 : (this.applyDiscovery(), !0);
  reloadEnvironment = async () => {
    await this.refreshDiscovery() || await this.loadServerAppsFromFiles();
  };
  /**
   * What the discovery service last fetched, applied without a request: the merged config (changed
   * `<module>.url` entries win in the manifest), Admin → Config, the app registry. Says which of the
   * two the backend served (createSapp falls back to the older files for the others).
   */
  applyDiscovery = () => {
    const e = this.discoveryService;
    if (!e) return { platform: !1, apps: !1 };
    const t = e.getAll(), s = this.state.discovery ?? {};
    if (this.state.discovery = t, this.$config) {
      const i = this.$config.moduleManifest ??= {};
      for (const [a, c] of Object.entries(t))
        a.endsWith(".url") && typeof c == "string" && c && s[a] !== c && (i[a.slice(0, -4)] = this.formatAppEntryUrl(c));
    }
    const r = e.getPlatform?.();
    r && this.applyPlatformConfig(r);
    const o = e.getApps?.();
    return o && (this.state.serverApps = o.filter((i) => i?.id).map((i) => this.toRegisteredApp(i)), this.serverAppsLoaded = !0, this.syncManifestWithRegisteredApps(), this.emit(b.APPS_UPDATED, this.getRegisteredApps())), { platform: !!r, apps: !!o };
  };
  /** Branding given to createSapp, kept so an emptied platform field falls back to it. */
  shellBranding = null;
  loadPlatformConfig = async () => {
    if (await this.refreshDiscovery()) return this.state.platformConfig;
    let e;
    try {
      const t = new AbortController(), s = setTimeout(() => t.abort(), 4e3), r = await fetch(`${this.getPackageFilesBaseUrl()}/config.json`, { cache: "no-cache", signal: t.signal });
      if (clearTimeout(s), !r.ok) throw new Error(`HTTP ${r.status}`);
      e = await r.json();
    } catch (t) {
      return console.warn(`⚙️ [sys-kernel] Platform config unavailable (${t?.message ?? t}) — Shell defaults kept.`), null;
    }
    return this.applyPlatformConfig(e);
  };
  /** Admin → Config applied: page title, favicon, the branding the theme shows. */
  applyPlatformConfig = (e) => {
    this.state.platformConfig = e;
    const t = e.general ?? {}, s = t.logo ? this.resolvePackageFileUrl(t.logo) : "", r = t.favicon ? this.resolvePackageFileUrl(t.favicon) : "";
    if (this.$config) {
      this.shellBranding ??= { ...this.$config.branding ?? { name: "" } };
      const a = this.shellBranding;
      this.$config.branding = {
        ...a,
        name: t.title || a.name,
        tagline: t.description || a.tagline,
        logo: s || a.logo,
        // A platform logo has no dark variant of its own — the light plate is used instead.
        logoDark: s ? void 0 : a.logoDark,
        icon: r || a.icon
      };
    }
    const o = this.$config?.branding;
    o?.name && (document.title = o.name);
    const i = o?.icon || o?.logo;
    if (i) {
      const a = document.querySelector('link[rel~="icon"]') ?? Object.assign(document.createElement("link"), { rel: "icon" });
      a.href = i, a.parentNode || document.head.appendChild(a);
    }
    return e;
  };
  resolvePackageFileUrl = (e) => /^([a-z][a-z0-9+.-]*:|\/)/i.test(e) ? e : `${this.getPackageFilesBaseUrl()}/${e.replace(/^\.?\/+/, "")}`;
  manifestCache = /* @__PURE__ */ new Map();
  loadAppManifest = (e) => {
    const t = this.getRegisteredApps().find((o) => o.id === e);
    if (!t) return Promise.resolve(null);
    let s;
    if (t.type === "package") {
      if (!t.package || !t.version) return Promise.resolve(null);
      s = `${this.getPackageFilesBaseUrl()}/${encodeURIComponent(t.package)}/${encodeURIComponent(t.version)}/manifest.json`;
    } else
      s = `${(t.entryUrl || this.formatAppEntryUrl(t.url)).replace(/\/(src\/index\.ts|index\.js)$/, "")}/manifest.json`;
    let r = this.manifestCache.get(s);
    return r || (r = fetch(s, { cache: "no-cache" }).then((o) => o.ok && (o.headers.get("content-type") ?? "").includes("json") ? o.json() : null).catch(() => null), this.manifestCache.set(s, r)), r;
  };
  /** Stand-ins while the server's registry has not answered (it seeds the same built-ins). */
  getBuiltInApps = () => [
    { id: "admin", code: "admin", name: "Admin Management", description: "Platform Governance & Applications Registry", icon: "Shield", isSystem: !0 },
    { id: "workspace", code: "workspace", name: "Workspace Hub", description: "Logic Orchestration & Flow Designer", icon: "Globe", isSystem: !0 }
  ].map((e) => this.toRegisteredApp({ ...e, type: "remote", url: "" }));
  /**
   * Apps declared by the Shell's config (`config.json` / discovery) under `registry.apps`:
   * `[{ id, name, description?, icon?, type?, package? }]`. A `remote` app (default) is mounted from its
   * `<id>.url` entry; a `package` app needs no URL — the backend serves its deployed version. They join
   * the server's registry (which wins for an id it has).
   */
  getConfiguredApps = () => {
    const e = this.state.discovery?.["registry.apps"];
    return Array.isArray(e) ? e.filter((t) => t?.id && (t.type === "package" || typeof this.state.discovery?.[`${t.id}.url`] == "string")).map((t) => ({ ...this.toRegisteredApp({ ...t, code: t.id, isSystem: !0, url: "" }), managedBy: void 0 })) : [];
  };
  /** The server's registry (sys_apps), then config-declared apps; the built-ins until the server answers. */
  getRegisteredApps = () => {
    const e = [
      ...this.state.serverApps,
      ...this.getConfiguredApps(),
      ...this.serverAppsLoaded ? [] : this.getBuiltInApps()
    ], t = /* @__PURE__ */ new Set();
    return e.filter((s) => t.has(s.id) || s.code && t.has(`code:${s.code}`) ? !1 : (t.add(s.id), s.code && t.add(`code:${s.code}`), !0));
  };
  syncManifestWithRegisteredApps = () => {
    const e = this.$config;
    if (!e) return;
    const t = e.moduleManifest ??= {};
    for (const [s, r] of Object.entries(this.state.discovery || {})) {
      if (!s.endsWith(".url") || typeof r != "string" || !r) continue;
      const o = s.slice(0, -4);
      o && !t[o] && (t[o] = this.formatAppEntryUrl(r));
    }
    for (const s of this.getRegisteredApps()) {
      if (!s.id || s.isEnabled === !1) continue;
      const r = s.type === "package" ? this.resolveAppEntry(s) : s.entryUrl || (s.url ? this.formatAppEntryUrl(s.url) : "");
      r && (t[s.id] = r, s.id === "workspace" && (t.expose = r));
    }
  };
  /** Saves through the server's registry (admin), then reloads it — every user sees the change. */
  saveApp = async (e, t) => {
    const s = await this.doAction("apps.registry.save", { app: e, create: t });
    return await this.loadServerApps(), this.getRegisteredApps().find((r) => r.id === s?.id) ?? this.toRegisteredApp(s);
  };
  /** The server gives the new app its id (unique, never typed); the slug is its route. */
  registerApp = async (e) => {
    const t = this.normalizeAppId(e.slug ?? "");
    if (!t) throw new Error("The slug (route /app/<slug>) is required");
    const s = e.type === "package" ? "package" : "remote";
    if (s === "remote" && !e.url) throw new Error("Application Remote URL is required");
    return this.saveApp({
      slug: t,
      name: e.name || t,
      type: s,
      url: s === "remote" ? e.url.trim().replace(/\/+$/, "") : void 0,
      package: s === "package" ? e.package : void 0,
      description: e.description || "",
      icon: e.icon || "Layers",
      isEnabled: e.isEnabled ?? !0
    }, !0);
  };
  normalizeAppId = (e) => (e || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/^-+|-+$/g, "");
  updateApp = async (e, t) => {
    if (t.id !== void 0 && this.normalizeAppId(t.id) !== e)
      throw new Error(`The id of [${e}] cannot change — change its slug (route) instead.`);
    const { id: s, ...r } = t;
    return r.slug !== void 0 && (r.slug = this.normalizeAppId(r.slug) || e), r.url && (r.url = r.url.trim().replace(/\/+$/, "")), this.saveApp({ id: e, ...r }, !1);
  };
  findAppByRoute = (e) => {
    const t = this.getRegisteredApps();
    return t.find((s) => (s.slug || s.id) === e) ?? t.find((s) => s.id === e) ?? t.find((s) => s.code === e);
  };
  getApp = (e) => {
    const t = this.getRegisteredApps();
    return t.find((s) => s.id === e) ?? t.find((s) => s.code === e);
  };
  appPath = (e, t = "") => {
    const s = this.getApp(e), r = t.replace(/^\/+/, "");
    return `/app/${s?.slug || e}${r ? `/${r}` : ""}`;
  };
  deleteApp = async (e) => {
    const t = this.getRegisteredApps().find((s) => s.id === e);
    if (!t) return !1;
    if (t.isSystem) throw new Error(`System application [${e}] cannot be removed.`);
    return await this.doAction("apps.registry.remove", { id: e }), this.$config?.moduleManifest && delete this.$config.moduleManifest[e], await this.loadServerApps(), !0;
  };
  /**
   * Apps this browser registered before the registry moved to the server (localStorage
   * `erp_registered_apps`): sent once to `apps.registry.import` (admin), then the key is kept as
   * `<key>.imported`; and the apps the Shell config declares. Remote apps only — package apps were the
   * server's already.
   */
  importLocalApps = async () => {
    let e = [];
    try {
      e = JSON.parse(localStorage.getItem(R) || "[]");
    } catch {
    }
    const t = this.getConfiguredApps().filter((o) => o.type !== "package").map((o) => ({ ...o, url: "" })), s = [
      ...(Array.isArray(e) ? e : []).filter((o) => o?.id && o.type !== "package" && o.managedBy !== "server" && o.url && !["admin", "workspace"].includes(o.id)),
      ...t
    ].filter((o) => !this.state.serverApps.some((i) => i.id === o.id || i.code === o.id)).map((o) => ({ ...o, code: o.code ?? o.id }));
    if (!s.length) {
      try {
        localStorage.removeItem(R);
      } catch {
      }
      return { imported: [], skipped: [] };
    }
    const r = await this.doAction("apps.registry.import", { apps: s });
    try {
      localStorage.setItem(`${R}.imported`, JSON.stringify(e)), localStorage.removeItem(R);
    } catch {
    }
    return r?.imported?.length && await this.loadServerApps(), { imported: r?.imported ?? [], skipped: r?.skipped ?? [] };
  };
  pingApp = async (e) => {
    const t = Date.now();
    try {
      const s = new AbortController(), r = setTimeout(() => s.abort(), 3500);
      return await fetch(e, {
        method: "GET",
        mode: "no-cors",
        signal: s.signal
      }), clearTimeout(r), { success: !0, latencyMs: Date.now() - t, statusText: "Online" };
    } catch (s) {
      return {
        success: !1,
        latencyMs: Date.now() - t,
        statusText: s.name === "AbortError" ? "Timeout (3.5s)" : s.message || "Offline"
      };
    }
  };
  // --- 📦 MODULE LIFECYCLE (Unified Activator) ---
  isModuleInstalled = (e) => this.state.installedModules.has(e);
  markModuleInstalled = (e) => {
    this.state.installedModules.add(e);
  };
  /**
   * 🔗 ESA PROTOCOL: Unified Module Activation
   */
  resolveModule = async (e) => {
    if (this.isModuleInstalled(e)) return;
    if (this.loadingPromises.has(e))
      return this.loadingPromises.get(e);
    const t = (async () => {
      let r = (this.$config?.moduleManifest || {})[e];
      if (!r) {
        const i = this.getRegisteredApps().find((a) => a.id === e);
        i && i.url && (r = i.entryUrl || this.formatAppEntryUrl(i.url), this.$config && (this.$config.moduleManifest || (this.$config.moduleManifest = {}), this.$config.moduleManifest[e] = r));
      }
      if (!r) {
        console.warn(`⚠️ [sys-kernel] No URL manifest found for [${e}].`);
        return;
      }
      try {
        console.log(`🔌 [sys-kernel] Connecting to remote module [${e}] at ${r}`);
        const o = await import(
          /* @vite-ignore */
          r
        ), i = o.default;
        if (this.cssScopes.set(e, String(o.__sappCssScope ?? i?.id ?? e)), i?.install) {
          console.log(`🛠️ [sys-kernel] Installing remote [${e}]...`);
          const a = this.getRegisteredApps().find((c) => c.id === e) ?? null;
          await this.install(i, { moduleId: e, basePath: this.appPath(e), app: a }), this.markModuleInstalled(e), console.log(`✅ [sys-kernel] Remote [${e}] installed successfully.`);
        }
      } catch (o) {
        throw console.error(`🚨 [sys-kernel] Failed to load remote [${e}] from ${r}`, o), o;
      } finally {
        this.loadingPromises.delete(e);
      }
    })();
    return this.loadingPromises.set(e, t), t;
  };
  cssScopes = /* @__PURE__ */ new Map();
  getModuleCssScope = (e) => this.cssScopes.get(e) ?? e;
  pathListeners = /* @__PURE__ */ new Map();
  /**
   * 🧠 MODULE STATE MANAGEMENT
   * Retrieves or initializes a reactive state container for a specific module.
   */
  getModuleState = (e, t = {}) => (this.state.moduleStates[e] || (this.state.moduleStates[e] = h(t)), this.state.moduleStates[e]);
  /**
   * 🗺️ [sys-kernel] MFE Entry Registration
   */
  registerModuleEntry = (e) => {
    const t = this.getComponent(e.entryComponentId);
    t ? (this.modules.set(e.moduleId, t), console.log(`📡 [sys-kernel] Module entry registered: ${e.moduleId} -> ${e.entryComponentId}`)) : console.error(`🚨 [sys-kernel] Failed to register entry for ${e.moduleId}: Component ${e.entryComponentId} not found.`);
  };
  getModuleEntry = (e) => {
    const t = this.modules.get(e);
    return typeof t == "function" ? E(M(t)) : t ? E(t) : null;
  };
  // --- 🧩 COMPONENT REGISTRY ---
  registerComponent = (e) => {
    this.components.set(e.id, e.component);
  };
  componentCache = /* @__PURE__ */ new Map();
  getComponent = (e) => {
    if (this.componentCache.has(e)) return this.componentCache.get(e);
    const t = this.components.get(e);
    if (!t)
      return console.warn(`⚠️ [sys-kernel] Component not found: ${e}`), null;
    let s;
    return typeof t == "function" ? s = E(M(t)) : s = E(t), this.componentCache.set(e, s), s;
  };
  skills = h([]);
  commands = h([]);
  // --- ⚡ SKILLS & COMMANDS REGISTRY ---
  registerSkill = (e) => {
    this.skills.find((t) => t.id === e.id) || (this.skills.push(e), console.log(`✨ [sys-kernel] Skill registered: ${e.id}`));
  };
  getSkill = (e) => this.skills.find((t) => t.id === e);
  registerCommand = (e) => {
    this.commands.find((t) => t.id === e.id) || (this.commands.push(e), console.log(`⌨️ [sys-kernel] Command registered: ${e.id}`));
  };
  /**
   * ⚡ [sys-kernel] Run Global Command (ESA Standard)
   */
  runCommand = (e) => {
    const t = this.commands.find((s) => s.id === e);
    t ? (console.log(`🚀 [sys-kernel] Executing command: ${e}`), t.handler()) : console.warn(`⚠️ [sys-kernel] Command not found: ${e}`);
  };
  // --- 🛰️ NAVIGATION & SYNC ---
  onPathChange = (e, t) => {
    const s = this.pathListeners.get(e) || [];
    s.push(t), this.pathListeners.set(e, s);
  };
  runPathAction = (e, t) => {
    console.log(`📡 [sys-kernel] Routing action for ${e}: ${t}`);
    const s = this.pathListeners.get(e);
    s && s.forEach((r) => r(t));
  };
}
class $e {
  id = "api";
  baseUrl;
  superApp = null;
  constructor(e = "") {
    this.baseUrl = e;
  }
  setBaseUrl(e) {
    this.baseUrl = e;
  }
  getBaseUrl() {
    return this.baseUrl;
  }
  /**
   * 🔗 Bind to SuperApp to enable event broadcasting
   */
  bind(e) {
    this.superApp = e;
  }
  getHeaders() {
    const e = localStorage.getItem(Se), t = this.superApp?.$appState?.current_workspace || localStorage.getItem(U), s = `req-${Date.now()}-${Math.floor(Math.random() * 1e4)}`, r = {
      Authorization: e ? `Bearer ${e}` : "",
      "Content-Type": "application/json",
      "request-id": s
    };
    return t && (r["x-workspace-id"] = t, localStorage.getItem(U) !== String(t) && localStorage.setItem(U, String(t))), r;
  }
  async request(e, t = {}) {
    try {
      const s = await fetch(`${this.baseUrl}${e}`, {
        ...t,
        headers: { ...this.getHeaders(), ...t.headers }
      });
      if (!s.ok) {
        const r = await s.json().catch(() => ({ message: "System error" })), o = {
          message: r.error || r.message || `Request failed with status ${s.status}`,
          status: s.status,
          path: e
        };
        throw this.superApp?.emit(b.SYSTEM_ERROR, o), new Error(o.message);
      }
      return s.json().catch(() => ({}));
    } catch (s) {
      throw s.message !== "System error" && this.superApp?.emit(b.SYSTEM_ERROR, { message: s.message, path: e }), s;
    }
  }
  /**
   * ⚡ Invoke a SuperApp Action via the Bridge
   */
  async doAction(e, t = {}) {
    console.log(`📡 [ApiProtocol] Invoking action: ${e}`, t);
    const s = await this.request(`${K.ENDPOINTS.SUPERAPP_CALL}/${e}`, {
      method: "POST",
      body: JSON.stringify(t)
    });
    if (s.success)
      return s.data;
    throw new Error(s.error || `Action ${e} failed`);
  }
  // --- HTTP Helpers (Axios-like compatibility) ---
  async get(e, t = {}) {
    return this.request(e, { ...t, method: "GET" });
  }
  async post(e, t, s = {}) {
    return this.request(e, { ...s, method: "POST", body: JSON.stringify(t) });
  }
  async put(e, t, s = {}) {
    return this.request(e, { ...s, method: "PUT", body: JSON.stringify(t) });
  }
  async delete(e, t = {}) {
    return this.request(e, { ...t, method: "DELETE" });
  }
}
class Ee {
  id = "socket";
  socket = null;
  url;
  handlers = /* @__PURE__ */ new Map();
  actionQueue = [];
  actionCallbacks = /* @__PURE__ */ new Map();
  constructor(e) {
    this.url = e;
  }
  connect() {
    this.socket = new WebSocket(this.url), this.socket.onopen = () => {
      for (console.log(`📡 [SocketProtocol] CONNECTED to ${this.url}`); this.actionQueue.length > 0; ) {
        const e = this.actionQueue.shift();
        e && e();
      }
    }, this.socket.onerror = (e) => {
      console.error(`📡 [SocketProtocol] CONNECTION ERROR for ${this.url}`, e);
    }, this.socket.onclose = (e) => {
      console.warn(`📡 [SocketProtocol] CLOSED: Code ${e.code}, Reason: ${e.reason || "none"}`), this.actionCallbacks.forEach(({ reject: t }) => t(new Error("Socket closed"))), this.actionCallbacks.clear();
    }, this.socket.onmessage = (e) => {
      try {
        const t = JSON.parse(e.data), { type: s, data: r, id: o } = t;
        if (s === "ACTION_RESPONSE" && o && this.actionCallbacks.has(o)) {
          const { resolve: i } = this.actionCallbacks.get(o);
          this.actionCallbacks.delete(o), i(r);
          return;
        }
        if (s === "EVENT" && t.event) {
          this.handlers.has(t.event) && this.handlers.get(t.event)?.forEach((i) => i(t.data));
          return;
        }
        this.handlers.has(s) && this.handlers.get(s)?.forEach((i) => i(r));
      } catch (t) {
        console.error("📡 [SocketProtocol] Message Parse Error", t);
      }
    };
  }
  /**
   * ⚡ Execute an action (Queued if connecting)
   */
  async doAction(e, t) {
    const s = (r, o) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        o(new Error("Socket unexpectedly unavailable"));
        return;
      }
      const i = Math.random().toString(36).substring(7);
      this.actionCallbacks.set(i, { resolve: r, reject: o });
      const a = { type: "ACTION", id: i, action: e, data: t };
      this.socket.send(JSON.stringify(a)), setTimeout(() => {
        this.actionCallbacks.has(i) && (this.actionCallbacks.delete(i), o(new Error(`📡 [SocketProtocol] Action "${e}" timed out.`)));
      }, 3e4);
    };
    return new Promise((r, o) => {
      this.socket?.readyState === WebSocket.OPEN ? s(r, o) : (console.log(`📡 [SocketProtocol] Action "${e}" queued (Socket connecting...)`), this.actionQueue.push(() => s(r, o)));
    });
  }
  on(e, t) {
    const s = this.handlers.get(e) || [];
    s.push(t), this.handlers.set(e, s);
  }
}
const be = {}, Re = ["master_api_url"], _e = (n) => n.master_api_url || be?.VITE_MASTER_API_URL || (typeof window < "u" && window.location.hostname === "localhost" ? "http://localhost:4400" : "");
async function I(n) {
  const e = new AbortController(), t = setTimeout(() => e.abort(), 5e3);
  try {
    const s = await fetch(n, { cache: "no-cache", signal: e.signal });
    return !s.ok || !(s.headers.get("content-type") ?? "").includes("json") ? null : await s.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
class Pe {
  config = {};
  staticConfig = {};
  apiBase = "";
  platform = null;
  apps = null;
  initialized = !1;
  async initialize(e) {
    this.staticConfig = await I("/config.json") ?? {}, this.apiBase = String(_e(this.staticConfig)).replace(/\/+$/, ""), await this.reload(), this.initialized = !0, e && (e.state.discovery = { ...this.config }), console.log("🛰️ [Discovery] Total variables loaded:", Object.keys(this.config).length);
  }
  /** Fetches `<backend>/discovery.json` again (after an admin change) and merges it. */
  async reload() {
    const e = this.apiBase ? await I(`${this.apiBase}/discovery.json`) : null;
    if (e && typeof e == "object" && "system" in e) {
      const s = Object.fromEntries(Object.entries(e.environment ?? {}).filter(([r, o]) => typeof o == "string" && !Re.includes(r)));
      return this.config = { ...e.system ?? {}, ...this.staticConfig, ...s }, this.platform = e.platform ?? null, this.apps = Array.isArray(e.apps) ? e.apps : null, !0;
    }
    const t = this.apiBase ? await I(`${this.apiBase}${K.ENDPOINTS.DISCOVERY}`) : null;
    return this.apiBase || console.warn("🛰️ [Discovery] No master_api_url in config.json or the build — backend discovery skipped."), this.config = { ...t ?? {}, ...this.staticConfig }, !1;
  }
  /** Admin → Config, from the last discovery.json (null: not served). */
  getPlatform() {
    return this.platform;
  }
  /** The app registry rows, from the last discovery.json (null: not served). */
  getApps() {
    return this.apps;
  }
  get(e, t) {
    return this.config[e] ?? t;
  }
  getAll() {
    return { ...this.config };
  }
  get isInitialized() {
    return this.initialized;
  }
}
const Ce = new Pe(), Te = () => {
  const n = W(ve, {
    current_app: "workspace",
    current_workspace: null
  });
  return (typeof n.value != "object" || n.value === null) && (console.warn("⚠️ [AppState] Invalid storage detected, resetting to defaults."), n.value = {
    current_app: "workspace",
    current_workspace: null
  }), h({
    get current_app() {
      return n.value.current_app;
    },
    set current_app(e) {
      n.value.current_app = e;
    },
    get current_workspace() {
      return n.value.current_workspace;
    },
    set current_workspace(e) {
      typeof n.value != "object" ? n.value = { current_app: "workspace", current_workspace: e } : n.value.current_workspace = e;
    },
    // 🏢 Global Workspace Cache (Populated from Discovery)
    workspaces: []
  });
}, Me = 3e4, L = "x-request-id";
function Ue() {
  if (typeof crypto.randomUUID == "function")
    return crypto.randomUUID();
  const n = crypto.getRandomValues(new Uint8Array(16));
  n[6] = n[6] & 15 | 64, n[8] = n[8] & 63 | 128;
  const e = Array.from(n, (t) => t.toString(16).padStart(2, "0")).join("");
  return `${e.slice(0, 8)}-${e.slice(8, 12)}-${e.slice(12, 16)}-${e.slice(16, 20)}-${e.slice(20)}`;
}
function Ie(n) {
  const e = n.response?.data, t = e && typeof e == "object" ? e.message || e.error_description || (typeof e.error == "string" ? e.error : void 0) : void 0;
  return {
    status: n.response?.status ?? null,
    message: t || n.message || "Request failed",
    code: e && typeof e == "object" && (e.code || (typeof e.error == "string" ? e.error : void 0)) || n.code,
    data: e,
    url: n.config?.url,
    method: n.config?.method?.toUpperCase(),
    requestId: n.config?.headers?.get?.(L)?.toString(),
    cause: n
  };
}
function Le(n) {
  return function(t) {
    const { baseURL: s, headers: r, withToken: o = !0, workspace: i = !1, onError: a, setup: c, ...p } = t;
    if (!s)
      throw new Error("[createApi] `baseURL` is required — read it from env (e.g. import.meta.env.VITE_API_URL).");
    const l = N.create({
      timeout: Me,
      ...p,
      baseURL: s,
      headers: { Accept: "application/json", ...r }
    });
    return l.interceptors.request.use((u) => {
      if (u.headers.has(L) || u.headers.set(L, Ue()), o) {
        const d = localStorage.getItem(n.tokenKey);
        d && !u.headers.has("Authorization") && u.headers.set("Authorization", `Bearer ${d}`);
      }
      if (i) {
        const d = n.appState?.()?.current_workspace;
        d && u.headers.set("x-workspace-id", String(d));
      }
      return u;
    }), l.interceptors.response.use(
      (u) => u,
      (u) => {
        if (N.isCancel(u))
          return Promise.reject(u);
        const d = Ie(u);
        return a ? a(d) : n.message?.error(d.message), Promise.reject(d);
      }
    ), c?.(l), l;
  };
}
const Oe = {
  en: {
    common: {
      ok: "OK",
      cancel: "Cancel",
      close: "Close",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      create: "Create",
      search: "Search…",
      loading: "Loading…",
      empty: "Nothing here yet",
      error: "Something went wrong",
      retry: "Retry",
      confirm: "Confirm",
      yes: "Yes",
      no: "No",
      back: "Back",
      next: "Next",
      submit: "Submit",
      understood: "Got it",
      page: "Page",
      perPage: "Per page",
      of: "of",
      prev: "Previous"
    },
    shell: { home: "Home", apps: "Apps", all: "All", favorites: "Favorites", favoritesEmpty: "No favorites yet — press the star on an app.", recent: "Recent", toggleFavorite: "Toggle favorite", searchApps: "Search apps…", settings: "Settings", theme: "Appearance", language: "Language", logout: "Sign out", profile: "Profile" },
    theme: {
      mode: "Mode",
      light: "Light",
      dark: "Dark",
      system: "System",
      brand: "Brand colour",
      fontSize: "Text size",
      density: "Density",
      compact: "Compact",
      normal: "Normal",
      spacious: "Spacious",
      radius: "Corner radius",
      shadow: "Shadow",
      font: "Font",
      reset: "Reset",
      exportTokens: "Export tokens",
      copied: "Copied",
      fullPage: "Full page",
      savedOnDevice: "Saved on this browser",
      locked: "Set by your administrator",
      surface: "Page background",
      surfaceDefault: "Default",
      surfacePaper: "Paper",
      surfaceDeep: "Deep",
      surfaceTint: "Brand tint",
      fontsLocal: "On this machine",
      fontsWeb: "Web (full Vietnamese)"
    }
  },
  vi: {
    common: {
      ok: "OK",
      cancel: "Huỷ",
      close: "Đóng",
      save: "Lưu",
      delete: "Xoá",
      edit: "Sửa",
      create: "Tạo",
      search: "Tìm…",
      loading: "Đang tải…",
      empty: "Chưa có dữ liệu",
      error: "Có lỗi xảy ra",
      retry: "Thử lại",
      confirm: "Xác nhận",
      yes: "Có",
      no: "Không",
      back: "Quay lại",
      next: "Tiếp",
      submit: "Gửi",
      understood: "Đã hiểu",
      page: "Trang",
      perPage: "Mỗi trang",
      of: "trên",
      prev: "Trước"
    },
    shell: { home: "Trang chủ", apps: "Ứng dụng", all: "Tất cả", favorites: "Yêu thích", favoritesEmpty: "Chưa có mục yêu thích — bấm ngôi sao trên ứng dụng.", recent: "Gần đây", toggleFavorite: "Yêu thích", searchApps: "Tìm ứng dụng…", settings: "Cài đặt", theme: "Giao diện", language: "Ngôn ngữ", logout: "Đăng xuất", profile: "Hồ sơ" },
    theme: {
      mode: "Chế độ",
      light: "Sáng",
      dark: "Tối",
      system: "Hệ thống",
      brand: "Màu thương hiệu",
      fontSize: "Cỡ chữ",
      density: "Mật độ",
      compact: "Gọn",
      normal: "Chuẩn",
      spacious: "Thoáng",
      radius: "Bo góc",
      shadow: "Đổ bóng",
      font: "Font chữ",
      reset: "Đặt lại",
      exportTokens: "Xuất token",
      copied: "Đã copy",
      fullPage: "Trang đầy đủ",
      savedOnDevice: "Lưu trên trình duyệt này",
      locked: "Do quản trị viên thiết lập",
      surface: "Nền trang",
      surfaceDefault: "Mặc định",
      surfacePaper: "Sáng",
      surfaceDeep: "Đậm",
      surfaceTint: "Ám brand",
      fontsLocal: "Có sẵn trên máy",
      fontsWeb: "Web (đủ dấu tiếng Việt)"
    }
  }
}, Y = (n, e = "", t = {}) => {
  for (const [s, r] of Object.entries(n)) {
    const o = e ? `${e}.${s}` : s;
    r && typeof r == "object" ? Y(r, o, t) : t[o] = String(r);
  }
  return t;
}, Be = (n, e) => e ? n.replace(/\{(\w+)\}/g, (t, s) => e[s] === void 0 || e[s] === null ? t : String(e[s])) : n, De = (n, e) => {
  if (e?.count === void 0 || e.count === null || !n.includes("|")) return n;
  const t = Number(e.count);
  if (!Number.isFinite(t)) return n;
  const s = n.split("|").map((r) => r.trim());
  return s.length === 2 ? t === 1 ? s[0] : s[1] : s.length >= 3 ? t === 0 ? s[0] : t === 1 ? s[1] : s[2] : s[0];
};
function Ne(n = {}) {
  const e = n.fallbackLocale ?? "en", t = n.persist ?? !0, s = t ? (() => {
    try {
      return localStorage.getItem(D);
    } catch {
      return null;
    }
  })() : null, r = h({ locale: s || n.locale || e, messages: {} }), o = /* @__PURE__ */ new Set(), i = (l, u, d) => {
    const k = Y(u, d || "");
    r.messages[l] = { ...r.messages[l] ?? {}, ...k };
  }, a = (l, u) => {
    for (const [d, k] of Object.entries(l)) i(d, k, u);
  };
  a(Oe), n.messages && a(n.messages);
  const c = (l, u) => r.messages[u]?.[l], p = {
    get locale() {
      return r.locale;
    },
    set locale(l) {
      p.setLocale(l);
    },
    fallbackLocale: e,
    get availableLocales() {
      return Object.keys(r.messages);
    },
    t(l, u) {
      const d = c(l, r.locale) ?? c(l, e) ?? u?.default ?? l;
      return Be(De(d, u), u);
    },
    te(l, u) {
      return c(l, u ?? r.locale) !== void 0 || !u && c(l, e) !== void 0;
    },
    setLocale(l) {
      if (!l || l === r.locale) return;
      const u = r.locale;
      if (r.locale = l, t)
        try {
          localStorage.setItem(D, l);
        } catch {
        }
      document.documentElement.setAttribute("lang", l), o.forEach((d) => d(l, u));
    },
    addMessages: a,
    addLocaleMessages: i,
    getMessages(l = r.locale, u = !0) {
      return u ? { ...r.messages[e] ?? {}, ...r.messages[l] ?? {} } : { ...r.messages[l] ?? {} };
    },
    onLocaleChange(l) {
      return o.add(l), () => o.delete(l);
    }
  };
  return typeof document < "u" && document.documentElement.setAttribute("lang", r.locale), V(() => r.locale, () => {
  }), p;
}
function w(n) {
  return n === "vi" ? "vi-VN" : n === "en" ? "en-US" : n;
}
const j = /* @__PURE__ */ new Map();
function A(n, e) {
  const t = j.get(n);
  if (t)
    return t;
  const s = e();
  return j.set(n, s), s;
}
function _(n) {
  if (n == null || n === "")
    return null;
  const e = n instanceof Date ? n : new Date(n);
  return Number.isNaN(e.getTime()) ? null : e;
}
const je = [
  { unit: "year", ms: 365 * 864e5 },
  { unit: "month", ms: 30 * 864e5 },
  { unit: "day", ms: 864e5 },
  { unit: "hour", ms: 36e5 },
  { unit: "minute", ms: 6e4 },
  { unit: "second", ms: 1e3 }
], F = ["B", "KB", "MB", "GB", "TB", "PB"], Fe = /* @__PURE__ */ new Set([
  "locale",
  "currency",
  "withLocale",
  "register",
  "of",
  "ownerOf",
  "formatMoney",
  "formatNumber",
  "formatPercent",
  "formatDate",
  "formatDateTime",
  "formatTime",
  "formatRelative",
  "formatBytes"
]);
function xe() {
  return { groups: /* @__PURE__ */ new Map(), owners: /* @__PURE__ */ new Map() };
}
function J(n, e = {}) {
  const t = e.fallbackLocale ?? "vi";
  let s = e.currency ?? "VND";
  const r = e.registry ?? xe(), o = {
    get locale() {
      return n() || t;
    },
    get currency() {
      return s;
    },
    set currency(i) {
      s = i;
    },
    formatMoney(i, a) {
      if (i == null || !Number.isFinite(i))
        return v;
      const c = a ?? s, p = w(o.locale);
      return A(`money:${p}:${c}`, () => new Intl.NumberFormat(p, {
        style: "currency",
        currency: c,
        maximumFractionDigits: 0
      })).format(i);
    },
    formatNumber(i, a = 0) {
      if (i == null || !Number.isFinite(i))
        return v;
      const c = w(o.locale);
      return A(`number:${c}:${a}`, () => new Intl.NumberFormat(c, {
        maximumFractionDigits: a
      })).format(i);
    },
    formatPercent(i, a = 1) {
      if (i == null || !Number.isFinite(i))
        return v;
      const c = w(o.locale);
      return A(`percent:${c}:${a}`, () => new Intl.NumberFormat(c, {
        style: "percent",
        maximumFractionDigits: a
      })).format(i);
    },
    formatDate(i) {
      const a = _(i);
      if (!a)
        return v;
      const c = w(o.locale);
      return A(`date:${c}`, () => new Intl.DateTimeFormat(c, {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })).format(a);
    },
    formatDateTime(i) {
      const a = _(i);
      if (!a)
        return v;
      const c = w(o.locale);
      return A(`datetime:${c}`, () => new Intl.DateTimeFormat(c, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })).format(a);
    },
    formatTime(i) {
      const a = _(i);
      if (!a)
        return v;
      const c = w(o.locale);
      return A(`time:${c}`, () => new Intl.DateTimeFormat(c, {
        hour: "2-digit",
        minute: "2-digit"
      })).format(a);
    },
    formatRelative(i) {
      const a = _(i);
      if (!a)
        return v;
      const c = w(o.locale), p = A(`relative:${c}`, () => new Intl.RelativeTimeFormat(c, {
        numeric: "auto"
      })), l = a.getTime() - Date.now();
      for (const u of je)
        if (Math.abs(l) >= u.ms)
          return p.format(Math.round(l / u.ms), u.unit);
      return p.format(0, "second");
    },
    formatBytes(i, a = 1) {
      if (i == null || !Number.isFinite(i))
        return v;
      let c = Math.abs(i), p = 0;
      for (; c >= 1024 && p < F.length - 1; )
        c = c / 1024, p = p + 1;
      const l = i < 0 ? "-" : "", u = p === 0 ? 0 : a;
      return `${l}${o.formatNumber(c, u)} ${F[p]}`;
    },
    withLocale(i) {
      return J(() => i, { fallbackLocale: t, currency: s, registry: r });
    },
    register(i, a) {
      if (!i)
        throw new Error("[format] register() needs a namespace — use the module id.");
      const c = r.groups.get(i) ?? {};
      for (const [p, l] of Object.entries(a)) {
        if (Fe.has(p))
          throw new Error(`[format] "${p}" is a built-in formatter and cannot be replaced.`);
        c[p] = l;
        const u = r.owners.get(p);
        if (!u) {
          r.owners.set(p, i);
          continue;
        }
        u !== i && console.warn(
          `⚠️ [format] "${p}" is already registered by [${u}], so $f.${p} stays theirs. [${i}] can reach its own as $f.of('${i}').${p}.`
        );
      }
      return r.groups.set(i, c), c;
    },
    of(i) {
      return r.groups.get(i) ?? {};
    },
    ownerOf(i) {
      return r.owners.get(i) ?? null;
    }
  };
  return new Proxy(o, {
    get(i, a, c) {
      if (typeof a != "string" || a in i)
        return Reflect.get(i, a, c);
      const p = r.owners.get(a);
      if (p)
        return r.groups.get(p)?.[a];
    },
    has(i, a) {
      return a in i ? !0 : typeof a == "string" && r.owners.has(a);
    },
    ownKeys(i) {
      return [.../* @__PURE__ */ new Set([...Reflect.ownKeys(i), ...r.owners.keys()])];
    },
    getOwnPropertyDescriptor(i, a) {
      const c = Reflect.getOwnPropertyDescriptor(i, a);
      if (c)
        return c;
      if (typeof a == "string" && r.owners.has(a))
        return { configurable: !0, enumerable: !0, value: void 0 };
    }
  });
}
function ze(n, e = {}) {
  return J(() => n.locale, e);
}
function qe(n) {
  return globalThis[H] = n, n;
}
function et() {
  return globalThis[H];
}
const Ge = {}, x = "Root", Ve = Ge ?? {}, We = (n) => n || Ve.VITE_MASTER_API_URL || (window.location.hostname === "localhost" ? "http://localhost:4400" : ""), Ke = () => {
  const n = window.location.protocol === "https:" ? "wss:" : "ws:", e = window.location.host.replace(":4401", ":4400");
  return `${n}//${e}/socket`;
}, z = (n, e) => async () => {
  const t = n.getComponent(e);
  if (!t) throw new Error(`[sapp] Route component not registered: ${e}`);
  return typeof t == "function" ? t() : t;
};
async function tt(n) {
  qe({ Vue: Z, Pinia: pe, VueRouter: ge, VueUse: ye });
  const e = ue(n.root), t = de();
  e.use(t);
  const s = n.discovery ?? Ce;
  await s.initialize();
  const r = n.api?.baseUrl ?? We(s.get("master_api_url"));
  console.log("💉 [sapp] apiBase:", r);
  const o = new ke();
  o.discoveryService = s, o.$app = e, window.$superApp = o;
  const i = n.theme.register(e, o), a = i.uiStore, c = Ne(n.i18n), p = ze(c, { currency: n.currency });
  o.registerProtocol("i18n", c), c.onLocaleChange((f, y) => o.emit("i18n:locale-changed", { locale: f, previous: y }));
  const l = new $e(r), u = new Ee(n.socket?.url ?? Ke());
  u.connect(), o.registerProtocol("api", l), o.registerProtocol("socket", u), l.bind(o);
  const d = n.auth?.tokenKey ?? "accessToken";
  o.createApi = Le({
    tokenKey: d,
    message: i.messageService,
    appState: () => o.$appState
  });
  const k = n.auth?.loginPath ?? "/login", Q = n.layout ?? G({ name: "SappLayout", setup: () => () => q(fe) }), X = [
    { path: k, name: "Login", component: z(o, n.auth?.loginComponentId ?? "auth.login"), meta: { public: !0 } },
    {
      path: "/",
      name: x,
      component: Q,
      children: [
        { path: "app/:moduleId(.*)*", name: "AppGateway", component: z(o, "layout.app-container") }
      ]
    },
    ...n.routes ?? []
  ], $ = he({ history: me(n.router?.base), routes: X });
  $.beforeEach((f, y, g) => {
    const S = localStorage.getItem(d);
    if (!f.meta.public && !S) return g(k);
    g();
  });
  const P = { app: e, router: $, pinia: t, superApp: o, discovery: s, api: l, socket: u };
  if (await n.modules?.(P), o.state.discovery = s.getAll(), o.init({
    app: e,
    router: $,
    config: { moduleManifest: { ...n.manifest ?? {}, ...s.getAll() }, branding: n.branding },
    theme: n.tokens,
    message: i.messageService,
    dialog: i.dialogService
  }), n.branding) {
    const { name: f, icon: y, logo: g } = n.branding;
    f && (document.title = f);
    const S = y || g;
    if (S) {
      const T = document.querySelector('link[rel~="icon"]') ?? Object.assign(document.createElement("link"), { rel: "icon" });
      T.href = S, T.parentNode || document.head.appendChild(T);
    }
  }
  const O = o.applyDiscovery();
  O.platform || await o.loadPlatformConfig(), O.apps || await o.loadServerApps();
  const C = i.appState ?? Te(), B = s.get("system.workspaces");
  B && (C.workspaces = B), o.$appState = C, e.config.globalProperties.$appState = C, e.config.globalProperties.$auth = o.$authState, e.provide("$auth", o.$authState);
  for (const f of n.features ?? []) {
    const y = {
      ...P,
      featureId: f.id,
      registerRoute: (g) => $.addRoute(x, g),
      registerTopRoute: (g) => $.addRoute(g),
      registerComponent: (g) => o.registerComponent(g),
      registerSkill: (g) => o.registerSkill(g),
      registerCommand: (g) => o.registerCommand(g),
      registerMessages: (g, S) => c.addMessages(g, S),
      provide: (g, S) => e.provide(g, S)
    };
    await f.install(y), console.log(`🧩 [sapp] Shell feature installed: ${f.id}`);
  }
  const m = e.config.globalProperties;
  return m.$c = (f) => o.getComponent(f), m.$s = o, m.$superApp = o, m.$message = i.messageService, m.$dialog = i.dialogService, m.$i18n = c, m.$t = (f, y) => c.t(f, y), m.$f = p, o.$f = p, e.provide("$i18n", c), e.provide("$f", p), e.provide("ui-store", a), e.provide("$theme", n.tokens), e.provide("$superApp", o), e.provide("$s", o), e.provide("$message", i.messageService), e.provide("$dialog", i.dialogService), {
    ...P,
    mount(f = "#app") {
      return e.use($), e.mount(f), e;
    }
  };
}
export {
  $e as A,
  Oe as B,
  Pe as D,
  Ee as S,
  ke as a,
  Le as b,
  tt as c,
  Te as d,
  we as e,
  J as f,
  ze as g,
  Ne as h,
  Ce as i,
  et as j,
  qe as k
};
//# sourceMappingURL=createSapp-DQb9vBnI.js.map
