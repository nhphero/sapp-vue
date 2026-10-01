import * as Z from "vue";
import { reactive as h, inject as ee, provide as te, h as q, defineComponent as z, onUnmounted as re, onMounted as se, triggerRef as ne, shallowRef as oe, defineAsyncComponent as M, markRaw as b, nextTick as ie, watchEffect as ae, watch as G, computed as ce, ref as le, createApp as ue } from "vue";
import * as de from "pinia";
import { createPinia as ge } from "pinia";
import * as fe from "vue-router";
import { RouterView as pe, createRouter as he, createWebHistory as me } from "vue-router";
import * as ye from "@vueuse/core";
import { useLocalStorage as H } from "@vueuse/core";
import { S as $, R as P, H as O, A as Se, a as U, f as V, b as we, c as L, E as w, M as K } from "./format-BUIIBrkU.js";
import N from "axios";
function ke() {
  const i = h({
    user: null,
    realmRoles: [],
    clientRoles: {},
    provider: null
  });
  function e() {
    return [.../* @__PURE__ */ new Set([...i.realmRoles, ...Object.values(i.clientRoles).flat()])];
  }
  const t = (s) => s.toLowerCase(), r = () => new Set(e().map(t));
  return h({
    get user() {
      return i.user;
    },
    get roles() {
      return e();
    },
    get realmRoles() {
      return i.realmRoles;
    },
    get clientRoles() {
      return i.clientRoles;
    },
    get provider() {
      return i.provider;
    },
    get isAuthenticated() {
      return i.user !== null;
    },
    hasRole(s, o) {
      return o !== void 0 ? (i.clientRoles[o] ?? []).some((n) => t(n) === t(s)) : r().has(t(s));
    },
    hasAnyRole(...s) {
      const o = r();
      return s.some((n) => o.has(t(n)));
    },
    set(s) {
      const o = s.user.role ? [s.user.role] : [];
      i.realmRoles = [...s.realmRoles ?? o], i.clientRoles = Object.fromEntries(
        Object.entries(s.clientRoles ?? {}).map(([n, a]) => [n, [...a]])
      ), i.provider = s.provider, i.user = {
        ...s.user,
        roles: e(),
        realmRoles: i.realmRoles,
        clientRoles: i.clientRoles
      };
    },
    patchUser(s) {
      if (!i.user)
        return;
      const { roles: o, realmRoles: n, clientRoles: a, ...c } = s;
      i.user = { ...i.user, ...c };
    },
    clear() {
      i.user = null, i.realmRoles = [], i.clientRoles = {}, i.provider = null;
    }
  });
}
const B = {};
class Ae {
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
  $authState = ke();
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
    r && (r.isEnabled = t, console.log(`🛡️ [sys-kernel] Module status changed: $${e} -> ${t ? "ENABLED" : "DISABLED"}`), this.emit($.SYSTEM_GOVERNANCE, { id: e, isEnabled: t }));
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
    ref: le,
    reactive: h,
    computed: ce,
    watch: G,
    watchEffect: ae,
    nextTick: ie,
    markRaw: b,
    defineAsyncComponent: M,
    shallowRef: oe,
    triggerRef: ne,
    onMounted: se,
    onUnmounted: re,
    defineComponent: z,
    h: q,
    provide: te,
    inject: ee,
    useLocalStorage: H
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
  /** True once `/packages/apps.json` answered — only then may stale server apps be dropped. */
  serverAppsLoaded = !1;
  loadServerApps = async () => {
    const e = this.getApiBaseUrl();
    try {
      const t = new AbortController(), r = setTimeout(() => t.abort(), 4e3), s = await fetch(`${this.getPackageFilesBaseUrl()}/apps.json`, { cache: "no-cache", signal: t.signal });
      if (clearTimeout(r), !s.ok) throw new Error(`HTTP ${s.status}`);
      const o = await s.json();
      this.state.serverApps = o.map((n) => ({
        id: n.appId,
        name: n.title || n.appId,
        type: "package",
        package: n.package,
        version: n.version,
        channel: n.channel ?? null,
        url: e,
        entryUrl: this.packageFilesEntryUrl(n.package, n.version),
        description: n.description || "",
        icon: n.icon || "Package",
        isSystem: !0,
        isEnabled: !0,
        managedBy: "server",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      })), this.serverAppsLoaded = !0;
    } catch (t) {
      return console.warn(`📦 [sys-kernel] Server apps unavailable (${t?.message ?? t}) — registry unchanged.`), this.state.serverApps;
    }
    return this.syncManifestWithRegisteredApps(), this.emit($.APPS_UPDATED, this.getRegisteredApps()), this.state.serverApps;
  };
  /** Branding given to createSapp, kept so an emptied platform field falls back to it. */
  shellBranding = null;
  loadPlatformConfig = async () => {
    let e;
    try {
      const a = new AbortController(), c = setTimeout(() => a.abort(), 4e3), l = await fetch(`${this.getPackageFilesBaseUrl()}/config.json`, { cache: "no-cache", signal: a.signal });
      if (clearTimeout(c), !l.ok) throw new Error(`HTTP ${l.status}`);
      e = await l.json();
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
    const n = o?.icon || o?.logo;
    if (n) {
      const a = document.querySelector('link[rel~="icon"]') ?? Object.assign(document.createElement("link"), { rel: "icon" });
      a.href = n, a.parentNode || document.head.appendChild(a);
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
  getDefaultApps = () => {
    const e = (this.state.discovery?.["admin.url"] || B?.VITE_ADMIN_URL || "http://localhost:4403").replace(/\/+$/, ""), t = (this.state.discovery?.["workspace.url"] || B?.VITE_WORKSPACE_URL || "http://localhost:4409").replace(/\/+$/, ""), r = [
      ...this.state.serverApps,
      ...this.getConfiguredApps(),
      {
        id: "workspace",
        name: "Workspace Hub",
        url: t,
        entryUrl: t.endsWith(".js") || t.endsWith(".ts") ? t : `${t}/index.js`,
        description: "Logic Orchestration & Flow Designer",
        icon: "Globe",
        isSystem: !0,
        isEnabled: !0,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "admin",
        name: "Admin Management",
        url: e,
        entryUrl: e.endsWith(".js") || e.endsWith(".ts") ? e : `${e}/index.js`,
        description: "Platform Governance & Applications Registry",
        icon: "Shield",
        isSystem: !0,
        isEnabled: !0,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ], s = /* @__PURE__ */ new Set();
    return r.filter((o) => !s.has(o.id) && s.add(o.id));
  };
  /**
   * Apps declared by the Shell's config (`config.json` / discovery) under `registry.apps`:
   * `[{ id, name, description?, icon?, type?, package? }]`. A `remote` app (default) is mounted from its
   * `<id>.url` entry; a `package` app needs no URL — the backend serves its deployed version. They join
   * the defaults, so a new mini app is listed by configuration — no code change, no per-browser setup.
   */
  getConfiguredApps = () => {
    const e = this.state.discovery?.["registry.apps"];
    return Array.isArray(e) ? e.filter((t) => t?.id && (t.type === "package" || typeof this.state.discovery?.[`${t.id}.url`] == "string")).map((t) => {
      if (t.type === "package")
        return {
          id: String(t.id),
          name: t.name || String(t.id),
          type: "package",
          package: t.package,
          url: this.getApiBaseUrl(),
          entryUrl: this.packageEntryUrl(String(t.id)),
          description: t.description || "",
          icon: t.icon || "Layers",
          isSystem: !0,
          isEnabled: t.isEnabled ?? !0,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      const r = String(this.state.discovery[`${t.id}.url`]).replace(/\/+$/, "");
      return {
        id: String(t.id),
        name: t.name || String(t.id),
        type: "remote",
        url: r,
        entryUrl: r.endsWith(".js") || r.endsWith(".ts") ? r : `${r}/index.js`,
        description: t.description || "",
        icon: t.icon || "Layers",
        isSystem: !0,
        isEnabled: t.isEnabled ?? !0,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }) : [];
  };
  getRegisteredApps = () => {
    try {
      const e = localStorage.getItem(P), t = this.getDefaultApps();
      if (!e)
        return localStorage.setItem(P, JSON.stringify(t)), t;
      const r = JSON.parse(e);
      if (!Array.isArray(r)) return t;
      const s = this.getHiddenDefaults();
      t.forEach((n) => {
        const a = r.find((c) => c.id === n.id);
        a ? (a.isSystem = !0, a.entryUrl || (a.entryUrl = this.formatAppEntryUrl(a.url))) : s.has(n.id) || r.unshift(n);
      });
      const o = new Map(this.state.serverApps.map((n) => [n.id, n]));
      for (let n = r.length - 1; n >= 0; n--) {
        const a = r[n], c = o.get(a.id);
        if (c) {
          const { isEnabled: l } = a;
          r[n] = { ...a, ...c, isEnabled: l ?? !0 };
        } else a.managedBy === "server" && this.serverAppsLoaded && r.splice(n, 1);
      }
      return r.forEach((n) => {
        n.type === "package" && (n.url = this.getApiBaseUrl(), n.entryUrl = this.resolveAppEntry(n));
      }), r;
    } catch (e) {
      return console.error("Failed to read registered apps from storage:", e), this.getDefaultApps();
    }
  };
  syncManifestWithRegisteredApps = () => {
    const e = this.$config;
    if (!e) return;
    const t = e.moduleManifest ??= {};
    for (const [s, o] of Object.entries(this.state.discovery || {})) {
      if (!s.endsWith(".url") || typeof o != "string" || !o) continue;
      const n = s.slice(0, -4);
      n && !t[n] && (t[n] = this.formatAppEntryUrl(o));
    }
    this.getRegisteredApps().forEach((s) => {
      if (s.id && (s.url || s.type === "package") && s.isEnabled !== !1) {
        const o = s.type === "package" ? this.resolveAppEntry(s) : s.entryUrl || this.formatAppEntryUrl(s.url);
        t[s.id] = o, s.id === "workspace" && (t.expose = o);
      }
    });
  };
  registerApp = (e) => {
    const t = this.normalizeAppId(e.id);
    if (!t) throw new Error("Application ID is required");
    const r = e.type === "package" ? "package" : "remote";
    if (r === "remote" && !e.url) throw new Error("Application Remote URL is required");
    const s = this.getRegisteredApps(), o = r === "package" ? this.getApiBaseUrl() : e.url.trim().replace(/\/+$/, ""), n = this.resolveAppEntry({ id: t, url: o, type: r }), a = s.findIndex((l) => l.id === t), c = {
      id: t,
      name: e.name || t,
      type: r,
      ...r === "package" && e.package ? { package: e.package } : {},
      url: o,
      entryUrl: n,
      description: e.description || "",
      icon: e.icon || "Layers",
      isEnabled: e.isEnabled ?? !0,
      isSystem: a >= 0 ? !!s[a].isSystem : !1,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return a >= 0 ? s[a] = { ...s[a], ...c } : s.push(c), localStorage.setItem(P, JSON.stringify(s)), this.syncManifestWithRegisteredApps(), this.emit($.APPS_UPDATED, s), c;
  };
  getHiddenDefaults = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem(O) || "[]"));
    } catch {
      return /* @__PURE__ */ new Set();
    }
  };
  normalizeAppId = (e) => (e || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/^-+|-+$/g, "");
  updateApp = (e, t) => {
    const r = this.getRegisteredApps(), s = r.findIndex((l) => l.id === e);
    if (s === -1) throw new Error(`App [${e}] not found`);
    const o = r[s], n = { ...t };
    n.url && (n.url = n.url.trim().replace(/\/+$/, ""));
    const a = n.id !== void 0 ? this.normalizeAppId(n.id) : e;
    if (n.id !== void 0 && !a) throw new Error("Application ID is required");
    if (a !== e) {
      if (r.some((l) => l.id === a)) throw new Error(`App [${a}] already exists`);
      if (this.$config?.moduleManifest && delete this.$config.moduleManifest[e], o.isSystem) {
        const l = this.getHiddenDefaults();
        l.add(e), localStorage.setItem(O, JSON.stringify([...l]));
      }
      this.state.installedModules.delete(e), console.log(`🔁 [sys-kernel] App renamed: ${e} -> ${a}`);
    }
    n.id = a;
    const c = { ...o, ...n, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    if (c.type === "package")
      c.url = this.getApiBaseUrl();
    else if (delete c.package, !c.url) throw new Error("Application Remote URL is required");
    return c.entryUrl = this.resolveAppEntry(c), r[s] = c, localStorage.setItem(P, JSON.stringify(r)), this.syncManifestWithRegisteredApps(), this.emit($.APPS_UPDATED, r), r[s];
  };
  deleteApp = (e) => {
    const t = this.getRegisteredApps(), r = t.find((o) => o.id === e);
    if (!r) return !1;
    if (r.isSystem)
      throw new Error(`System application [${e}] cannot be removed.`);
    const s = t.filter((o) => o.id !== e);
    return localStorage.setItem(P, JSON.stringify(s)), this.$config?.moduleManifest && delete this.$config.moduleManifest[e], this.emit($.APPS_UPDATED, s), !0;
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
        const n = this.getRegisteredApps().find((a) => a.id === e);
        n && n.url && (s = n.entryUrl || this.formatAppEntryUrl(n.url), this.$config && (this.$config.moduleManifest || (this.$config.moduleManifest = {}), this.$config.moduleManifest[e] = s));
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
        ), n = o.default;
        if (this.cssScopes.set(e, String(o.__sappCssScope ?? n?.id ?? e)), n?.install) {
          console.log(`🛠️ [sys-kernel] Installing remote [${e}]...`);
          const a = this.getRegisteredApps().find((c) => c.id === e) ?? null;
          await this.install(n, { moduleId: e, basePath: `/app/${e}`, app: a }), this.markModuleInstalled(e), console.log(`✅ [sys-kernel] Remote [${e}] installed successfully.`);
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
    return typeof t == "function" ? b(M(t)) : t ? b(t) : null;
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
    return typeof t == "function" ? r = b(M(t)) : r = b(t), this.componentCache.set(e, r), r;
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
    const e = localStorage.getItem(Se), t = this.superApp?.$appState?.current_workspace || localStorage.getItem(U), r = `req-${Date.now()}-${Math.floor(Math.random() * 1e4)}`, s = {
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
        const s = await r.json().catch(() => ({ message: "System error" })), o = {
          message: s.error || s.message || `Request failed with status ${r.status}`,
          status: r.status,
          path: e
        };
        throw this.superApp?.emit($.SYSTEM_ERROR, o), new Error(o.message);
      }
      return r.json().catch(() => ({}));
    } catch (r) {
      throw r.message !== "System error" && this.superApp?.emit($.SYSTEM_ERROR, { message: r.message, path: e }), r;
    }
  }
  /**
   * ⚡ Invoke a SuperApp Action via the Bridge
   */
  async doAction(e, t = {}) {
    console.log(`📡 [ApiProtocol] Invoking action: ${e}`, t);
    const r = await this.request(`${V.ENDPOINTS.SUPERAPP_CALL}/${e}`, {
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
        const t = JSON.parse(e.data), { type: r, data: s, id: o } = t;
        if (r === "ACTION_RESPONSE" && o && this.actionCallbacks.has(o)) {
          const { resolve: n } = this.actionCallbacks.get(o);
          this.actionCallbacks.delete(o), n(s);
          return;
        }
        if (r === "EVENT" && t.event) {
          this.handlers.has(t.event) && this.handlers.get(t.event)?.forEach((n) => n(t.data));
          return;
        }
        this.handlers.has(r) && this.handlers.get(r)?.forEach((n) => n(s));
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
      const n = Math.random().toString(36).substring(7);
      this.actionCallbacks.set(n, { resolve: s, reject: o });
      const a = { type: "ACTION", id: n, action: e, data: t };
      this.socket.send(JSON.stringify(a)), setTimeout(() => {
        this.actionCallbacks.has(n) && (this.actionCallbacks.delete(n), o(new Error(`📡 [SocketProtocol] Action "${e}" timed out.`)));
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
const ve = { BASE_URL: "/", DEV: !1, MODE: "production", PROD: !0, SSR: !1 };
class be {
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
      const s = r.master_api_url || ve?.VITE_MASTER_API_URL || "";
      s || console.warn("🛰️ [Discovery] No master_api_url found in config.json or environment. API discovery skipped.");
      const o = s ? await fetch(`${s}${V.ENDPOINTS.DISCOVERY}`).catch(() => null) : null;
      let n = {};
      if (o && o.ok) {
        const a = o.headers.get("content-type");
        if (a && a.includes("application/json"))
          try {
            n = await o.json(), console.log("🛰️ [Discovery] Dynamic API discovery config loaded.");
          } catch {
            console.warn("🛰️ [Discovery] API returned invalid JSON");
          }
      }
      this.config = { ...n, ...r }, this.initialized = !0, e && (e.state.discovery = { ...this.config }), console.log("🛰️ [Discovery] Total variables loaded:", Object.keys(this.config).length);
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
const Pe = new be(), Re = () => {
  const i = H(we, {
    current_app: "workspace",
    current_workspace: null
  });
  return (typeof i.value != "object" || i.value === null) && (console.warn("⚠️ [AppState] Invalid storage detected, resetting to defaults."), i.value = {
    current_app: "workspace",
    current_workspace: null
  }), h({
    get current_app() {
      return i.value.current_app;
    },
    set current_app(e) {
      i.value.current_app = e;
    },
    get current_workspace() {
      return i.value.current_workspace;
    },
    set current_workspace(e) {
      typeof i.value != "object" ? i.value = { current_app: "workspace", current_workspace: e } : i.value.current_workspace = e;
    },
    // 🏢 Global Workspace Cache (Populated from Discovery)
    workspaces: []
  });
}, _e = 3e4, I = "x-request-id";
function Te() {
  if (typeof crypto.randomUUID == "function")
    return crypto.randomUUID();
  const i = crypto.getRandomValues(new Uint8Array(16));
  i[6] = i[6] & 15 | 64, i[8] = i[8] & 63 | 128;
  const e = Array.from(i, (t) => t.toString(16).padStart(2, "0")).join("");
  return `${e.slice(0, 8)}-${e.slice(8, 12)}-${e.slice(12, 16)}-${e.slice(16, 20)}-${e.slice(20)}`;
}
function Ce(i) {
  const e = i.response?.data, t = e && typeof e == "object" ? e.message || e.error_description || (typeof e.error == "string" ? e.error : void 0) : void 0;
  return {
    status: i.response?.status ?? null,
    message: t || i.message || "Request failed",
    code: e && typeof e == "object" && (e.code || (typeof e.error == "string" ? e.error : void 0)) || i.code,
    data: e,
    url: i.config?.url,
    method: i.config?.method?.toUpperCase(),
    requestId: i.config?.headers?.get?.(I)?.toString(),
    cause: i
  };
}
function Me(i) {
  return function(t) {
    const { baseURL: r, headers: s, withToken: o = !0, workspace: n = !1, onError: a, setup: c, ...l } = t;
    if (!r)
      throw new Error("[createApi] `baseURL` is required — read it from env (e.g. import.meta.env.VITE_API_URL).");
    const u = N.create({
      timeout: _e,
      ...l,
      baseURL: r,
      headers: { Accept: "application/json", ...s }
    });
    return u.interceptors.request.use((d) => {
      if (d.headers.has(I) || d.headers.set(I, Te()), o) {
        const g = localStorage.getItem(i.tokenKey);
        g && !d.headers.has("Authorization") && d.headers.set("Authorization", `Bearer ${g}`);
      }
      if (n) {
        const g = i.appState?.()?.current_workspace;
        g && d.headers.set("x-workspace-id", String(g));
      }
      return d;
    }), u.interceptors.response.use(
      (d) => d,
      (d) => {
        if (N.isCancel(d))
          return Promise.reject(d);
        const g = Ce(d);
        return a ? a(g) : i.message?.error(g.message), Promise.reject(g);
      }
    ), c?.(u), u;
  };
}
const Ue = {
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
}, Y = (i, e = "", t = {}) => {
  for (const [r, s] of Object.entries(i)) {
    const o = e ? `${e}.${r}` : r;
    s && typeof s == "object" ? Y(s, o, t) : t[o] = String(s);
  }
  return t;
}, Ie = (i, e) => e ? i.replace(/\{(\w+)\}/g, (t, r) => e[r] === void 0 || e[r] === null ? t : String(e[r])) : i, De = (i, e) => {
  if (e?.count === void 0 || e.count === null || !i.includes("|")) return i;
  const t = Number(e.count);
  if (!Number.isFinite(t)) return i;
  const r = i.split("|").map((s) => s.trim());
  return r.length === 2 ? t === 1 ? r[0] : r[1] : r.length >= 3 ? t === 0 ? r[0] : t === 1 ? r[1] : r[2] : r[0];
};
function Oe(i = {}) {
  const e = i.fallbackLocale ?? "en", t = i.persist ?? !0, r = t ? (() => {
    try {
      return localStorage.getItem(L);
    } catch {
      return null;
    }
  })() : null, s = h({ locale: r || i.locale || e, messages: {} }), o = /* @__PURE__ */ new Set(), n = (u, d, g) => {
    const E = Y(d, g || "");
    s.messages[u] = { ...s.messages[u] ?? {}, ...E };
  }, a = (u, d) => {
    for (const [g, E] of Object.entries(u)) n(g, E, d);
  };
  a(Ue), i.messages && a(i.messages);
  const c = (u, d) => s.messages[d]?.[u], l = {
    get locale() {
      return s.locale;
    },
    set locale(u) {
      l.setLocale(u);
    },
    fallbackLocale: e,
    get availableLocales() {
      return Object.keys(s.messages);
    },
    t(u, d) {
      const g = c(u, s.locale) ?? c(u, e) ?? d?.default ?? u;
      return Ie(De(g, d), d);
    },
    te(u, d) {
      return c(u, d ?? s.locale) !== void 0 || !d && c(u, e) !== void 0;
    },
    setLocale(u) {
      if (!u || u === s.locale) return;
      const d = s.locale;
      if (s.locale = u, t)
        try {
          localStorage.setItem(L, u);
        } catch {
        }
      document.documentElement.setAttribute("lang", u), o.forEach((g) => g(u, d));
    },
    addMessages: a,
    addLocaleMessages: n,
    getMessages(u = s.locale, d = !0) {
      return d ? { ...s.messages[e] ?? {}, ...s.messages[u] ?? {} } : { ...s.messages[u] ?? {} };
    },
    onLocaleChange(u) {
      return o.add(u), () => o.delete(u);
    }
  };
  return typeof document < "u" && document.documentElement.setAttribute("lang", s.locale), G(() => s.locale, () => {
  }), l;
}
function k(i) {
  return i === "vi" ? "vi-VN" : i === "en" ? "en-US" : i;
}
const j = /* @__PURE__ */ new Map();
function A(i, e) {
  const t = j.get(i);
  if (t)
    return t;
  const r = e();
  return j.set(i, r), r;
}
function R(i) {
  if (i == null || i === "")
    return null;
  const e = i instanceof Date ? i : new Date(i);
  return Number.isNaN(e.getTime()) ? null : e;
}
const Le = [
  { unit: "year", ms: 365 * 864e5 },
  { unit: "month", ms: 30 * 864e5 },
  { unit: "day", ms: 864e5 },
  { unit: "hour", ms: 36e5 },
  { unit: "minute", ms: 6e4 },
  { unit: "second", ms: 1e3 }
], F = ["B", "KB", "MB", "GB", "TB", "PB"], Ne = /* @__PURE__ */ new Set([
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
function Be() {
  return { groups: /* @__PURE__ */ new Map(), owners: /* @__PURE__ */ new Map() };
}
function J(i, e = {}) {
  const t = e.fallbackLocale ?? "vi";
  let r = e.currency ?? "VND";
  const s = e.registry ?? Be(), o = {
    get locale() {
      return i() || t;
    },
    get currency() {
      return r;
    },
    set currency(n) {
      r = n;
    },
    formatMoney(n, a) {
      if (n == null || !Number.isFinite(n))
        return w;
      const c = a ?? r, l = k(o.locale);
      return A(`money:${l}:${c}`, () => new Intl.NumberFormat(l, {
        style: "currency",
        currency: c,
        maximumFractionDigits: 0
      })).format(n);
    },
    formatNumber(n, a = 0) {
      if (n == null || !Number.isFinite(n))
        return w;
      const c = k(o.locale);
      return A(`number:${c}:${a}`, () => new Intl.NumberFormat(c, {
        maximumFractionDigits: a
      })).format(n);
    },
    formatPercent(n, a = 1) {
      if (n == null || !Number.isFinite(n))
        return w;
      const c = k(o.locale);
      return A(`percent:${c}:${a}`, () => new Intl.NumberFormat(c, {
        style: "percent",
        maximumFractionDigits: a
      })).format(n);
    },
    formatDate(n) {
      const a = R(n);
      if (!a)
        return w;
      const c = k(o.locale);
      return A(`date:${c}`, () => new Intl.DateTimeFormat(c, {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })).format(a);
    },
    formatDateTime(n) {
      const a = R(n);
      if (!a)
        return w;
      const c = k(o.locale);
      return A(`datetime:${c}`, () => new Intl.DateTimeFormat(c, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })).format(a);
    },
    formatTime(n) {
      const a = R(n);
      if (!a)
        return w;
      const c = k(o.locale);
      return A(`time:${c}`, () => new Intl.DateTimeFormat(c, {
        hour: "2-digit",
        minute: "2-digit"
      })).format(a);
    },
    formatRelative(n) {
      const a = R(n);
      if (!a)
        return w;
      const c = k(o.locale), l = A(`relative:${c}`, () => new Intl.RelativeTimeFormat(c, {
        numeric: "auto"
      })), u = a.getTime() - Date.now();
      for (const d of Le)
        if (Math.abs(u) >= d.ms)
          return l.format(Math.round(u / d.ms), d.unit);
      return l.format(0, "second");
    },
    formatBytes(n, a = 1) {
      if (n == null || !Number.isFinite(n))
        return w;
      let c = Math.abs(n), l = 0;
      for (; c >= 1024 && l < F.length - 1; )
        c = c / 1024, l = l + 1;
      const u = n < 0 ? "-" : "", d = l === 0 ? 0 : a;
      return `${u}${o.formatNumber(c, d)} ${F[l]}`;
    },
    withLocale(n) {
      return J(() => n, { fallbackLocale: t, currency: r, registry: s });
    },
    register(n, a) {
      if (!n)
        throw new Error("[format] register() needs a namespace — use the module id.");
      const c = s.groups.get(n) ?? {};
      for (const [l, u] of Object.entries(a)) {
        if (Ne.has(l))
          throw new Error(`[format] "${l}" is a built-in formatter and cannot be replaced.`);
        c[l] = u;
        const d = s.owners.get(l);
        if (!d) {
          s.owners.set(l, n);
          continue;
        }
        d !== n && console.warn(
          `⚠️ [format] "${l}" is already registered by [${d}], so $f.${l} stays theirs. [${n}] can reach its own as $f.of('${n}').${l}.`
        );
      }
      return s.groups.set(n, c), c;
    },
    of(n) {
      return s.groups.get(n) ?? {};
    },
    ownerOf(n) {
      return s.owners.get(n) ?? null;
    }
  };
  return new Proxy(o, {
    get(n, a, c) {
      if (typeof a != "string" || a in n)
        return Reflect.get(n, a, c);
      const l = s.owners.get(a);
      if (l)
        return s.groups.get(l)?.[a];
    },
    has(n, a) {
      return a in n ? !0 : typeof a == "string" && s.owners.has(a);
    },
    ownKeys(n) {
      return [.../* @__PURE__ */ new Set([...Reflect.ownKeys(n), ...s.owners.keys()])];
    },
    getOwnPropertyDescriptor(n, a) {
      const c = Reflect.getOwnPropertyDescriptor(n, a);
      if (c)
        return c;
      if (typeof a == "string" && s.owners.has(a))
        return { configurable: !0, enumerable: !0, value: void 0 };
    }
  });
}
function je(i, e = {}) {
  return J(() => i.locale, e);
}
function Fe(i) {
  return globalThis[K] = i, i;
}
function Qe() {
  return globalThis[K];
}
const xe = {}, x = "Root", We = xe ?? {}, qe = (i) => i || We.VITE_MASTER_API_URL || (window.location.hostname === "localhost" ? "http://localhost:4400" : ""), ze = () => {
  const i = window.location.protocol === "https:" ? "wss:" : "ws:", e = window.location.host.replace(":4401", ":4400");
  return `${i}//${e}/socket`;
}, W = (i, e) => async () => {
  const t = i.getComponent(e);
  if (!t) throw new Error(`[sapp] Route component not registered: ${e}`);
  return typeof t == "function" ? t() : t;
};
async function Xe(i) {
  Fe({ Vue: Z, Pinia: de, VueRouter: fe, VueUse: ye });
  const e = ue(i.root), t = ge();
  e.use(t);
  const r = i.discovery ?? Pe;
  await r.initialize();
  const s = i.api?.baseUrl ?? qe(r.get("master_api_url"));
  console.log("💉 [sapp] apiBase:", s);
  const o = new Ae();
  o.$app = e, window.$superApp = o;
  const n = i.theme.register(e, o), a = n.uiStore, c = Oe(i.i18n), l = je(c, { currency: i.currency });
  o.registerProtocol("i18n", c), c.onLocaleChange((p, y) => o.emit("i18n:locale-changed", { locale: p, previous: y }));
  const u = new $e(s), d = new Ee(i.socket?.url ?? ze());
  d.connect(), o.registerProtocol("api", u), o.registerProtocol("socket", d), u.bind(o);
  const g = i.auth?.tokenKey ?? "accessToken";
  o.createApi = Me({
    tokenKey: g,
    message: n.messageService,
    appState: () => o.$appState
  });
  const E = i.auth?.loginPath ?? "/login", Q = i.layout ?? z({ name: "SappLayout", setup: () => () => q(pe) }), X = [
    { path: E, name: "Login", component: W(o, i.auth?.loginComponentId ?? "auth.login"), meta: { public: !0 } },
    {
      path: "/",
      name: x,
      component: Q,
      children: [
        { path: "app/:moduleId(.*)*", name: "AppGateway", component: W(o, "layout.app-container") }
      ]
    },
    ...i.routes ?? []
  ], v = he({ history: me(i.router?.base), routes: X });
  v.beforeEach((p, y, f) => {
    const S = localStorage.getItem(g);
    if (!p.meta.public && !S) return f(E);
    f();
  });
  const _ = { app: e, router: v, pinia: t, superApp: o, discovery: r, api: u, socket: d };
  if (await i.modules?.(_), o.state.discovery = r.getAll(), o.init({
    app: e,
    router: v,
    config: { moduleManifest: { ...i.manifest ?? {}, ...r.getAll() }, branding: i.branding },
    theme: i.tokens,
    message: n.messageService,
    dialog: n.dialogService
  }), await o.loadServerApps(), i.branding) {
    const { name: p, icon: y, logo: f } = i.branding;
    p && (document.title = p);
    const S = y || f;
    if (S) {
      const C = document.querySelector('link[rel~="icon"]') ?? Object.assign(document.createElement("link"), { rel: "icon" });
      C.href = S, C.parentNode || document.head.appendChild(C);
    }
  }
  await o.loadPlatformConfig();
  const T = n.appState ?? Re(), D = r.get("system.workspaces");
  D && (T.workspaces = D), o.$appState = T, e.config.globalProperties.$appState = T, e.config.globalProperties.$auth = o.$authState, e.provide("$auth", o.$authState);
  for (const p of i.features ?? []) {
    const y = {
      ..._,
      featureId: p.id,
      registerRoute: (f) => v.addRoute(x, f),
      registerTopRoute: (f) => v.addRoute(f),
      registerComponent: (f) => o.registerComponent(f),
      registerSkill: (f) => o.registerSkill(f),
      registerCommand: (f) => o.registerCommand(f),
      registerMessages: (f, S) => c.addMessages(f, S),
      provide: (f, S) => e.provide(f, S)
    };
    await p.install(y), console.log(`🧩 [sapp] Shell feature installed: ${p.id}`);
  }
  const m = e.config.globalProperties;
  return m.$c = (p) => o.getComponent(p), m.$s = o, m.$superApp = o, m.$message = n.messageService, m.$dialog = n.dialogService, m.$i18n = c, m.$t = (p, y) => c.t(p, y), m.$f = l, o.$f = l, e.provide("$i18n", c), e.provide("$f", l), e.provide("ui-store", a), e.provide("$theme", i.tokens), e.provide("$superApp", o), e.provide("$s", o), e.provide("$message", n.messageService), e.provide("$dialog", n.dialogService), {
    ..._,
    mount(p = "#app") {
      return e.use(v), e.mount(p), e;
    }
  };
}
export {
  $e as A,
  Ue as B,
  be as D,
  Ee as S,
  Ae as a,
  Me as b,
  Xe as c,
  Re as d,
  ke as e,
  J as f,
  je as g,
  Oe as h,
  Pe as i,
  Qe as j,
  Fe as k
};
//# sourceMappingURL=createSapp-D5c3vNdq.js.map
