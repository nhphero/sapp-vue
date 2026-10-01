import * as Q from "vue";
import { reactive as m, inject as X, provide as Z, h as x, defineComponent as z, onUnmounted as ee, onMounted as te, triggerRef as re, shallowRef as se, defineAsyncComponent as M, markRaw as E, nextTick as oe, watchEffect as ne, watch as q, computed as ie, ref as ae, createApp as ce } from "vue";
import * as le from "pinia";
import { createPinia as ue } from "pinia";
import * as pe from "vue-router";
import { RouterView as de, createRouter as ge, createWebHistory as fe } from "vue-router";
import * as me from "@vueuse/core";
import { useLocalStorage as V } from "@vueuse/core";
import { S as _, R as b, A as he, a as I, f as G, b as ye, c as O, E as k, M as K } from "./format-BUIIBrkU.js";
import N from "axios";
function Se() {
  const n = m({
    user: null,
    realmRoles: [],
    clientRoles: {},
    provider: null
  });
  function e() {
    return [.../* @__PURE__ */ new Set([...n.realmRoles, ...Object.values(n.clientRoles).flat()])];
  }
  const t = (s) => s.toLowerCase(), r = () => new Set(e().map(t));
  return m({
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
    hasRole(s, o) {
      return o !== void 0 ? (n.clientRoles[o] ?? []).some((i) => t(i) === t(s)) : r().has(t(s));
    },
    hasAnyRole(...s) {
      const o = r();
      return s.some((i) => o.has(t(i)));
    },
    set(s) {
      const o = s.user.role ? [s.user.role] : [];
      n.realmRoles = [...s.realmRoles ?? o], n.clientRoles = Object.fromEntries(
        Object.entries(s.clientRoles ?? {}).map(([i, a]) => [i, [...a]])
      ), n.provider = s.provider, n.user = {
        ...s.user,
        roles: e(),
        realmRoles: n.realmRoles,
        clientRoles: n.clientRoles
      };
    },
    patchUser(s) {
      if (!n.user)
        return;
      const { roles: o, realmRoles: i, clientRoles: a, ...c } = s;
      n.user = { ...n.user, ...c };
    },
    clear() {
      n.user = null, n.realmRoles = [], n.clientRoles = {}, n.provider = null;
    }
  });
}
const ke = {};
class we {
  modules = /* @__PURE__ */ new Map();
  components = /* @__PURE__ */ new Map();
  // 🛰️ ESA v5: Reactive Registries
  _protocols = m(/* @__PURE__ */ new Map());
  _modules = m(/* @__PURE__ */ new Map());
  // 🧠 ESA v5: Event Bus (Central Nervous System)
  _eventHandlers = /* @__PURE__ */ new Map();
  // ⚡ Reactive state for UI elements (Navigation, Command Palette)
  state = m({
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
  $authState = Se();
  $f;
  /** The Proxy returned by the constructor; always hand THIS out (arrow fields capture the raw target as `this`). */
  _self;
  constructor() {
    const e = new Proxy(this, {
      get: (t, r) => {
        if (typeof r == "string" && r.startsWith("$")) {
          const s = r.slice(1);
          if (t._protocols.has(s)) return t._protocols.get(s);
          if (t._modules.has(s)) {
            const o = t._modules.get(s);
            return o.isEnabled === !1 ? (console.warn(`🛡️ [sys-kernel] Access denied: Module $${s} is currently DISABLED.`), null) : o;
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
    r && (r.isEnabled = t, console.log(`🛡️ [sys-kernel] Module status changed: $${e} -> ${t ? "ENABLED" : "DISABLED"}`), this.emit(_.SYSTEM_GOVERNANCE, { id: e, isEnabled: t }));
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
    const o = e.id ?? e.name ?? "anonymous";
    return console.log(`🔌 [sys-kernel] Installing module: ${o}`), s.length >= 2 ? await s.call(e, this.$app, r, ...t) : await s.call(e, r, ...t), r;
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
    ref: ae,
    reactive: m,
    computed: ie,
    watch: q,
    watchEffect: ne,
    nextTick: oe,
    markRaw: E,
    defineAsyncComponent: M,
    shallowRef: se,
    triggerRef: re,
    onMounted: te,
    onUnmounted: ee,
    defineComponent: z,
    h: x,
    provide: Z,
    inject: X,
    useLocalStorage: V
  };
  init = (e) => {
    console.log("🚀 [sys-kernel] SuperApp Platform Kernel Initializing..."), this.$app = e.app, this.$router = e.router, this.$api = e.api, this.$config = e.config ? m({ ...e.config }) : null, this.$theme = e.theme, this.$message = e.message, this.$dialog = e.dialog, this.state.isInitializing = !1, this.syncManifestWithRegisteredApps();
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
  loadServerApps = async () => {
    const e = async (t) => {
      const r = new AbortController(), s = setTimeout(() => r.abort(), 4e3);
      try {
        const o = await fetch(`${this.getPackageFilesBaseUrl()}/${t}`, { cache: "no-cache", signal: r.signal });
        if (!o.ok) throw new Error(`HTTP ${o.status}`);
        return await o.json();
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
    return this.syncManifestWithRegisteredApps(), this.emit(_.APPS_UPDATED, this.getRegisteredApps()), this.state.serverApps;
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
    const t = String(e.id), r = {
      id: t,
      slug: e.slug || t,
      name: e.name || t,
      description: e.description || "",
      icon: e.icon || (e.type === "package" ? "Package" : "Layers"),
      isSystem: !!e.isSystem,
      isEnabled: e.isEnabled !== !1,
      managedBy: "server",
      updatedAt: e.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
    };
    if (e.type === "package") {
      const o = { ...r, type: "package", package: e.package ?? void 0, version: e.version ?? void 0, channel: e.channel ?? null, url: this.getApiBaseUrl() };
      return { ...o, entryUrl: this.resolveAppEntry(o) };
    }
    const s = String(e.url || this.builtInUrl(t)).replace(/\/+$/, "");
    return { ...r, type: "remote", url: s, entryUrl: s ? this.formatAppEntryUrl(s) : "" };
  };
  /** Branding given to createSapp, kept so an emptied platform field falls back to it. */
  shellBranding = null;
  loadPlatformConfig = async () => {
    let e;
    try {
      const a = new AbortController(), c = setTimeout(() => a.abort(), 4e3), p = await fetch(`${this.getPackageFilesBaseUrl()}/config.json`, { cache: "no-cache", signal: a.signal });
      if (clearTimeout(c), !p.ok) throw new Error(`HTTP ${p.status}`);
      e = await p.json();
    } catch (a) {
      return console.warn(`⚙️ [sys-kernel] Platform config unavailable (${a?.message ?? a}) — Shell defaults kept.`), null;
    }
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
    let r;
    if (t.type === "package") {
      if (!t.package || !t.version) return Promise.resolve(null);
      r = `${this.getPackageFilesBaseUrl()}/${encodeURIComponent(t.package)}/${encodeURIComponent(t.version)}/manifest.json`;
    } else
      r = `${(t.entryUrl || this.formatAppEntryUrl(t.url)).replace(/\/(src\/index\.ts|index\.js)$/, "")}/manifest.json`;
    let s = this.manifestCache.get(r);
    return s || (s = fetch(r, { cache: "no-cache" }).then((o) => o.ok && (o.headers.get("content-type") ?? "").includes("json") ? o.json() : null).catch(() => null), this.manifestCache.set(r, s)), s;
  };
  /** Stand-ins while the server's registry has not answered (it seeds the same built-ins). */
  getBuiltInApps = () => [
    { id: "admin", name: "Admin Management", description: "Platform Governance & Applications Registry", icon: "Shield", isSystem: !0 },
    { id: "workspace", name: "Workspace Hub", description: "Logic Orchestration & Flow Designer", icon: "Globe", isSystem: !0 }
  ].map((e) => this.toRegisteredApp({ ...e, type: "remote", url: "" }));
  /**
   * Apps declared by the Shell's config (`config.json` / discovery) under `registry.apps`:
   * `[{ id, name, description?, icon?, type?, package? }]`. A `remote` app (default) is mounted from its
   * `<id>.url` entry; a `package` app needs no URL — the backend serves its deployed version. They join
   * the server's registry (which wins for an id it has).
   */
  getConfiguredApps = () => {
    const e = this.state.discovery?.["registry.apps"];
    return Array.isArray(e) ? e.filter((t) => t?.id && (t.type === "package" || typeof this.state.discovery?.[`${t.id}.url`] == "string")).map((t) => ({ ...this.toRegisteredApp({ ...t, isSystem: !0, url: "" }), managedBy: void 0 })) : [];
  };
  /** The server's registry (sys_apps), then config-declared apps; the built-ins until the server answers. */
  getRegisteredApps = () => {
    const e = [
      ...this.state.serverApps,
      ...this.getConfiguredApps(),
      ...this.serverAppsLoaded ? [] : this.getBuiltInApps()
    ], t = /* @__PURE__ */ new Set();
    return e.filter((r) => !t.has(r.id) && t.add(r.id));
  };
  syncManifestWithRegisteredApps = () => {
    const e = this.$config;
    if (!e) return;
    const t = e.moduleManifest ??= {};
    for (const [r, s] of Object.entries(this.state.discovery || {})) {
      if (!r.endsWith(".url") || typeof s != "string" || !s) continue;
      const o = r.slice(0, -4);
      o && !t[o] && (t[o] = this.formatAppEntryUrl(s));
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
  registerApp = async (e) => {
    const t = this.normalizeAppId(e.id);
    if (!t) throw new Error("Application ID is required");
    const r = e.type === "package" ? "package" : "remote";
    if (r === "remote" && !e.url) throw new Error("Application Remote URL is required");
    return this.saveApp({
      id: t,
      slug: this.normalizeAppId(e.slug ?? "") || t,
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
    return t.find((r) => (r.slug || r.id) === e) ?? t.find((r) => r.id === e);
  };
  appPath = (e, t = "") => {
    const r = this.getRegisteredApps().find((o) => o.id === e), s = t.replace(/^\/+/, "");
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
      e = JSON.parse(localStorage.getItem(b) || "[]");
    } catch {
    }
    const t = this.getConfiguredApps().filter((o) => o.type !== "package").map((o) => ({ ...o, url: "" })), r = [
      ...(Array.isArray(e) ? e : []).filter((o) => o?.id && o.type !== "package" && o.managedBy !== "server" && o.url && !["admin", "workspace"].includes(o.id)),
      ...t
    ].filter((o) => !this.state.serverApps.some((i) => i.id === o.id));
    if (!r.length) {
      try {
        localStorage.removeItem(b);
      } catch {
      }
      return { imported: [], skipped: [] };
    }
    const s = await this.doAction("apps.registry.import", { apps: r });
    try {
      localStorage.setItem(`${b}.imported`, JSON.stringify(e)), localStorage.removeItem(b);
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
        const o = await import(
          /* @vite-ignore */
          s
        ), i = o.default;
        if (this.cssScopes.set(e, String(o.__sappCssScope ?? i?.id ?? e)), i?.install) {
          console.log(`🛠️ [sys-kernel] Installing remote [${e}]...`);
          const a = this.getRegisteredApps().find((c) => c.id === e) ?? null;
          await this.install(i, { moduleId: e, basePath: this.appPath(e), app: a }), this.markModuleInstalled(e), console.log(`✅ [sys-kernel] Remote [${e}] installed successfully.`);
        }
      } catch (o) {
        throw console.error(`🚨 [sys-kernel] Failed to load remote [${e}] from ${s}`, o), o;
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
  getModuleState = (e, t = {}) => (this.state.moduleStates[e] || (this.state.moduleStates[e] = m(t)), this.state.moduleStates[e]);
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
  skills = m([]);
  commands = m([]);
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
class Ae {
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
    const e = localStorage.getItem(he), t = this.superApp?.$appState?.current_workspace || localStorage.getItem(I), r = `req-${Date.now()}-${Math.floor(Math.random() * 1e4)}`, s = {
      Authorization: e ? `Bearer ${e}` : "",
      "Content-Type": "application/json",
      "request-id": r
    };
    return t && (s["x-workspace-id"] = t, localStorage.getItem(I) !== String(t) && localStorage.setItem(I, String(t))), s;
  }
  async request(e, t = {}) {
    try {
      const r = await fetch(`${this.baseUrl}${e}`, {
        ...t,
        headers: { ...this.getHeaders(), ...t.headers }
      });
      if (!r.ok) {
        const s = await r.json().catch(() => ({ message: "System error" })), o = {
          message: s.error || s.message || `Request failed with status ${r.status}`,
          status: r.status,
          path: e
        };
        throw this.superApp?.emit(_.SYSTEM_ERROR, o), new Error(o.message);
      }
      return r.json().catch(() => ({}));
    } catch (r) {
      throw r.message !== "System error" && this.superApp?.emit(_.SYSTEM_ERROR, { message: r.message, path: e }), r;
    }
  }
  /**
   * ⚡ Invoke a SuperApp Action via the Bridge
   */
  async doAction(e, t = {}) {
    console.log(`📡 [ApiProtocol] Invoking action: ${e}`, t);
    const r = await this.request(`${G.ENDPOINTS.SUPERAPP_CALL}/${e}`, {
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
class ve {
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
        const t = JSON.parse(e.data), { type: r, data: s, id: o } = t;
        if (r === "ACTION_RESPONSE" && o && this.actionCallbacks.has(o)) {
          const { resolve: i } = this.actionCallbacks.get(o);
          this.actionCallbacks.delete(o), i(s);
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
    const r = (s, o) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        o(new Error("Socket unexpectedly unavailable"));
        return;
      }
      const i = Math.random().toString(36).substring(7);
      this.actionCallbacks.set(i, { resolve: s, reject: o });
      const a = { type: "ACTION", id: i, action: e, data: t };
      this.socket.send(JSON.stringify(a)), setTimeout(() => {
        this.actionCallbacks.has(i) && (this.actionCallbacks.delete(i), o(new Error(`📡 [SocketProtocol] Action "${e}" timed out.`)));
      }, 3e4);
    };
    return new Promise((s, o) => {
      this.socket?.readyState === WebSocket.OPEN ? r(s, o) : (console.log(`📡 [SocketProtocol] Action "${e}" queued (Socket connecting...)`), this.actionQueue.push(() => r(s, o)));
    });
  }
  on(e, t) {
    const r = this.handlers.get(e) || [];
    r.push(t), this.handlers.set(e, r);
  }
}
const $e = { BASE_URL: "/", DEV: !1, MODE: "production", PROD: !0, SSR: !1 };
class Ee {
  config = {};
  initialized = !1;
  /**
   * Fetches dynamic configuration from the discovery endpoint AND static config.json.
   */
  async initialize(e) {
    try {
      const t = await fetch("/config.json").catch(() => null);
      let r = {};
      if (t && t.ok) {
        const a = t.headers.get("content-type");
        a && a.includes("application/json") ? (r = await t.json(), console.log("🏗️ [Discovery] Static runtime config loaded from /config.json")) : console.warn("🏗️ [Discovery] /config.json returned non-JSON content (likely index.html fallback)");
      }
      const s = r.master_api_url || $e?.VITE_MASTER_API_URL || "";
      s || console.warn("🛰️ [Discovery] No master_api_url found in config.json or environment. API discovery skipped.");
      const o = s ? await fetch(`${s}${G.ENDPOINTS.DISCOVERY}`).catch(() => null) : null;
      let i = {};
      if (o && o.ok) {
        const a = o.headers.get("content-type");
        if (a && a.includes("application/json"))
          try {
            i = await o.json(), console.log("🛰️ [Discovery] Dynamic API discovery config loaded.");
          } catch {
            console.warn("🛰️ [Discovery] API returned invalid JSON");
          }
      }
      this.config = { ...i, ...r }, this.initialized = !0, e && (e.state.discovery = { ...this.config }), console.log("🛰️ [Discovery] Total variables loaded:", Object.keys(this.config).length);
    } catch (t) {
      console.error("🛰️ [Discovery] Failed to sync configuration", t);
    }
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
const be = new Ee(), Re = () => {
  const n = V(ye, {
    current_app: "workspace",
    current_workspace: null
  });
  return (typeof n.value != "object" || n.value === null) && (console.warn("⚠️ [AppState] Invalid storage detected, resetting to defaults."), n.value = {
    current_app: "workspace",
    current_workspace: null
  }), m({
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
}, _e = 3e4, U = "x-request-id";
function Pe() {
  if (typeof crypto.randomUUID == "function")
    return crypto.randomUUID();
  const n = crypto.getRandomValues(new Uint8Array(16));
  n[6] = n[6] & 15 | 64, n[8] = n[8] & 63 | 128;
  const e = Array.from(n, (t) => t.toString(16).padStart(2, "0")).join("");
  return `${e.slice(0, 8)}-${e.slice(8, 12)}-${e.slice(12, 16)}-${e.slice(16, 20)}-${e.slice(20)}`;
}
function Ce(n) {
  const e = n.response?.data, t = e && typeof e == "object" ? e.message || e.error_description || (typeof e.error == "string" ? e.error : void 0) : void 0;
  return {
    status: n.response?.status ?? null,
    message: t || n.message || "Request failed",
    code: e && typeof e == "object" && (e.code || (typeof e.error == "string" ? e.error : void 0)) || n.code,
    data: e,
    url: n.config?.url,
    method: n.config?.method?.toUpperCase(),
    requestId: n.config?.headers?.get?.(U)?.toString(),
    cause: n
  };
}
function Te(n) {
  return function(t) {
    const { baseURL: r, headers: s, withToken: o = !0, workspace: i = !1, onError: a, setup: c, ...p } = t;
    if (!r)
      throw new Error("[createApi] `baseURL` is required — read it from env (e.g. import.meta.env.VITE_API_URL).");
    const l = N.create({
      timeout: _e,
      ...p,
      baseURL: r,
      headers: { Accept: "application/json", ...s }
    });
    return l.interceptors.request.use((u) => {
      if (u.headers.has(U) || u.headers.set(U, Pe()), o) {
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
        const d = Ce(u);
        return a ? a(d) : n.message?.error(d.message), Promise.reject(d);
      }
    ), c?.(l), l;
  };
}
const Me = {
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
}, W = (n, e = "", t = {}) => {
  for (const [r, s] of Object.entries(n)) {
    const o = e ? `${e}.${r}` : r;
    s && typeof s == "object" ? W(s, o, t) : t[o] = String(s);
  }
  return t;
}, Ie = (n, e) => e ? n.replace(/\{(\w+)\}/g, (t, r) => e[r] === void 0 || e[r] === null ? t : String(e[r])) : n, Ue = (n, e) => {
  if (e?.count === void 0 || e.count === null || !n.includes("|")) return n;
  const t = Number(e.count);
  if (!Number.isFinite(t)) return n;
  const r = n.split("|").map((s) => s.trim());
  return r.length === 2 ? t === 1 ? r[0] : r[1] : r.length >= 3 ? t === 0 ? r[0] : t === 1 ? r[1] : r[2] : r[0];
};
function Le(n = {}) {
  const e = n.fallbackLocale ?? "en", t = n.persist ?? !0, r = t ? (() => {
    try {
      return localStorage.getItem(O);
    } catch {
      return null;
    }
  })() : null, s = m({ locale: r || n.locale || e, messages: {} }), o = /* @__PURE__ */ new Set(), i = (l, u, d) => {
    const v = W(u, d || "");
    s.messages[l] = { ...s.messages[l] ?? {}, ...v };
  }, a = (l, u) => {
    for (const [d, v] of Object.entries(l)) i(d, v, u);
  };
  a(Me), n.messages && a(n.messages);
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
      return Ie(Ue(d, u), u);
    },
    te(l, u) {
      return c(l, u ?? s.locale) !== void 0 || !u && c(l, e) !== void 0;
    },
    setLocale(l) {
      if (!l || l === s.locale) return;
      const u = s.locale;
      if (s.locale = l, t)
        try {
          localStorage.setItem(O, l);
        } catch {
        }
      document.documentElement.setAttribute("lang", l), o.forEach((d) => d(l, u));
    },
    addMessages: a,
    addLocaleMessages: i,
    getMessages(l = s.locale, u = !0) {
      return u ? { ...s.messages[e] ?? {}, ...s.messages[l] ?? {} } : { ...s.messages[l] ?? {} };
    },
    onLocaleChange(l) {
      return o.add(l), () => o.delete(l);
    }
  };
  return typeof document < "u" && document.documentElement.setAttribute("lang", s.locale), q(() => s.locale, () => {
  }), p;
}
function w(n) {
  return n === "vi" ? "vi-VN" : n === "en" ? "en-US" : n;
}
const D = /* @__PURE__ */ new Map();
function A(n, e) {
  const t = D.get(n);
  if (t)
    return t;
  const r = e();
  return D.set(n, r), r;
}
function R(n) {
  if (n == null || n === "")
    return null;
  const e = n instanceof Date ? n : new Date(n);
  return Number.isNaN(e.getTime()) ? null : e;
}
const Oe = [
  { unit: "year", ms: 365 * 864e5 },
  { unit: "month", ms: 30 * 864e5 },
  { unit: "day", ms: 864e5 },
  { unit: "hour", ms: 36e5 },
  { unit: "minute", ms: 6e4 },
  { unit: "second", ms: 1e3 }
], B = ["B", "KB", "MB", "GB", "TB", "PB"], Ne = /* @__PURE__ */ new Set([
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
function De() {
  return { groups: /* @__PURE__ */ new Map(), owners: /* @__PURE__ */ new Map() };
}
function H(n, e = {}) {
  const t = e.fallbackLocale ?? "vi";
  let r = e.currency ?? "VND";
  const s = e.registry ?? De(), o = {
    get locale() {
      return n() || t;
    },
    get currency() {
      return r;
    },
    set currency(i) {
      r = i;
    },
    formatMoney(i, a) {
      if (i == null || !Number.isFinite(i))
        return k;
      const c = a ?? r, p = w(o.locale);
      return A(`money:${p}:${c}`, () => new Intl.NumberFormat(p, {
        style: "currency",
        currency: c,
        maximumFractionDigits: 0
      })).format(i);
    },
    formatNumber(i, a = 0) {
      if (i == null || !Number.isFinite(i))
        return k;
      const c = w(o.locale);
      return A(`number:${c}:${a}`, () => new Intl.NumberFormat(c, {
        maximumFractionDigits: a
      })).format(i);
    },
    formatPercent(i, a = 1) {
      if (i == null || !Number.isFinite(i))
        return k;
      const c = w(o.locale);
      return A(`percent:${c}:${a}`, () => new Intl.NumberFormat(c, {
        style: "percent",
        maximumFractionDigits: a
      })).format(i);
    },
    formatDate(i) {
      const a = R(i);
      if (!a)
        return k;
      const c = w(o.locale);
      return A(`date:${c}`, () => new Intl.DateTimeFormat(c, {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })).format(a);
    },
    formatDateTime(i) {
      const a = R(i);
      if (!a)
        return k;
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
      const a = R(i);
      if (!a)
        return k;
      const c = w(o.locale);
      return A(`time:${c}`, () => new Intl.DateTimeFormat(c, {
        hour: "2-digit",
        minute: "2-digit"
      })).format(a);
    },
    formatRelative(i) {
      const a = R(i);
      if (!a)
        return k;
      const c = w(o.locale), p = A(`relative:${c}`, () => new Intl.RelativeTimeFormat(c, {
        numeric: "auto"
      })), l = a.getTime() - Date.now();
      for (const u of Oe)
        if (Math.abs(l) >= u.ms)
          return p.format(Math.round(l / u.ms), u.unit);
      return p.format(0, "second");
    },
    formatBytes(i, a = 1) {
      if (i == null || !Number.isFinite(i))
        return k;
      let c = Math.abs(i), p = 0;
      for (; c >= 1024 && p < B.length - 1; )
        c = c / 1024, p = p + 1;
      const l = i < 0 ? "-" : "", u = p === 0 ? 0 : a;
      return `${l}${o.formatNumber(c, u)} ${B[p]}`;
    },
    withLocale(i) {
      return H(() => i, { fallbackLocale: t, currency: r, registry: s });
    },
    register(i, a) {
      if (!i)
        throw new Error("[format] register() needs a namespace — use the module id.");
      const c = s.groups.get(i) ?? {};
      for (const [p, l] of Object.entries(a)) {
        if (Ne.has(p))
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
  return new Proxy(o, {
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
function Be(n, e = {}) {
  return H(() => n.locale, e);
}
function je(n) {
  return globalThis[K] = n, n;
}
function Je() {
  return globalThis[K];
}
const Fe = {}, j = "Root", xe = Fe ?? {}, ze = (n) => n || xe.VITE_MASTER_API_URL || (window.location.hostname === "localhost" ? "http://localhost:4400" : ""), qe = () => {
  const n = window.location.protocol === "https:" ? "wss:" : "ws:", e = window.location.host.replace(":4401", ":4400");
  return `${n}//${e}/socket`;
}, F = (n, e) => async () => {
  const t = n.getComponent(e);
  if (!t) throw new Error(`[sapp] Route component not registered: ${e}`);
  return typeof t == "function" ? t() : t;
};
async function Qe(n) {
  je({ Vue: Q, Pinia: le, VueRouter: pe, VueUse: me });
  const e = ce(n.root), t = ue();
  e.use(t);
  const r = n.discovery ?? be;
  await r.initialize();
  const s = n.api?.baseUrl ?? ze(r.get("master_api_url"));
  console.log("💉 [sapp] apiBase:", s);
  const o = new we();
  o.$app = e, window.$superApp = o;
  const i = n.theme.register(e, o), a = i.uiStore, c = Le(n.i18n), p = Be(c, { currency: n.currency });
  o.registerProtocol("i18n", c), c.onLocaleChange((f, y) => o.emit("i18n:locale-changed", { locale: f, previous: y }));
  const l = new Ae(s), u = new ve(n.socket?.url ?? qe());
  u.connect(), o.registerProtocol("api", l), o.registerProtocol("socket", u), l.bind(o);
  const d = n.auth?.tokenKey ?? "accessToken";
  o.createApi = Te({
    tokenKey: d,
    message: i.messageService,
    appState: () => o.$appState
  });
  const v = n.auth?.loginPath ?? "/login", Y = n.layout ?? z({ name: "SappLayout", setup: () => () => x(de) }), J = [
    { path: v, name: "Login", component: F(o, n.auth?.loginComponentId ?? "auth.login"), meta: { public: !0 } },
    {
      path: "/",
      name: j,
      component: Y,
      children: [
        { path: "app/:moduleId(.*)*", name: "AppGateway", component: F(o, "layout.app-container") }
      ]
    },
    ...n.routes ?? []
  ], $ = ge({ history: fe(n.router?.base), routes: J });
  $.beforeEach((f, y, g) => {
    const S = localStorage.getItem(d);
    if (!f.meta.public && !S) return g(v);
    g();
  });
  const P = { app: e, router: $, pinia: t, superApp: o, discovery: r, api: l, socket: u };
  if (await n.modules?.(P), o.state.discovery = r.getAll(), o.init({
    app: e,
    router: $,
    config: { moduleManifest: { ...n.manifest ?? {}, ...r.getAll() }, branding: n.branding },
    theme: n.tokens,
    message: i.messageService,
    dialog: i.dialogService
  }), await o.loadServerApps(), n.branding) {
    const { name: f, icon: y, logo: g } = n.branding;
    f && (document.title = f);
    const S = y || g;
    if (S) {
      const T = document.querySelector('link[rel~="icon"]') ?? Object.assign(document.createElement("link"), { rel: "icon" });
      T.href = S, T.parentNode || document.head.appendChild(T);
    }
  }
  await o.loadPlatformConfig();
  const C = i.appState ?? Re(), L = r.get("system.workspaces");
  L && (C.workspaces = L), o.$appState = C, e.config.globalProperties.$appState = C, e.config.globalProperties.$auth = o.$authState, e.provide("$auth", o.$authState);
  for (const f of n.features ?? []) {
    const y = {
      ...P,
      featureId: f.id,
      registerRoute: (g) => $.addRoute(j, g),
      registerTopRoute: (g) => $.addRoute(g),
      registerComponent: (g) => o.registerComponent(g),
      registerSkill: (g) => o.registerSkill(g),
      registerCommand: (g) => o.registerCommand(g),
      registerMessages: (g, S) => c.addMessages(g, S),
      provide: (g, S) => e.provide(g, S)
    };
    await f.install(y), console.log(`🧩 [sapp] Shell feature installed: ${f.id}`);
  }
  const h = e.config.globalProperties;
  return h.$c = (f) => o.getComponent(f), h.$s = o, h.$superApp = o, h.$message = i.messageService, h.$dialog = i.dialogService, h.$i18n = c, h.$t = (f, y) => c.t(f, y), h.$f = p, o.$f = p, e.provide("$i18n", c), e.provide("$f", p), e.provide("ui-store", a), e.provide("$theme", n.tokens), e.provide("$superApp", o), e.provide("$s", o), e.provide("$message", i.messageService), e.provide("$dialog", i.dialogService), {
    ...P,
    mount(f = "#app") {
      return e.use($), e.mount(f), e;
    }
  };
}
export {
  Ae as A,
  Me as B,
  Ee as D,
  ve as S,
  we as a,
  Te as b,
  Qe as c,
  Re as d,
  Se as e,
  H as f,
  Be as g,
  Le as h,
  be as i,
  Je as j,
  je as k
};
//# sourceMappingURL=createSapp-ClTVtNXQ.js.map
