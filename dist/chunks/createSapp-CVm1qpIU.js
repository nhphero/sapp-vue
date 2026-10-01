import * as Z from "vue";
import { reactive as h, inject as ee, provide as te, h as z, defineComponent as G, onUnmounted as re, onMounted as se, triggerRef as ne, shallowRef as oe, defineAsyncComponent as M, markRaw as E, nextTick as ie, watchEffect as ae, watch as V, computed as ce, ref as le, createApp as ue } from "vue";
import * as pe from "pinia";
import { createPinia as de } from "pinia";
import * as ge from "vue-router";
import { RouterView as fe, createRouter as he, createWebHistory as me } from "vue-router";
import * as ye from "@vueuse/core";
import { useLocalStorage as W } from "@vueuse/core";
import { S as b, R, A as ve, a as U, f as K, b as we, c as D, E as w, M as H } from "./format-BUIIBrkU.js";
import N from "axios";
function Se() {
  const o = h({
    user: null,
    realmRoles: [],
    clientRoles: {},
    provider: null
  });
  function e() {
    return [.../* @__PURE__ */ new Set([...o.realmRoles, ...Object.values(o.clientRoles).flat()])];
  }
  const t = (s) => s.toLowerCase(), r = () => new Set(e().map(t));
  return h({
    get user() {
      return o.user;
    },
    get roles() {
      return e();
    },
    get realmRoles() {
      return o.realmRoles;
    },
    get clientRoles() {
      return o.clientRoles;
    },
    get provider() {
      return o.provider;
    },
    get isAuthenticated() {
      return o.user !== null;
    },
    hasRole(s, n) {
      return n !== void 0 ? (o.clientRoles[n] ?? []).some((i) => t(i) === t(s)) : r().has(t(s));
    },
    hasAnyRole(...s) {
      const n = r();
      return s.some((i) => n.has(t(i)));
    },
    set(s) {
      const n = s.user.role ? [s.user.role] : [];
      o.realmRoles = [...s.realmRoles ?? n], o.clientRoles = Object.fromEntries(
        Object.entries(s.clientRoles ?? {}).map(([i, a]) => [i, [...a]])
      ), o.provider = s.provider, o.user = {
        ...s.user,
        roles: e(),
        realmRoles: o.realmRoles,
        clientRoles: o.clientRoles
      };
    },
    patchUser(s) {
      if (!o.user)
        return;
      const { roles: n, realmRoles: i, clientRoles: a, ...c } = s;
      o.user = { ...o.user, ...c };
    },
    clear() {
      o.user = null, o.realmRoles = [], o.clientRoles = {}, o.provider = null;
    }
  });
}
function Ae(o) {
  const e = (t) => {
    const r = o()?.[t];
    return typeof r == "string" && r.trim() !== "" ? r.trim() : void 0;
  };
  return {
    get values() {
      return { ...o() ?? {} };
    },
    get(t, r) {
      return e(t) ?? r;
    },
    has: (t) => e(t) !== void 0,
    missing: (...t) => t.filter((r) => e(r) === void 0),
    require(t) {
      const r = e(t);
      if (r === void 0) {
        const s = new Error(`The public environment ${t} is not set — Admin → Public Environment.`);
        throw s.name = "EnvironmentMissing", s;
      }
      return r;
    }
  };
}
const ke = {};
class $e {
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
    activeCssScope: "",
    // 🎨 CSS scope of the mini app on screen (mfeScopedCssPlugin)
    environment: {}
    // 🌐 public environment (Admin → Public Environment)
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
  $authState = Se();
  $f;
  /** The public environment over `state.environment` (contracts/env.ts). */
  $env = Ae(() => this.state.environment);
  /** The Proxy returned by the constructor; always hand THIS out (arrow fields capture the raw target as `this`). */
  _self;
  constructor() {
    const e = new Proxy(this, {
      get: (t, r) => {
        if (typeof r == "string" && r.startsWith("$")) {
          const s = r.slice(1);
          if (t._protocols.has(s)) return t._protocols.get(s);
          if (t._modules.has(s)) {
            const n = t._modules.get(s);
            return n.isEnabled === !1 ? (console.warn(`🛡️ [sys-kernel] Access denied: Module $${s} is currently DISABLED.`), null) : n;
          }
          if (s in t) return t[r];
        }
        return t[r];
      }
    });
    return this._self = e, e;
  }
  // --- 🛰️ EVENT BUS (IEventEmitter) ---
  on = (e, t) => {
    this._eventHandlers.has(e) || this._eventHandlers.set(e, /* @__PURE__ */ new Set()), this._eventHandlers.get(e).add(t);
  };
  emit = (e, t) => {
    this._eventHandlers.get(e)?.forEach((r) => r(t));
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
    const r = this._modules.get(e);
    r && (r.isEnabled = t, console.log(`🛡️ [sys-kernel] Module status changed: $${e} -> ${t ? "ENABLED" : "DISABLED"}`), this.emit(b.SYSTEM_GOVERNANCE, { id: e, isEnabled: t }));
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
    const r = this._self ?? this;
    if (typeof e == "function")
      return await e(r, ...t), r;
    const s = e.install;
    if (typeof s != "function") throw new Error("[sys-kernel] install(): plugin has no install() method");
    const n = e.id ?? e.name ?? "anonymous";
    return console.log(`🔌 [sys-kernel] Installing module: ${n}`), s.length >= 2 ? await s.call(e, this.$app, r, ...t) : await s.call(e, r, ...t), r;
  };
  getProtocol = (e) => this._protocols.get(e);
  getModule = (e) => this._modules.get(e);
  /**
   * ⚡ [sys-kernel] Invoke a SuperApp Action via the default API Bridge
   */
  doAction = async (e, t = {}) => {
    const r = this.getProtocol("api");
    if (!r) throw new Error("API protocol not registered in SuperApp.");
    if (!r.doAction) throw new Error("API protocol does not support doAction.");
    return await r.doAction(e, t);
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
    shallowRef: oe,
    triggerRef: ne,
    onMounted: se,
    onUnmounted: re,
    defineComponent: G,
    h: z,
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
      const r = new AbortController(), s = setTimeout(() => r.abort(), 4e3);
      try {
        const n = await fetch(`${this.getPackageFilesBaseUrl()}/${t}`, { cache: "no-cache", signal: r.signal });
        if (!n.ok) throw new Error(`HTTP ${n.status}`);
        return await n.json();
      } finally {
        clearTimeout(s);
      }
    };
    try {
      let t;
      try {
        t = (await e("registry.json"))?.apps ?? [];
      } catch {
        t = (await e("apps.json") ?? []).map((r) => ({ ...r, id: r.appId, name: r.title, type: "package" }));
      }
      this.state.serverApps = t.filter((r) => r?.id).map((r) => this.toRegisteredApp(r)), this.serverAppsLoaded = !0;
    } catch (t) {
      return console.warn(`📦 [sys-kernel] App registry unavailable (${t?.message ?? t}) — built-in apps only.`), this.state.serverApps;
    }
    return this.syncManifestWithRegisteredApps(), this.emit(b.APPS_UPDATED, this.getRegisteredApps()), this.state.serverApps;
  };
  /** Built-in remote URLs per environment: the Shell config's `<id>.url`, else the build's env. */
  builtInUrl = (e) => {
    const t = ke ?? {}, r = {
      admin: t.VITE_ADMIN_URL || "http://localhost:4403",
      workspace: t.VITE_WORKSPACE_URL || "http://localhost:4409"
    };
    return String(this.state.discovery?.[`${e}.url`] || r[e] || "").replace(/\/+$/, "");
  };
  /** A registry row (registry.json / apps.registry.*) as the Shell's record. */
  toRegisteredApp = (e) => {
    const t = String(e.id), r = e.code ? String(e.code) : null, s = {
      id: t,
      code: r,
      slug: e.slug || r || t,
      name: e.name || t,
      description: e.description || "",
      icon: e.icon || (e.type === "package" ? "Package" : "Layers"),
      isSystem: !!e.isSystem,
      isEnabled: e.isEnabled !== !1,
      managedBy: "server",
      updatedAt: e.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
    };
    if (e.type === "package") {
      const i = { ...s, type: "package", package: e.package ?? void 0, version: e.version ?? void 0, channel: e.channel ?? null, url: this.getApiBaseUrl() };
      return { ...i, entryUrl: this.resolveAppEntry(i) };
    }
    const n = String(e.url || this.builtInUrl(r ?? t)).replace(/\/+$/, "");
    return { ...s, type: "remote", url: n, entryUrl: n ? this.formatAppEntryUrl(n) : "" };
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
    const t = e.getAll(), r = this.state.discovery ?? {};
    if (this.state.discovery = t, this.state.environment = e.getEnvironment?.() ?? {}, this.$config) {
      const i = this.$config.moduleManifest ??= {};
      for (const [a, c] of Object.entries(t))
        a.endsWith(".url") && typeof c == "string" && c && r[a] !== c && (i[a.slice(0, -4)] = this.formatAppEntryUrl(c));
    }
    const s = e.getPlatform?.();
    s && this.applyPlatformConfig(s);
    const n = e.getApps?.();
    return n && (this.state.serverApps = n.filter((i) => i?.id).map((i) => this.toRegisteredApp(i)), this.serverAppsLoaded = !0, this.syncManifestWithRegisteredApps(), this.emit(b.APPS_UPDATED, this.getRegisteredApps())), { platform: !!s, apps: !!n };
  };
  /** Branding given to createSapp, kept so an emptied platform field falls back to it. */
  shellBranding = null;
  loadPlatformConfig = async () => {
    if (await this.refreshDiscovery()) return this.state.platformConfig;
    let e;
    try {
      const t = new AbortController(), r = setTimeout(() => t.abort(), 4e3), s = await fetch(`${this.getPackageFilesBaseUrl()}/config.json`, { cache: "no-cache", signal: t.signal });
      if (clearTimeout(r), !s.ok) throw new Error(`HTTP ${s.status}`);
      e = await s.json();
    } catch (t) {
      return console.warn(`⚙️ [sys-kernel] Platform config unavailable (${t?.message ?? t}) — Shell defaults kept.`), null;
    }
    return this.applyPlatformConfig(e);
  };
  /** Admin → Config applied: page title, favicon, the branding the theme shows. */
  applyPlatformConfig = (e) => {
    this.state.platformConfig = e;
    const t = e.general ?? {}, r = t.logo ? this.resolvePackageFileUrl(t.logo) : "", s = t.favicon ? this.resolvePackageFileUrl(t.favicon) : "";
    if (this.$config) {
      this.shellBranding ??= { ...this.$config.branding ?? { name: "" } };
      const a = this.shellBranding;
      this.$config.branding = {
        ...a,
        name: t.title || a.name,
        tagline: t.description || a.tagline,
        logo: r || a.logo,
        // A platform logo has no dark variant of its own — the light plate is used instead.
        logoDark: r ? void 0 : a.logoDark,
        icon: s || a.icon
      };
    }
    const n = this.$config?.branding;
    n?.name && (document.title = n.name);
    const i = n?.icon || n?.logo;
    if (i) {
      const a = document.querySelector('link[rel~="icon"]') ?? Object.assign(document.createElement("link"), { rel: "icon" });
      a.href = i, a.parentNode || document.head.appendChild(a);
    }
    return e;
  };
  resolvePackageFileUrl = (e) => /^([a-z][a-z0-9+.-]*:|\/)/i.test(e) ? e : `${this.getPackageFilesBaseUrl()}/${e.replace(/^\.?\/+/, "")}`;
  manifestCache = /* @__PURE__ */ new Map();
  loadAppManifest = (e) => {
    const t = this.getRegisteredApps().find((n) => n.id === e);
    if (!t) return Promise.resolve(null);
    let r;
    if (t.type === "package") {
      if (!t.package || !t.version) return Promise.resolve(null);
      r = `${this.getPackageFilesBaseUrl()}/${encodeURIComponent(t.package)}/${encodeURIComponent(t.version)}/manifest.json`;
    } else
      r = `${(t.entryUrl || this.formatAppEntryUrl(t.url)).replace(/\/(src\/index\.ts|index\.js)$/, "")}/manifest.json`;
    let s = this.manifestCache.get(r);
    return s || (s = fetch(r, { cache: "no-cache" }).then((n) => n.ok && (n.headers.get("content-type") ?? "").includes("json") ? n.json() : null).catch(() => null), this.manifestCache.set(r, s)), s;
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
    return e.filter((r) => t.has(r.id) || r.code && t.has(`code:${r.code}`) ? !1 : (t.add(r.id), r.code && t.add(`code:${r.code}`), !0));
  };
  syncManifestWithRegisteredApps = () => {
    const e = this.$config;
    if (!e) return;
    const t = e.moduleManifest ??= {};
    for (const [r, s] of Object.entries(this.state.discovery || {})) {
      if (!r.endsWith(".url") || typeof s != "string" || !s) continue;
      const n = r.slice(0, -4);
      n && !t[n] && (t[n] = this.formatAppEntryUrl(s));
    }
    for (const r of this.getRegisteredApps()) {
      if (!r.id || r.isEnabled === !1) continue;
      const s = r.type === "package" ? this.resolveAppEntry(r) : r.entryUrl || (r.url ? this.formatAppEntryUrl(r.url) : "");
      s && (t[r.id] = s, r.id === "workspace" && (t.expose = s));
    }
  };
  /** Saves through the server's registry (admin), then reloads it — every user sees the change. */
  saveApp = async (e, t) => {
    const r = await this.doAction("apps.registry.save", { app: e, create: t });
    return await this.loadServerApps(), this.getRegisteredApps().find((s) => s.id === r?.id) ?? this.toRegisteredApp(r);
  };
  /** The server gives the new app its id (unique, never typed); the slug is its route. */
  registerApp = async (e) => {
    const t = this.normalizeAppId(e.slug ?? "");
    if (!t) throw new Error("The slug (route /app/<slug>) is required");
    const r = e.type === "package" ? "package" : "remote";
    if (r === "remote" && !e.url) throw new Error("Application Remote URL is required");
    return this.saveApp({
      slug: t,
      name: e.name || t,
      type: r,
      url: r === "remote" ? e.url.trim().replace(/\/+$/, "") : void 0,
      package: r === "package" ? e.package : void 0,
      description: e.description || "",
      icon: e.icon || "Layers",
      isEnabled: e.isEnabled ?? !0
    }, !0);
  };
  normalizeAppId = (e) => (e || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/^-+|-+$/g, "");
  updateApp = async (e, t) => {
    if (t.id !== void 0 && this.normalizeAppId(t.id) !== e)
      throw new Error(`The id of [${e}] cannot change — change its slug (route) instead.`);
    const { id: r, ...s } = t;
    return s.slug !== void 0 && (s.slug = this.normalizeAppId(s.slug) || e), s.url && (s.url = s.url.trim().replace(/\/+$/, "")), this.saveApp({ id: e, ...s }, !1);
  };
  findAppByRoute = (e) => {
    const t = this.getRegisteredApps();
    return t.find((r) => (r.slug || r.id) === e) ?? t.find((r) => r.id === e) ?? t.find((r) => r.code === e);
  };
  getApp = (e) => {
    const t = this.getRegisteredApps();
    return t.find((r) => r.id === e) ?? t.find((r) => r.code === e);
  };
  appPath = (e, t = "") => {
    const r = this.getApp(e), s = t.replace(/^\/+/, "");
    return `/app/${r?.slug || e}${s ? `/${s}` : ""}`;
  };
  deleteApp = async (e) => {
    const t = this.getRegisteredApps().find((r) => r.id === e);
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
    const t = this.getConfiguredApps().filter((n) => n.type !== "package").map((n) => ({ ...n, url: "" })), r = [
      ...(Array.isArray(e) ? e : []).filter((n) => n?.id && n.type !== "package" && n.managedBy !== "server" && n.url && !["admin", "workspace"].includes(n.id)),
      ...t
    ].filter((n) => !this.state.serverApps.some((i) => i.id === n.id || i.code === n.id)).map((n) => ({ ...n, code: n.code ?? n.id }));
    if (!r.length) {
      try {
        localStorage.removeItem(R);
      } catch {
      }
      return { imported: [], skipped: [] };
    }
    const s = await this.doAction("apps.registry.import", { apps: r });
    try {
      localStorage.setItem(`${R}.imported`, JSON.stringify(e)), localStorage.removeItem(R);
    } catch {
    }
    return s?.imported?.length && await this.loadServerApps(), { imported: s?.imported ?? [], skipped: s?.skipped ?? [] };
  };
  pingApp = async (e) => {
    const t = Date.now();
    try {
      const r = new AbortController(), s = setTimeout(() => r.abort(), 3500);
      return await fetch(e, {
        method: "GET",
        mode: "no-cors",
        signal: r.signal
      }), clearTimeout(s), { success: !0, latencyMs: Date.now() - t, statusText: "Online" };
    } catch (r) {
      return {
        success: !1,
        latencyMs: Date.now() - t,
        statusText: r.name === "AbortError" ? "Timeout (3.5s)" : r.message || "Offline"
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
      let s = (this.$config?.moduleManifest || {})[e];
      if (!s) {
        const i = this.getRegisteredApps().find((a) => a.id === e);
        i && i.url && (s = i.entryUrl || this.formatAppEntryUrl(i.url), this.$config && (this.$config.moduleManifest || (this.$config.moduleManifest = {}), this.$config.moduleManifest[e] = s));
      }
      if (!s) {
        console.warn(`⚠️ [sys-kernel] No URL manifest found for [${e}].`);
        return;
      }
      try {
        console.log(`🔌 [sys-kernel] Connecting to remote module [${e}] at ${s}`);
        const n = await import(
          /* @vite-ignore */
          s
        ), i = n.default;
        if (this.cssScopes.set(e, String(n.__sappCssScope ?? i?.id ?? e)), i?.install) {
          console.log(`🛠️ [sys-kernel] Installing remote [${e}]...`);
          const a = this.getRegisteredApps().find((c) => c.id === e) ?? null;
          await this.install(i, { moduleId: e, basePath: this.appPath(e), app: a }), this.markModuleInstalled(e), console.log(`✅ [sys-kernel] Remote [${e}] installed successfully.`);
        }
      } catch (n) {
        throw console.error(`🚨 [sys-kernel] Failed to load remote [${e}] from ${s}`, n), n;
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
    let r;
    return typeof t == "function" ? r = E(M(t)) : r = E(t), this.componentCache.set(e, r), r;
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
    const t = this.commands.find((r) => r.id === e);
    t ? (console.log(`🚀 [sys-kernel] Executing command: ${e}`), t.handler()) : console.warn(`⚠️ [sys-kernel] Command not found: ${e}`);
  };
  // --- 🛰️ NAVIGATION & SYNC ---
  onPathChange = (e, t) => {
    const r = this.pathListeners.get(e) || [];
    r.push(t), this.pathListeners.set(e, r);
  };
  runPathAction = (e, t) => {
    console.log(`📡 [sys-kernel] Routing action for ${e}: ${t}`);
    const r = this.pathListeners.get(e);
    r && r.forEach((s) => s(t));
  };
}
class Ee {
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
    const e = localStorage.getItem(ve), t = this.superApp?.$appState?.current_workspace || localStorage.getItem(U), r = `req-${Date.now()}-${Math.floor(Math.random() * 1e4)}`, s = {
      Authorization: e ? `Bearer ${e}` : "",
      "Content-Type": "application/json",
      "request-id": r
    };
    return t && (s["x-workspace-id"] = t, localStorage.getItem(U) !== String(t) && localStorage.setItem(U, String(t))), s;
  }
  async request(e, t = {}) {
    try {
      const r = await fetch(`${this.baseUrl}${e}`, {
        ...t,
        headers: { ...this.getHeaders(), ...t.headers }
      });
      if (!r.ok) {
        const s = await r.json().catch(() => ({ message: "System error" })), n = {
          message: s.error || s.message || `Request failed with status ${r.status}`,
          status: r.status,
          path: e
        };
        throw this.superApp?.emit(b.SYSTEM_ERROR, n), new Error(n.message);
      }
      return r.json().catch(() => ({}));
    } catch (r) {
      throw r.message !== "System error" && this.superApp?.emit(b.SYSTEM_ERROR, { message: r.message, path: e }), r;
    }
  }
  /**
   * ⚡ Invoke a SuperApp Action via the Bridge
   */
  async doAction(e, t = {}) {
    console.log(`📡 [ApiProtocol] Invoking action: ${e}`, t);
    const r = await this.request(`${K.ENDPOINTS.SUPERAPP_CALL}/${e}`, {
      method: "POST",
      body: JSON.stringify(t)
    });
    if (r.success)
      return r.data;
    throw new Error(r.error || `Action ${e} failed`);
  }
  // --- HTTP Helpers (Axios-like compatibility) ---
  async get(e, t = {}) {
    return this.request(e, { ...t, method: "GET" });
  }
  async post(e, t, r = {}) {
    return this.request(e, { ...r, method: "POST", body: JSON.stringify(t) });
  }
  async put(e, t, r = {}) {
    return this.request(e, { ...r, method: "PUT", body: JSON.stringify(t) });
  }
  async delete(e, t = {}) {
    return this.request(e, { ...t, method: "DELETE" });
  }
}
class be {
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
        const t = JSON.parse(e.data), { type: r, data: s, id: n } = t;
        if (r === "ACTION_RESPONSE" && n && this.actionCallbacks.has(n)) {
          const { resolve: i } = this.actionCallbacks.get(n);
          this.actionCallbacks.delete(n), i(s);
          return;
        }
        if (r === "EVENT" && t.event) {
          this.handlers.has(t.event) && this.handlers.get(t.event)?.forEach((i) => i(t.data));
          return;
        }
        this.handlers.has(r) && this.handlers.get(r)?.forEach((i) => i(s));
      } catch (t) {
        console.error("📡 [SocketProtocol] Message Parse Error", t);
      }
    };
  }
  /**
   * ⚡ Execute an action (Queued if connecting)
   */
  async doAction(e, t) {
    const r = (s, n) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        n(new Error("Socket unexpectedly unavailable"));
        return;
      }
      const i = Math.random().toString(36).substring(7);
      this.actionCallbacks.set(i, { resolve: s, reject: n });
      const a = { type: "ACTION", id: i, action: e, data: t };
      this.socket.send(JSON.stringify(a)), setTimeout(() => {
        this.actionCallbacks.has(i) && (this.actionCallbacks.delete(i), n(new Error(`📡 [SocketProtocol] Action "${e}" timed out.`)));
      }, 3e4);
    };
    return new Promise((s, n) => {
      this.socket?.readyState === WebSocket.OPEN ? r(s, n) : (console.log(`📡 [SocketProtocol] Action "${e}" queued (Socket connecting...)`), this.actionQueue.push(() => r(s, n)));
    });
  }
  on(e, t) {
    const r = this.handlers.get(e) || [];
    r.push(t), this.handlers.set(e, r);
  }
}
const Re = {}, _e = ["master_api_url"], Pe = (o) => o.master_api_url || Re?.VITE_MASTER_API_URL || (typeof window < "u" && window.location.hostname === "localhost" ? "http://localhost:4400" : "");
async function I(o) {
  const e = new AbortController(), t = setTimeout(() => e.abort(), 5e3);
  try {
    const r = await fetch(o, { cache: "no-cache", signal: e.signal });
    return !r.ok || !(r.headers.get("content-type") ?? "").includes("json") ? null : await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
class Ce {
  config = {};
  staticConfig = {};
  apiBase = "";
  platform = null;
  environment = {};
  apps = null;
  initialized = !1;
  async initialize(e) {
    this.staticConfig = await I("/config.json") ?? {}, this.apiBase = String(Pe(this.staticConfig)).replace(/\/+$/, ""), await this.reload(), this.initialized = !0, e && (e.state.discovery = { ...this.config }), console.log("🛰️ [Discovery] Total variables loaded:", Object.keys(this.config).length);
  }
  /** Fetches `<backend>/discovery.json` again (after an admin change) and merges it. */
  async reload() {
    const e = this.apiBase ? await I(`${this.apiBase}/discovery.json`) : null;
    if (e && typeof e == "object" && "system" in e) {
      const r = Object.fromEntries(Object.entries(e.environment ?? {}).filter(([s, n]) => typeof n == "string" && !_e.includes(s)));
      return this.environment = r, this.config = { ...e.system ?? {}, ...this.staticConfig, ...r }, this.platform = e.platform ?? null, this.apps = Array.isArray(e.apps) ? e.apps : null, !0;
    }
    const t = this.apiBase ? await I(`${this.apiBase}${K.ENDPOINTS.DISCOVERY}`) : null;
    return this.apiBase || console.warn("🛰️ [Discovery] No master_api_url in config.json or the build — backend discovery skipped."), this.config = { ...t ?? {}, ...this.staticConfig }, !1;
  }
  /** The public environment, from the last discovery.json. */
  getEnvironment() {
    return { ...this.environment };
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
const Te = new Ce(), Me = () => {
  const o = W(we, {
    current_app: "workspace",
    current_workspace: null
  });
  return (typeof o.value != "object" || o.value === null) && (console.warn("⚠️ [AppState] Invalid storage detected, resetting to defaults."), o.value = {
    current_app: "workspace",
    current_workspace: null
  }), h({
    get current_app() {
      return o.value.current_app;
    },
    set current_app(e) {
      o.value.current_app = e;
    },
    get current_workspace() {
      return o.value.current_workspace;
    },
    set current_workspace(e) {
      typeof o.value != "object" ? o.value = { current_app: "workspace", current_workspace: e } : o.value.current_workspace = e;
    },
    // 🏢 Global Workspace Cache (Populated from Discovery)
    workspaces: []
  });
}, Ue = 3e4, L = "x-request-id";
function Ie() {
  if (typeof crypto.randomUUID == "function")
    return crypto.randomUUID();
  const o = crypto.getRandomValues(new Uint8Array(16));
  o[6] = o[6] & 15 | 64, o[8] = o[8] & 63 | 128;
  const e = Array.from(o, (t) => t.toString(16).padStart(2, "0")).join("");
  return `${e.slice(0, 8)}-${e.slice(8, 12)}-${e.slice(12, 16)}-${e.slice(16, 20)}-${e.slice(20)}`;
}
function Le(o) {
  const e = o.response?.data, t = e && typeof e == "object" ? e.message || e.error_description || (typeof e.error == "string" ? e.error : void 0) : void 0;
  return {
    status: o.response?.status ?? null,
    message: t || o.message || "Request failed",
    code: e && typeof e == "object" && (e.code || (typeof e.error == "string" ? e.error : void 0)) || o.code,
    data: e,
    url: o.config?.url,
    method: o.config?.method?.toUpperCase(),
    requestId: o.config?.headers?.get?.(L)?.toString(),
    cause: o
  };
}
function Oe(o) {
  return function(t) {
    const { baseURL: r, headers: s, withToken: n = !0, workspace: i = !1, onError: a, setup: c, ...p } = t;
    if (!r)
      throw new Error("[createApi] `baseURL` is required — read it from env (e.g. import.meta.env.VITE_API_URL).");
    const l = N.create({
      timeout: Ue,
      ...p,
      baseURL: r,
      headers: { Accept: "application/json", ...s }
    });
    return l.interceptors.request.use((u) => {
      if (u.headers.has(L) || u.headers.set(L, Ie()), n) {
        const d = localStorage.getItem(o.tokenKey);
        d && !u.headers.has("Authorization") && u.headers.set("Authorization", `Bearer ${d}`);
      }
      if (i) {
        const d = o.appState?.()?.current_workspace;
        d && u.headers.set("x-workspace-id", String(d));
      }
      return u;
    }), l.interceptors.response.use(
      (u) => u,
      (u) => {
        if (N.isCancel(u))
          return Promise.reject(u);
        const d = Le(u);
        return a ? a(d) : o.message?.error(d.message), Promise.reject(d);
      }
    ), c?.(l), l;
  };
}
const Be = {
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
}, Y = (o, e = "", t = {}) => {
  for (const [r, s] of Object.entries(o)) {
    const n = e ? `${e}.${r}` : r;
    s && typeof s == "object" ? Y(s, n, t) : t[n] = String(s);
  }
  return t;
}, De = (o, e) => e ? o.replace(/\{(\w+)\}/g, (t, r) => e[r] === void 0 || e[r] === null ? t : String(e[r])) : o, Ne = (o, e) => {
  if (e?.count === void 0 || e.count === null || !o.includes("|")) return o;
  const t = Number(e.count);
  if (!Number.isFinite(t)) return o;
  const r = o.split("|").map((s) => s.trim());
  return r.length === 2 ? t === 1 ? r[0] : r[1] : r.length >= 3 ? t === 0 ? r[0] : t === 1 ? r[1] : r[2] : r[0];
};
function je(o = {}) {
  const e = o.fallbackLocale ?? "en", t = o.persist ?? !0, r = t ? (() => {
    try {
      return localStorage.getItem(D);
    } catch {
      return null;
    }
  })() : null, s = h({ locale: r || o.locale || e, messages: {} }), n = /* @__PURE__ */ new Set(), i = (l, u, d) => {
    const k = Y(u, d || "");
    s.messages[l] = { ...s.messages[l] ?? {}, ...k };
  }, a = (l, u) => {
    for (const [d, k] of Object.entries(l)) i(d, k, u);
  };
  a(Be), o.messages && a(o.messages);
  const c = (l, u) => s.messages[u]?.[l], p = {
    get locale() {
      return s.locale;
    },
    set locale(l) {
      p.setLocale(l);
    },
    fallbackLocale: e,
    get availableLocales() {
      return Object.keys(s.messages);
    },
    t(l, u) {
      const d = c(l, s.locale) ?? c(l, e) ?? u?.default ?? l;
      return De(Ne(d, u), u);
    },
    te(l, u) {
      return c(l, u ?? s.locale) !== void 0 || !u && c(l, e) !== void 0;
    },
    setLocale(l) {
      if (!l || l === s.locale) return;
      const u = s.locale;
      if (s.locale = l, t)
        try {
          localStorage.setItem(D, l);
        } catch {
        }
      document.documentElement.setAttribute("lang", l), n.forEach((d) => d(l, u));
    },
    addMessages: a,
    addLocaleMessages: i,
    getMessages(l = s.locale, u = !0) {
      return u ? { ...s.messages[e] ?? {}, ...s.messages[l] ?? {} } : { ...s.messages[l] ?? {} };
    },
    onLocaleChange(l) {
      return n.add(l), () => n.delete(l);
    }
  };
  return typeof document < "u" && document.documentElement.setAttribute("lang", s.locale), V(() => s.locale, () => {
  }), p;
}
function S(o) {
  return o === "vi" ? "vi-VN" : o === "en" ? "en-US" : o;
}
const j = /* @__PURE__ */ new Map();
function A(o, e) {
  const t = j.get(o);
  if (t)
    return t;
  const r = e();
  return j.set(o, r), r;
}
function _(o) {
  if (o == null || o === "")
    return null;
  const e = o instanceof Date ? o : new Date(o);
  return Number.isNaN(e.getTime()) ? null : e;
}
const Fe = [
  { unit: "year", ms: 365 * 864e5 },
  { unit: "month", ms: 30 * 864e5 },
  { unit: "day", ms: 864e5 },
  { unit: "hour", ms: 36e5 },
  { unit: "minute", ms: 6e4 },
  { unit: "second", ms: 1e3 }
], F = ["B", "KB", "MB", "GB", "TB", "PB"], xe = /* @__PURE__ */ new Set([
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
function qe() {
  return { groups: /* @__PURE__ */ new Map(), owners: /* @__PURE__ */ new Map() };
}
function J(o, e = {}) {
  const t = e.fallbackLocale ?? "vi";
  let r = e.currency ?? "VND";
  const s = e.registry ?? qe(), n = {
    get locale() {
      return o() || t;
    },
    get currency() {
      return r;
    },
    set currency(i) {
      r = i;
    },
    formatMoney(i, a) {
      if (i == null || !Number.isFinite(i))
        return w;
      const c = a ?? r, p = S(n.locale);
      return A(`money:${p}:${c}`, () => new Intl.NumberFormat(p, {
        style: "currency",
        currency: c,
        maximumFractionDigits: 0
      })).format(i);
    },
    formatNumber(i, a = 0) {
      if (i == null || !Number.isFinite(i))
        return w;
      const c = S(n.locale);
      return A(`number:${c}:${a}`, () => new Intl.NumberFormat(c, {
        maximumFractionDigits: a
      })).format(i);
    },
    formatPercent(i, a = 1) {
      if (i == null || !Number.isFinite(i))
        return w;
      const c = S(n.locale);
      return A(`percent:${c}:${a}`, () => new Intl.NumberFormat(c, {
        style: "percent",
        maximumFractionDigits: a
      })).format(i);
    },
    formatDate(i) {
      const a = _(i);
      if (!a)
        return w;
      const c = S(n.locale);
      return A(`date:${c}`, () => new Intl.DateTimeFormat(c, {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })).format(a);
    },
    formatDateTime(i) {
      const a = _(i);
      if (!a)
        return w;
      const c = S(n.locale);
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
        return w;
      const c = S(n.locale);
      return A(`time:${c}`, () => new Intl.DateTimeFormat(c, {
        hour: "2-digit",
        minute: "2-digit"
      })).format(a);
    },
    formatRelative(i) {
      const a = _(i);
      if (!a)
        return w;
      const c = S(n.locale), p = A(`relative:${c}`, () => new Intl.RelativeTimeFormat(c, {
        numeric: "auto"
      })), l = a.getTime() - Date.now();
      for (const u of Fe)
        if (Math.abs(l) >= u.ms)
          return p.format(Math.round(l / u.ms), u.unit);
      return p.format(0, "second");
    },
    formatBytes(i, a = 1) {
      if (i == null || !Number.isFinite(i))
        return w;
      let c = Math.abs(i), p = 0;
      for (; c >= 1024 && p < F.length - 1; )
        c = c / 1024, p = p + 1;
      const l = i < 0 ? "-" : "", u = p === 0 ? 0 : a;
      return `${l}${n.formatNumber(c, u)} ${F[p]}`;
    },
    withLocale(i) {
      return J(() => i, { fallbackLocale: t, currency: r, registry: s });
    },
    register(i, a) {
      if (!i)
        throw new Error("[format] register() needs a namespace — use the module id.");
      const c = s.groups.get(i) ?? {};
      for (const [p, l] of Object.entries(a)) {
        if (xe.has(p))
          throw new Error(`[format] "${p}" is a built-in formatter and cannot be replaced.`);
        c[p] = l;
        const u = s.owners.get(p);
        if (!u) {
          s.owners.set(p, i);
          continue;
        }
        u !== i && console.warn(
          `⚠️ [format] "${p}" is already registered by [${u}], so $f.${p} stays theirs. [${i}] can reach its own as $f.of('${i}').${p}.`
        );
      }
      return s.groups.set(i, c), c;
    },
    of(i) {
      return s.groups.get(i) ?? {};
    },
    ownerOf(i) {
      return s.owners.get(i) ?? null;
    }
  };
  return new Proxy(n, {
    get(i, a, c) {
      if (typeof a != "string" || a in i)
        return Reflect.get(i, a, c);
      const p = s.owners.get(a);
      if (p)
        return s.groups.get(p)?.[a];
    },
    has(i, a) {
      return a in i ? !0 : typeof a == "string" && s.owners.has(a);
    },
    ownKeys(i) {
      return [.../* @__PURE__ */ new Set([...Reflect.ownKeys(i), ...s.owners.keys()])];
    },
    getOwnPropertyDescriptor(i, a) {
      const c = Reflect.getOwnPropertyDescriptor(i, a);
      if (c)
        return c;
      if (typeof a == "string" && s.owners.has(a))
        return { configurable: !0, enumerable: !0, value: void 0 };
    }
  });
}
function ze(o, e = {}) {
  return J(() => o.locale, e);
}
function Ge(o) {
  return globalThis[H] = o, o;
}
function tt() {
  return globalThis[H];
}
const Ve = {}, x = "Root", We = Ve ?? {}, Ke = (o) => o || We.VITE_MASTER_API_URL || (window.location.hostname === "localhost" ? "http://localhost:4400" : ""), He = () => {
  const o = window.location.protocol === "https:" ? "wss:" : "ws:", e = window.location.host.replace(":4401", ":4400");
  return `${o}//${e}/socket`;
}, q = (o, e) => async () => {
  const t = o.getComponent(e);
  if (!t) throw new Error(`[sapp] Route component not registered: ${e}`);
  return typeof t == "function" ? t() : t;
};
async function rt(o) {
  Ge({ Vue: Z, Pinia: pe, VueRouter: ge, VueUse: ye });
  const e = ue(o.root), t = de();
  e.use(t);
  const r = o.discovery ?? Te;
  await r.initialize();
  const s = o.api?.baseUrl ?? Ke(r.get("master_api_url"));
  console.log("💉 [sapp] apiBase:", s);
  const n = new $e();
  n.discoveryService = r, n.$app = e, window.$superApp = n;
  const i = o.theme.register(e, n), a = i.uiStore, c = je(o.i18n), p = ze(c, { currency: o.currency });
  n.registerProtocol("i18n", c), c.onLocaleChange((f, y) => n.emit("i18n:locale-changed", { locale: f, previous: y }));
  const l = new Ee(s), u = new be(o.socket?.url ?? He());
  u.connect(), n.registerProtocol("api", l), n.registerProtocol("socket", u), l.bind(n);
  const d = o.auth?.tokenKey ?? "accessToken";
  n.createApi = Oe({
    tokenKey: d,
    message: i.messageService,
    appState: () => n.$appState
  });
  const k = o.auth?.loginPath ?? "/login", Q = o.layout ?? G({ name: "SappLayout", setup: () => () => z(fe) }), X = [
    { path: k, name: "Login", component: q(n, o.auth?.loginComponentId ?? "auth.login"), meta: { public: !0 } },
    {
      path: "/",
      name: x,
      component: Q,
      children: [
        { path: "app/:moduleId(.*)*", name: "AppGateway", component: q(n, "layout.app-container") }
      ]
    },
    ...o.routes ?? []
  ], $ = he({ history: me(o.router?.base), routes: X });
  $.beforeEach((f, y, g) => {
    const v = localStorage.getItem(d);
    if (!f.meta.public && !v) return g(k);
    g();
  });
  const P = { app: e, router: $, pinia: t, superApp: n, discovery: r, api: l, socket: u };
  if (await o.modules?.(P), n.state.discovery = r.getAll(), n.init({
    app: e,
    router: $,
    config: { moduleManifest: { ...o.manifest ?? {}, ...r.getAll() }, branding: o.branding },
    theme: o.tokens,
    message: i.messageService,
    dialog: i.dialogService
  }), o.branding) {
    const { name: f, icon: y, logo: g } = o.branding;
    f && (document.title = f);
    const v = y || g;
    if (v) {
      const T = document.querySelector('link[rel~="icon"]') ?? Object.assign(document.createElement("link"), { rel: "icon" });
      T.href = v, T.parentNode || document.head.appendChild(T);
    }
  }
  const O = n.applyDiscovery();
  O.platform || await n.loadPlatformConfig(), O.apps || await n.loadServerApps();
  const C = i.appState ?? Me(), B = r.get("system.workspaces");
  B && (C.workspaces = B), n.$appState = C, e.config.globalProperties.$appState = C, e.config.globalProperties.$auth = n.$authState, e.provide("$auth", n.$authState);
  for (const f of o.features ?? []) {
    const y = {
      ...P,
      featureId: f.id,
      registerRoute: (g) => $.addRoute(x, g),
      registerTopRoute: (g) => $.addRoute(g),
      registerComponent: (g) => n.registerComponent(g),
      registerSkill: (g) => n.registerSkill(g),
      registerCommand: (g) => n.registerCommand(g),
      registerMessages: (g, v) => c.addMessages(g, v),
      provide: (g, v) => e.provide(g, v)
    };
    await f.install(y), console.log(`🧩 [sapp] Shell feature installed: ${f.id}`);
  }
  const m = e.config.globalProperties;
  return m.$c = (f) => n.getComponent(f), m.$s = n, m.$superApp = n, m.$message = i.messageService, m.$dialog = i.dialogService, m.$i18n = c, m.$t = (f, y) => c.t(f, y), m.$f = p, n.$f = p, m.$env = n.$env, e.provide("$env", n.$env), e.provide("$i18n", c), e.provide("$f", p), e.provide("ui-store", a), e.provide("$theme", o.tokens), e.provide("$superApp", n), e.provide("$s", n), e.provide("$message", i.messageService), e.provide("$dialog", i.dialogService), {
    ...P,
    mount(f = "#app") {
      return e.use($), e.mount(f), e;
    }
  };
}
export {
  Ee as A,
  Be as B,
  Ce as D,
  be as S,
  $e as a,
  Oe as b,
  rt as c,
  Me as d,
  Se as e,
  J as f,
  ze as g,
  je as h,
  Te as i,
  tt as j,
  Ge as k
};
//# sourceMappingURL=createSapp-CVm1qpIU.js.map
