import * as Q from "vue";
import { reactive as h, inject as X, provide as Z, h as x, defineComponent as z, onUnmounted as ee, onMounted as te, triggerRef as se, shallowRef as re, defineAsyncComponent as M, markRaw as E, nextTick as oe, watchEffect as ne, watch as q, computed as ie, ref as ae, createApp as ce } from "vue";
import * as le from "pinia";
import { createPinia as ue } from "pinia";
import * as de from "vue-router";
import { RouterView as pe, createRouter as ge, createWebHistory as fe } from "vue-router";
import * as he from "@vueuse/core";
import { useLocalStorage as V } from "@vueuse/core";
import { S as _, R as b, A as me, a as U, f as G, b as ye, c as O, E as k, M as W } from "./format-BUIIBrkU.js";
import D from "axios";
function Se() {
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
        Object.entries(r.clientRoles ?? {}).map(([i, c]) => [i, [...c]])
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
      const { roles: o, realmRoles: i, clientRoles: c, ...a } = r;
      n.user = { ...n.user, ...a };
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
  $authState = Se();
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
    s && (s.isEnabled = t, console.log(`🛡️ [sys-kernel] Module status changed: $${e} -> ${t ? "ENABLED" : "DISABLED"}`), this.emit(_.SYSTEM_GOVERNANCE, { id: e, isEnabled: t }));
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
    ref: ae,
    reactive: h,
    computed: ie,
    watch: q,
    watchEffect: ne,
    nextTick: oe,
    markRaw: E,
    defineAsyncComponent: M,
    shallowRef: re,
    triggerRef: se,
    onMounted: te,
    onUnmounted: ee,
    defineComponent: z,
    h: x,
    provide: Z,
    inject: X,
    useLocalStorage: V
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
  loadServerApps = async () => {
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
    return this.syncManifestWithRegisteredApps(), this.emit(_.APPS_UPDATED, this.getRegisteredApps()), this.state.serverApps;
  };
  /** Built-in remote URLs per environment: the Shell config's `<id>.url`, else the build's env. */
  builtInUrl = (e) => {
    const t = ke ?? {}, s = {
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
  /** The Shell's own config (discovery) before the platform environment was merged over it. */
  localDiscovery = null;
  /** Branding given to createSapp, kept so an emptied platform field falls back to it. */
  shellBranding = null;
  loadPlatformConfig = async () => {
    let e;
    try {
      const a = new AbortController(), u = setTimeout(() => a.abort(), 4e3), l = await fetch(`${this.getPackageFilesBaseUrl()}/config.json`, { cache: "no-cache", signal: a.signal });
      if (clearTimeout(u), !l.ok) throw new Error(`HTTP ${l.status}`);
      e = await l.json();
    } catch (a) {
      return console.warn(`⚙️ [sys-kernel] Platform config unavailable (${a?.message ?? a}) — Shell defaults kept.`), null;
    }
    this.state.platformConfig = e, this.localDiscovery ??= { ...this.state.discovery };
    const t = Object.fromEntries(Object.entries(e.environment ?? {}).filter(([a, u]) => typeof u == "string" && a !== "packages.url"));
    if (this.state.discovery = { ...this.localDiscovery, ...t }, this.$config) {
      const a = this.$config.moduleManifest ??= {};
      for (const [u, l] of Object.entries(t))
        u.endsWith(".url") && l && (a[u.slice(0, -4)] = this.formatAppEntryUrl(l));
    }
    this.syncManifestWithRegisteredApps();
    const s = e.general ?? {}, r = s.logo ? this.resolvePackageFileUrl(s.logo) : "", o = s.favicon ? this.resolvePackageFileUrl(s.favicon) : "";
    if (this.$config) {
      this.shellBranding ??= { ...this.$config.branding ?? { name: "" } };
      const a = this.shellBranding;
      this.$config.branding = {
        ...a,
        name: s.title || a.name,
        tagline: s.description || a.tagline,
        logo: r || a.logo,
        // A platform logo has no dark variant of its own — the light plate is used instead.
        logoDark: r ? void 0 : a.logoDark,
        icon: o || a.icon
      };
    }
    const i = this.$config?.branding;
    i?.name && (document.title = i.name);
    const c = i?.icon || i?.logo;
    if (c) {
      const a = document.querySelector('link[rel~="icon"]') ?? Object.assign(document.createElement("link"), { rel: "icon" });
      a.href = c, a.parentNode || document.head.appendChild(a);
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
      e = JSON.parse(localStorage.getItem(b) || "[]");
    } catch {
    }
    const t = this.getConfiguredApps().filter((o) => o.type !== "package").map((o) => ({ ...o, url: "" })), s = [
      ...(Array.isArray(e) ? e : []).filter((o) => o?.id && o.type !== "package" && o.managedBy !== "server" && o.url && !["admin", "workspace"].includes(o.id)),
      ...t
    ].filter((o) => !this.state.serverApps.some((i) => i.id === o.id || i.code === o.id)).map((o) => ({ ...o, code: o.code ?? o.id }));
    if (!s.length) {
      try {
        localStorage.removeItem(b);
      } catch {
      }
      return { imported: [], skipped: [] };
    }
    const r = await this.doAction("apps.registry.import", { apps: s });
    try {
      localStorage.setItem(`${b}.imported`, JSON.stringify(e)), localStorage.removeItem(b);
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
        const i = this.getRegisteredApps().find((c) => c.id === e);
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
          const c = this.getRegisteredApps().find((a) => a.id === e) ?? null;
          await this.install(i, { moduleId: e, basePath: this.appPath(e), app: c }), this.markModuleInstalled(e), console.log(`✅ [sys-kernel] Remote [${e}] installed successfully.`);
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
class ve {
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
    const e = localStorage.getItem(me), t = this.superApp?.$appState?.current_workspace || localStorage.getItem(U), s = `req-${Date.now()}-${Math.floor(Math.random() * 1e4)}`, r = {
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
        throw this.superApp?.emit(_.SYSTEM_ERROR, o), new Error(o.message);
      }
      return s.json().catch(() => ({}));
    } catch (s) {
      throw s.message !== "System error" && this.superApp?.emit(_.SYSTEM_ERROR, { message: s.message, path: e }), s;
    }
  }
  /**
   * ⚡ Invoke a SuperApp Action via the Bridge
   */
  async doAction(e, t = {}) {
    console.log(`📡 [ApiProtocol] Invoking action: ${e}`, t);
    const s = await this.request(`${G.ENDPOINTS.SUPERAPP_CALL}/${e}`, {
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
class Ae {
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
      const c = { type: "ACTION", id: i, action: e, data: t };
      this.socket.send(JSON.stringify(c)), setTimeout(() => {
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
      let s = {};
      if (t && t.ok) {
        const c = t.headers.get("content-type");
        c && c.includes("application/json") ? (s = await t.json(), console.log("🏗️ [Discovery] Static runtime config loaded from /config.json")) : console.warn("🏗️ [Discovery] /config.json returned non-JSON content (likely index.html fallback)");
      }
      const r = s.master_api_url || $e?.VITE_MASTER_API_URL || "";
      r || console.warn("🛰️ [Discovery] No master_api_url found in config.json or environment. API discovery skipped.");
      const o = r ? await fetch(`${r}${G.ENDPOINTS.DISCOVERY}`).catch(() => null) : null;
      let i = {};
      if (o && o.ok) {
        const c = o.headers.get("content-type");
        if (c && c.includes("application/json"))
          try {
            i = await o.json(), console.log("🛰️ [Discovery] Dynamic API discovery config loaded.");
          } catch {
            console.warn("🛰️ [Discovery] API returned invalid JSON");
          }
      }
      this.config = { ...i, ...s }, this.initialized = !0, e && (e.state.discovery = { ...this.config }), console.log("🛰️ [Discovery] Total variables loaded:", Object.keys(this.config).length);
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
}, _e = 3e4, I = "x-request-id";
function Pe() {
  if (typeof crypto.randomUUID == "function")
    return crypto.randomUUID();
  const n = crypto.getRandomValues(new Uint8Array(16));
  n[6] = n[6] & 15 | 64, n[8] = n[8] & 63 | 128;
  const e = Array.from(n, (t) => t.toString(16).padStart(2, "0")).join("");
  return `${e.slice(0, 8)}-${e.slice(8, 12)}-${e.slice(12, 16)}-${e.slice(16, 20)}-${e.slice(20)}`;
}
function Te(n) {
  const e = n.response?.data, t = e && typeof e == "object" ? e.message || e.error_description || (typeof e.error == "string" ? e.error : void 0) : void 0;
  return {
    status: n.response?.status ?? null,
    message: t || n.message || "Request failed",
    code: e && typeof e == "object" && (e.code || (typeof e.error == "string" ? e.error : void 0)) || n.code,
    data: e,
    url: n.config?.url,
    method: n.config?.method?.toUpperCase(),
    requestId: n.config?.headers?.get?.(I)?.toString(),
    cause: n
  };
}
function Ce(n) {
  return function(t) {
    const { baseURL: s, headers: r, withToken: o = !0, workspace: i = !1, onError: c, setup: a, ...u } = t;
    if (!s)
      throw new Error("[createApi] `baseURL` is required — read it from env (e.g. import.meta.env.VITE_API_URL).");
    const l = D.create({
      timeout: _e,
      ...u,
      baseURL: s,
      headers: { Accept: "application/json", ...r }
    });
    return l.interceptors.request.use((d) => {
      if (d.headers.has(I) || d.headers.set(I, Pe()), o) {
        const p = localStorage.getItem(n.tokenKey);
        p && !d.headers.has("Authorization") && d.headers.set("Authorization", `Bearer ${p}`);
      }
      if (i) {
        const p = n.appState?.()?.current_workspace;
        p && d.headers.set("x-workspace-id", String(p));
      }
      return d;
    }), l.interceptors.response.use(
      (d) => d,
      (d) => {
        if (D.isCancel(d))
          return Promise.reject(d);
        const p = Te(d);
        return c ? c(p) : n.message?.error(p.message), Promise.reject(p);
      }
    ), a?.(l), l;
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
}, K = (n, e = "", t = {}) => {
  for (const [s, r] of Object.entries(n)) {
    const o = e ? `${e}.${s}` : s;
    r && typeof r == "object" ? K(r, o, t) : t[o] = String(r);
  }
  return t;
}, Ue = (n, e) => e ? n.replace(/\{(\w+)\}/g, (t, s) => e[s] === void 0 || e[s] === null ? t : String(e[s])) : n, Ie = (n, e) => {
  if (e?.count === void 0 || e.count === null || !n.includes("|")) return n;
  const t = Number(e.count);
  if (!Number.isFinite(t)) return n;
  const s = n.split("|").map((r) => r.trim());
  return s.length === 2 ? t === 1 ? s[0] : s[1] : s.length >= 3 ? t === 0 ? s[0] : t === 1 ? s[1] : s[2] : s[0];
};
function Le(n = {}) {
  const e = n.fallbackLocale ?? "en", t = n.persist ?? !0, s = t ? (() => {
    try {
      return localStorage.getItem(O);
    } catch {
      return null;
    }
  })() : null, r = h({ locale: s || n.locale || e, messages: {} }), o = /* @__PURE__ */ new Set(), i = (l, d, p) => {
    const A = K(d, p || "");
    r.messages[l] = { ...r.messages[l] ?? {}, ...A };
  }, c = (l, d) => {
    for (const [p, A] of Object.entries(l)) i(p, A, d);
  };
  c(Me), n.messages && c(n.messages);
  const a = (l, d) => r.messages[d]?.[l], u = {
    get locale() {
      return r.locale;
    },
    set locale(l) {
      u.setLocale(l);
    },
    fallbackLocale: e,
    get availableLocales() {
      return Object.keys(r.messages);
    },
    t(l, d) {
      const p = a(l, r.locale) ?? a(l, e) ?? d?.default ?? l;
      return Ue(Ie(p, d), d);
    },
    te(l, d) {
      return a(l, d ?? r.locale) !== void 0 || !d && a(l, e) !== void 0;
    },
    setLocale(l) {
      if (!l || l === r.locale) return;
      const d = r.locale;
      if (r.locale = l, t)
        try {
          localStorage.setItem(O, l);
        } catch {
        }
      document.documentElement.setAttribute("lang", l), o.forEach((p) => p(l, d));
    },
    addMessages: c,
    addLocaleMessages: i,
    getMessages(l = r.locale, d = !0) {
      return d ? { ...r.messages[e] ?? {}, ...r.messages[l] ?? {} } : { ...r.messages[l] ?? {} };
    },
    onLocaleChange(l) {
      return o.add(l), () => o.delete(l);
    }
  };
  return typeof document < "u" && document.documentElement.setAttribute("lang", r.locale), q(() => r.locale, () => {
  }), u;
}
function w(n) {
  return n === "vi" ? "vi-VN" : n === "en" ? "en-US" : n;
}
const N = /* @__PURE__ */ new Map();
function v(n, e) {
  const t = N.get(n);
  if (t)
    return t;
  const s = e();
  return N.set(n, s), s;
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
], B = ["B", "KB", "MB", "GB", "TB", "PB"], De = /* @__PURE__ */ new Set([
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
function Ne() {
  return { groups: /* @__PURE__ */ new Map(), owners: /* @__PURE__ */ new Map() };
}
function H(n, e = {}) {
  const t = e.fallbackLocale ?? "vi";
  let s = e.currency ?? "VND";
  const r = e.registry ?? Ne(), o = {
    get locale() {
      return n() || t;
    },
    get currency() {
      return s;
    },
    set currency(i) {
      s = i;
    },
    formatMoney(i, c) {
      if (i == null || !Number.isFinite(i))
        return k;
      const a = c ?? s, u = w(o.locale);
      return v(`money:${u}:${a}`, () => new Intl.NumberFormat(u, {
        style: "currency",
        currency: a,
        maximumFractionDigits: 0
      })).format(i);
    },
    formatNumber(i, c = 0) {
      if (i == null || !Number.isFinite(i))
        return k;
      const a = w(o.locale);
      return v(`number:${a}:${c}`, () => new Intl.NumberFormat(a, {
        maximumFractionDigits: c
      })).format(i);
    },
    formatPercent(i, c = 1) {
      if (i == null || !Number.isFinite(i))
        return k;
      const a = w(o.locale);
      return v(`percent:${a}:${c}`, () => new Intl.NumberFormat(a, {
        style: "percent",
        maximumFractionDigits: c
      })).format(i);
    },
    formatDate(i) {
      const c = R(i);
      if (!c)
        return k;
      const a = w(o.locale);
      return v(`date:${a}`, () => new Intl.DateTimeFormat(a, {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })).format(c);
    },
    formatDateTime(i) {
      const c = R(i);
      if (!c)
        return k;
      const a = w(o.locale);
      return v(`datetime:${a}`, () => new Intl.DateTimeFormat(a, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })).format(c);
    },
    formatTime(i) {
      const c = R(i);
      if (!c)
        return k;
      const a = w(o.locale);
      return v(`time:${a}`, () => new Intl.DateTimeFormat(a, {
        hour: "2-digit",
        minute: "2-digit"
      })).format(c);
    },
    formatRelative(i) {
      const c = R(i);
      if (!c)
        return k;
      const a = w(o.locale), u = v(`relative:${a}`, () => new Intl.RelativeTimeFormat(a, {
        numeric: "auto"
      })), l = c.getTime() - Date.now();
      for (const d of Oe)
        if (Math.abs(l) >= d.ms)
          return u.format(Math.round(l / d.ms), d.unit);
      return u.format(0, "second");
    },
    formatBytes(i, c = 1) {
      if (i == null || !Number.isFinite(i))
        return k;
      let a = Math.abs(i), u = 0;
      for (; a >= 1024 && u < B.length - 1; )
        a = a / 1024, u = u + 1;
      const l = i < 0 ? "-" : "", d = u === 0 ? 0 : c;
      return `${l}${o.formatNumber(a, d)} ${B[u]}`;
    },
    withLocale(i) {
      return H(() => i, { fallbackLocale: t, currency: s, registry: r });
    },
    register(i, c) {
      if (!i)
        throw new Error("[format] register() needs a namespace — use the module id.");
      const a = r.groups.get(i) ?? {};
      for (const [u, l] of Object.entries(c)) {
        if (De.has(u))
          throw new Error(`[format] "${u}" is a built-in formatter and cannot be replaced.`);
        a[u] = l;
        const d = r.owners.get(u);
        if (!d) {
          r.owners.set(u, i);
          continue;
        }
        d !== i && console.warn(
          `⚠️ [format] "${u}" is already registered by [${d}], so $f.${u} stays theirs. [${i}] can reach its own as $f.of('${i}').${u}.`
        );
      }
      return r.groups.set(i, a), a;
    },
    of(i) {
      return r.groups.get(i) ?? {};
    },
    ownerOf(i) {
      return r.owners.get(i) ?? null;
    }
  };
  return new Proxy(o, {
    get(i, c, a) {
      if (typeof c != "string" || c in i)
        return Reflect.get(i, c, a);
      const u = r.owners.get(c);
      if (u)
        return r.groups.get(u)?.[c];
    },
    has(i, c) {
      return c in i ? !0 : typeof c == "string" && r.owners.has(c);
    },
    ownKeys(i) {
      return [.../* @__PURE__ */ new Set([...Reflect.ownKeys(i), ...r.owners.keys()])];
    },
    getOwnPropertyDescriptor(i, c) {
      const a = Reflect.getOwnPropertyDescriptor(i, c);
      if (a)
        return a;
      if (typeof c == "string" && r.owners.has(c))
        return { configurable: !0, enumerable: !0, value: void 0 };
    }
  });
}
function Be(n, e = {}) {
  return H(() => n.locale, e);
}
function je(n) {
  return globalThis[W] = n, n;
}
function Je() {
  return globalThis[W];
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
  je({ Vue: Q, Pinia: le, VueRouter: de, VueUse: he });
  const e = ce(n.root), t = ue();
  e.use(t);
  const s = n.discovery ?? be;
  await s.initialize();
  const r = n.api?.baseUrl ?? ze(s.get("master_api_url"));
  console.log("💉 [sapp] apiBase:", r);
  const o = new we();
  o.$app = e, window.$superApp = o;
  const i = n.theme.register(e, o), c = i.uiStore, a = Le(n.i18n), u = Be(a, { currency: n.currency });
  o.registerProtocol("i18n", a), a.onLocaleChange((f, y) => o.emit("i18n:locale-changed", { locale: f, previous: y }));
  const l = new ve(r), d = new Ae(n.socket?.url ?? qe());
  d.connect(), o.registerProtocol("api", l), o.registerProtocol("socket", d), l.bind(o);
  const p = n.auth?.tokenKey ?? "accessToken";
  o.createApi = Ce({
    tokenKey: p,
    message: i.messageService,
    appState: () => o.$appState
  });
  const A = n.auth?.loginPath ?? "/login", Y = n.layout ?? z({ name: "SappLayout", setup: () => () => x(pe) }), J = [
    { path: A, name: "Login", component: F(o, n.auth?.loginComponentId ?? "auth.login"), meta: { public: !0 } },
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
    const S = localStorage.getItem(p);
    if (!f.meta.public && !S) return g(A);
    g();
  });
  const P = { app: e, router: $, pinia: t, superApp: o, discovery: s, api: l, socket: d };
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
      const C = document.querySelector('link[rel~="icon"]') ?? Object.assign(document.createElement("link"), { rel: "icon" });
      C.href = S, C.parentNode || document.head.appendChild(C);
    }
  }
  await o.loadPlatformConfig(), await o.loadServerApps();
  const T = i.appState ?? Re(), L = s.get("system.workspaces");
  L && (T.workspaces = L), o.$appState = T, e.config.globalProperties.$appState = T, e.config.globalProperties.$auth = o.$authState, e.provide("$auth", o.$authState);
  for (const f of n.features ?? []) {
    const y = {
      ...P,
      featureId: f.id,
      registerRoute: (g) => $.addRoute(j, g),
      registerTopRoute: (g) => $.addRoute(g),
      registerComponent: (g) => o.registerComponent(g),
      registerSkill: (g) => o.registerSkill(g),
      registerCommand: (g) => o.registerCommand(g),
      registerMessages: (g, S) => a.addMessages(g, S),
      provide: (g, S) => e.provide(g, S)
    };
    await f.install(y), console.log(`🧩 [sapp] Shell feature installed: ${f.id}`);
  }
  const m = e.config.globalProperties;
  return m.$c = (f) => o.getComponent(f), m.$s = o, m.$superApp = o, m.$message = i.messageService, m.$dialog = i.dialogService, m.$i18n = a, m.$t = (f, y) => a.t(f, y), m.$f = u, o.$f = u, e.provide("$i18n", a), e.provide("$f", u), e.provide("ui-store", c), e.provide("$theme", n.tokens), e.provide("$superApp", o), e.provide("$s", o), e.provide("$message", i.messageService), e.provide("$dialog", i.dialogService), {
    ...P,
    mount(f = "#app") {
      return e.use($), e.mount(f), e;
    }
  };
}
export {
  ve as A,
  Me as B,
  Ee as D,
  Ae as S,
  we as a,
  Ce as b,
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
//# sourceMappingURL=createSapp-DkbMp8Bt.js.map
