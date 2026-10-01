import * as Z from "vue";
import { reactive as m, inject as ee, provide as te, h as q, defineComponent as V, onUnmounted as re, onMounted as se, triggerRef as ne, shallowRef as oe, defineAsyncComponent as I, markRaw as b, nextTick as ie, watchEffect as ae, watch as G, computed as ce, ref as le, createApp as ue } from "vue";
import * as de from "pinia";
import { createPinia as ge } from "pinia";
import * as fe from "vue-router";
import { RouterView as pe, createRouter as me, createWebHistory as he } from "vue-router";
import * as ye from "@vueuse/core";
import { useLocalStorage as H } from "@vueuse/core";
import { S as E, R as _, H as D, A as Se, a as C, f as z, b as we, c as L, E as w, M as K } from "./format-BUIIBrkU.js";
import N from "axios";
function Ae() {
  const o = m({
    user: null,
    realmRoles: [],
    clientRoles: {},
    provider: null
  });
  function e() {
    return [.../* @__PURE__ */ new Set([...o.realmRoles, ...Object.values(o.clientRoles).flat()])];
  }
  const t = (n) => n.toLowerCase(), r = () => new Set(e().map(t));
  return m({
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
    hasRole(n, i) {
      return i !== void 0 ? (o.clientRoles[i] ?? []).some((s) => t(s) === t(n)) : r().has(t(n));
    },
    hasAnyRole(...n) {
      const i = r();
      return n.some((s) => i.has(t(s)));
    },
    set(n) {
      const i = n.user.role ? [n.user.role] : [];
      o.realmRoles = [...n.realmRoles ?? i], o.clientRoles = Object.fromEntries(
        Object.entries(n.clientRoles ?? {}).map(([s, a]) => [s, [...a]])
      ), o.provider = n.provider, o.user = {
        ...n.user,
        roles: e(),
        realmRoles: o.realmRoles,
        clientRoles: o.clientRoles
      };
    },
    patchUser(n) {
      if (!o.user)
        return;
      const { roles: i, realmRoles: s, clientRoles: a, ...c } = n;
      o.user = { ...o.user, ...c };
    },
    clear() {
      o.user = null, o.realmRoles = [], o.clientRoles = {}, o.provider = null;
    }
  });
}
const B = {};
class ke {
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
    serverApps: []
    // 📦 Local apps served by the backend's package registry
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
  $authState = Ae();
  $f;
  /** The Proxy returned by the constructor; always hand THIS out (arrow fields capture the raw target as `this`). */
  _self;
  constructor() {
    const e = new Proxy(this, {
      get: (t, r) => {
        if (typeof r == "string" && r.startsWith("$")) {
          const n = r.slice(1);
          if (t._protocols.has(n)) return t._protocols.get(n);
          if (t._modules.has(n)) {
            const i = t._modules.get(n);
            return i.isEnabled === !1 ? (console.warn(`🛡️ [sys-kernel] Access denied: Module $${n} is currently DISABLED.`), null) : i;
          }
          if (n in t) return t[r];
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
    r && (r.isEnabled = t, console.log(`🛡️ [sys-kernel] Module status changed: $${e} -> ${t ? "ENABLED" : "DISABLED"}`), this.emit(E.SYSTEM_GOVERNANCE, { id: e, isEnabled: t }));
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
    const n = e.install;
    if (typeof n != "function") throw new Error("[sys-kernel] install(): plugin has no install() method");
    const i = e.id ?? e.name ?? "anonymous";
    return console.log(`🔌 [sys-kernel] Installing module: ${i}`), n.length >= 2 ? await n.call(e, this.$app, r, ...t) : await n.call(e, r, ...t), r;
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
    reactive: m,
    computed: ce,
    watch: G,
    watchEffect: ae,
    nextTick: ie,
    markRaw: b,
    defineAsyncComponent: I,
    shallowRef: oe,
    triggerRef: ne,
    onMounted: se,
    onUnmounted: re,
    defineComponent: V,
    h: q,
    provide: te,
    inject: ee,
    useLocalStorage: H
  };
  init = (e) => {
    console.log("🚀 [sys-kernel] SuperApp Platform Kernel Initializing..."), this.$app = e.app, this.$router = e.router, this.$api = e.api, this.$config = e.config ?? null, this.$theme = e.theme, this.$message = e.message, this.$dialog = e.dialog, this.state.isInitializing = !1, this.syncManifestWithRegisteredApps();
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
  packageFilesEntryUrl = (e, t) => `${this.getApiBaseUrl()}/package-files/${encodeURIComponent(e)}/${encodeURIComponent(t)}/index.js`;
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
      const t = new AbortController(), r = setTimeout(() => t.abort(), 4e3), n = await fetch(`${e}/packages/apps.json`, { cache: "no-store", signal: t.signal });
      if (clearTimeout(r), !n.ok) throw new Error(`HTTP ${n.status}`);
      const i = await n.json();
      this.state.serverApps = i.map((s) => ({
        id: s.appId,
        name: s.title || s.appId,
        type: "package",
        package: s.package,
        version: s.version,
        url: e,
        entryUrl: this.packageFilesEntryUrl(s.package, s.version),
        description: s.description || "",
        icon: s.icon || "Package",
        isSystem: !0,
        isEnabled: !0,
        managedBy: "server",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      })), this.serverAppsLoaded = !0;
    } catch (t) {
      return console.warn(`📦 [sys-kernel] Server apps unavailable (${t?.message ?? t}) — registry unchanged.`), this.state.serverApps;
    }
    return this.syncManifestWithRegisteredApps(), this.emit(E.APPS_UPDATED, this.getRegisteredApps()), this.state.serverApps;
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
    ], n = /* @__PURE__ */ new Set();
    return r.filter((i) => !n.has(i.id) && n.add(i.id));
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
      const e = localStorage.getItem(_), t = this.getDefaultApps();
      if (!e)
        return localStorage.setItem(_, JSON.stringify(t)), t;
      const r = JSON.parse(e);
      if (!Array.isArray(r)) return t;
      const n = this.getHiddenDefaults();
      t.forEach((s) => {
        const a = r.find((c) => c.id === s.id);
        a ? (a.isSystem = !0, a.entryUrl || (a.entryUrl = this.formatAppEntryUrl(a.url))) : n.has(s.id) || r.unshift(s);
      });
      const i = new Map(this.state.serverApps.map((s) => [s.id, s]));
      for (let s = r.length - 1; s >= 0; s--) {
        const a = r[s], c = i.get(a.id);
        if (c) {
          const { isEnabled: l } = a;
          r[s] = { ...a, ...c, isEnabled: l ?? !0 };
        } else a.managedBy === "server" && this.serverAppsLoaded && r.splice(s, 1);
      }
      return r.forEach((s) => {
        s.type === "package" && (s.url = this.getApiBaseUrl(), s.entryUrl = this.resolveAppEntry(s));
      }), r;
    } catch (e) {
      return console.error("Failed to read registered apps from storage:", e), this.getDefaultApps();
    }
  };
  syncManifestWithRegisteredApps = () => {
    const e = this.$config;
    if (!e) return;
    const t = e.moduleManifest ??= {};
    for (const [n, i] of Object.entries(this.state.discovery || {})) {
      if (!n.endsWith(".url") || typeof i != "string" || !i) continue;
      const s = n.slice(0, -4);
      s && !t[s] && (t[s] = this.formatAppEntryUrl(i));
    }
    this.getRegisteredApps().forEach((n) => {
      if (n.id && (n.url || n.type === "package") && n.isEnabled !== !1) {
        const i = n.type === "package" ? this.resolveAppEntry(n) : n.entryUrl || this.formatAppEntryUrl(n.url);
        t[n.id] = i, n.id === "workspace" && (t.expose = i);
      }
    });
  };
  registerApp = (e) => {
    const t = this.normalizeAppId(e.id);
    if (!t) throw new Error("Application ID is required");
    const r = e.type === "package" ? "package" : "remote";
    if (r === "remote" && !e.url) throw new Error("Application Remote URL is required");
    const n = this.getRegisteredApps(), i = r === "package" ? this.getApiBaseUrl() : e.url.trim().replace(/\/+$/, ""), s = this.resolveAppEntry({ id: t, url: i, type: r }), a = n.findIndex((l) => l.id === t), c = {
      id: t,
      name: e.name || t,
      type: r,
      ...r === "package" && e.package ? { package: e.package } : {},
      url: i,
      entryUrl: s,
      description: e.description || "",
      icon: e.icon || "Layers",
      isEnabled: e.isEnabled ?? !0,
      isSystem: a >= 0 ? !!n[a].isSystem : !1,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return a >= 0 ? n[a] = { ...n[a], ...c } : n.push(c), localStorage.setItem(_, JSON.stringify(n)), this.syncManifestWithRegisteredApps(), this.emit(E.APPS_UPDATED, n), c;
  };
  getHiddenDefaults = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem(D) || "[]"));
    } catch {
      return /* @__PURE__ */ new Set();
    }
  };
  normalizeAppId = (e) => (e || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/^-+|-+$/g, "");
  updateApp = (e, t) => {
    const r = this.getRegisteredApps(), n = r.findIndex((l) => l.id === e);
    if (n === -1) throw new Error(`App [${e}] not found`);
    const i = r[n], s = { ...t };
    s.url && (s.url = s.url.trim().replace(/\/+$/, ""));
    const a = s.id !== void 0 ? this.normalizeAppId(s.id) : e;
    if (s.id !== void 0 && !a) throw new Error("Application ID is required");
    if (a !== e) {
      if (r.some((l) => l.id === a)) throw new Error(`App [${a}] already exists`);
      if (this.$config?.moduleManifest && delete this.$config.moduleManifest[e], i.isSystem) {
        const l = this.getHiddenDefaults();
        l.add(e), localStorage.setItem(D, JSON.stringify([...l]));
      }
      this.state.installedModules.delete(e), console.log(`🔁 [sys-kernel] App renamed: ${e} -> ${a}`);
    }
    s.id = a;
    const c = { ...i, ...s, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    if (c.type === "package")
      c.url = this.getApiBaseUrl();
    else if (delete c.package, !c.url) throw new Error("Application Remote URL is required");
    return c.entryUrl = this.resolveAppEntry(c), r[n] = c, localStorage.setItem(_, JSON.stringify(r)), this.syncManifestWithRegisteredApps(), this.emit(E.APPS_UPDATED, r), r[n];
  };
  deleteApp = (e) => {
    const t = this.getRegisteredApps(), r = t.find((i) => i.id === e);
    if (!r) return !1;
    if (r.isSystem)
      throw new Error(`System application [${e}] cannot be removed.`);
    const n = t.filter((i) => i.id !== e);
    return localStorage.setItem(_, JSON.stringify(n)), this.$config?.moduleManifest && delete this.$config.moduleManifest[e], this.emit(E.APPS_UPDATED, n), !0;
  };
  pingApp = async (e) => {
    const t = Date.now();
    try {
      const r = new AbortController(), n = setTimeout(() => r.abort(), 3500);
      return await fetch(e, {
        method: "GET",
        mode: "no-cors",
        signal: r.signal
      }), clearTimeout(n), { success: !0, latencyMs: Date.now() - t, statusText: "Online" };
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
      let n = (this.$config?.moduleManifest || {})[e];
      if (!n) {
        const s = this.getRegisteredApps().find((a) => a.id === e);
        s && s.url && (n = s.entryUrl || this.formatAppEntryUrl(s.url), this.$config && (this.$config.moduleManifest || (this.$config.moduleManifest = {}), this.$config.moduleManifest[e] = n));
      }
      if (!n) {
        console.warn(`⚠️ [sys-kernel] No URL manifest found for [${e}].`);
        return;
      }
      try {
        console.log(`🔌 [sys-kernel] Connecting to remote module [${e}] at ${n}`);
        const s = (await import(
          /* @vite-ignore */
          n
        )).default;
        if (s?.install) {
          console.log(`🛠️ [sys-kernel] Installing remote [${e}]...`);
          const a = this.getRegisteredApps().find((c) => c.id === e) ?? null;
          await this.install(s, { moduleId: e, basePath: `/app/${e}`, app: a }), this.markModuleInstalled(e), console.log(`✅ [sys-kernel] Remote [${e}] installed successfully.`);
        }
      } catch (i) {
        throw console.error(`🚨 [sys-kernel] Failed to load remote [${e}] from ${n}`, i), i;
      } finally {
        this.loadingPromises.delete(e);
      }
    })();
    return this.loadingPromises.set(e, t), t;
  };
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
    return typeof t == "function" ? b(I(t)) : t ? b(t) : null;
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
    return typeof t == "function" ? r = b(I(t)) : r = b(t), this.componentCache.set(e, r), r;
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
    r && r.forEach((n) => n(t));
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
    const e = localStorage.getItem(Se), t = this.superApp?.$appState?.current_workspace || localStorage.getItem(C), r = `req-${Date.now()}-${Math.floor(Math.random() * 1e4)}`, n = {
      Authorization: e ? `Bearer ${e}` : "",
      "Content-Type": "application/json",
      "request-id": r
    };
    return t && (n["x-workspace-id"] = t, localStorage.getItem(C) !== String(t) && localStorage.setItem(C, String(t))), n;
  }
  async request(e, t = {}) {
    try {
      const r = await fetch(`${this.baseUrl}${e}`, {
        ...t,
        headers: { ...this.getHeaders(), ...t.headers }
      });
      if (!r.ok) {
        const n = await r.json().catch(() => ({ message: "System error" })), i = {
          message: n.error || n.message || `Request failed with status ${r.status}`,
          status: r.status,
          path: e
        };
        throw this.superApp?.emit(E.SYSTEM_ERROR, i), new Error(i.message);
      }
      return r.json().catch(() => ({}));
    } catch (r) {
      throw r.message !== "System error" && this.superApp?.emit(E.SYSTEM_ERROR, { message: r.message, path: e }), r;
    }
  }
  /**
   * ⚡ Invoke a SuperApp Action via the Bridge
   */
  async doAction(e, t = {}) {
    console.log(`📡 [ApiProtocol] Invoking action: ${e}`, t);
    const r = await this.request(`${z.ENDPOINTS.SUPERAPP_CALL}/${e}`, {
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
class $e {
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
        const t = JSON.parse(e.data), { type: r, data: n, id: i } = t;
        if (r === "ACTION_RESPONSE" && i && this.actionCallbacks.has(i)) {
          const { resolve: s } = this.actionCallbacks.get(i);
          this.actionCallbacks.delete(i), s(n);
          return;
        }
        if (r === "EVENT" && t.event) {
          this.handlers.has(t.event) && this.handlers.get(t.event)?.forEach((s) => s(t.data));
          return;
        }
        this.handlers.has(r) && this.handlers.get(r)?.forEach((s) => s(n));
      } catch (t) {
        console.error("📡 [SocketProtocol] Message Parse Error", t);
      }
    };
  }
  /**
   * ⚡ Execute an action (Queued if connecting)
   */
  async doAction(e, t) {
    const r = (n, i) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        i(new Error("Socket unexpectedly unavailable"));
        return;
      }
      const s = Math.random().toString(36).substring(7);
      this.actionCallbacks.set(s, { resolve: n, reject: i });
      const a = { type: "ACTION", id: s, action: e, data: t };
      this.socket.send(JSON.stringify(a)), setTimeout(() => {
        this.actionCallbacks.has(s) && (this.actionCallbacks.delete(s), i(new Error(`📡 [SocketProtocol] Action "${e}" timed out.`)));
      }, 3e4);
    };
    return new Promise((n, i) => {
      this.socket?.readyState === WebSocket.OPEN ? r(n, i) : (console.log(`📡 [SocketProtocol] Action "${e}" queued (Socket connecting...)`), this.actionQueue.push(() => r(n, i)));
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
      const n = r.master_api_url || ve?.VITE_MASTER_API_URL || "";
      n || console.warn("🛰️ [Discovery] No master_api_url found in config.json or environment. API discovery skipped.");
      const i = n ? await fetch(`${n}${z.ENDPOINTS.DISCOVERY}`).catch(() => null) : null;
      let s = {};
      if (i && i.ok) {
        const a = i.headers.get("content-type");
        if (a && a.includes("application/json"))
          try {
            s = await i.json(), console.log("🛰️ [Discovery] Dynamic API discovery config loaded.");
          } catch {
            console.warn("🛰️ [Discovery] API returned invalid JSON");
          }
      }
      this.config = { ...s, ...r }, this.initialized = !0, e && (e.state.discovery = { ...this.config }), console.log("🛰️ [Discovery] Total variables loaded:", Object.keys(this.config).length);
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
const _e = new be(), Re = () => {
  const o = H(we, {
    current_app: "workspace",
    current_workspace: null
  });
  return (typeof o.value != "object" || o.value === null) && (console.warn("⚠️ [AppState] Invalid storage detected, resetting to defaults."), o.value = {
    current_app: "workspace",
    current_workspace: null
  }), m({
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
}, Pe = 3e4, U = "x-request-id";
function Te() {
  if (typeof crypto.randomUUID == "function")
    return crypto.randomUUID();
  const o = crypto.getRandomValues(new Uint8Array(16));
  o[6] = o[6] & 15 | 64, o[8] = o[8] & 63 | 128;
  const e = Array.from(o, (t) => t.toString(16).padStart(2, "0")).join("");
  return `${e.slice(0, 8)}-${e.slice(8, 12)}-${e.slice(12, 16)}-${e.slice(16, 20)}-${e.slice(20)}`;
}
function Me(o) {
  const e = o.response?.data, t = e && typeof e == "object" ? e.message || e.error_description || (typeof e.error == "string" ? e.error : void 0) : void 0;
  return {
    status: o.response?.status ?? null,
    message: t || o.message || "Request failed",
    code: e && typeof e == "object" && (e.code || (typeof e.error == "string" ? e.error : void 0)) || o.code,
    data: e,
    url: o.config?.url,
    method: o.config?.method?.toUpperCase(),
    requestId: o.config?.headers?.get?.(U)?.toString(),
    cause: o
  };
}
function Ie(o) {
  return function(t) {
    const { baseURL: r, headers: n, withToken: i = !0, workspace: s = !1, onError: a, setup: c, ...l } = t;
    if (!r)
      throw new Error("[createApi] `baseURL` is required — read it from env (e.g. import.meta.env.VITE_API_URL).");
    const u = N.create({
      timeout: Pe,
      ...l,
      baseURL: r,
      headers: { Accept: "application/json", ...n }
    });
    return u.interceptors.request.use((d) => {
      if (d.headers.has(U) || d.headers.set(U, Te()), i) {
        const g = localStorage.getItem(o.tokenKey);
        g && !d.headers.has("Authorization") && d.headers.set("Authorization", `Bearer ${g}`);
      }
      if (s) {
        const g = o.appState?.()?.current_workspace;
        g && d.headers.set("x-workspace-id", String(g));
      }
      return d;
    }), u.interceptors.response.use(
      (d) => d,
      (d) => {
        if (N.isCancel(d))
          return Promise.reject(d);
        const g = Me(d);
        return a ? a(g) : o.message?.error(g.message), Promise.reject(g);
      }
    ), c?.(u), u;
  };
}
const Ce = {
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
    shell: { home: "Home", apps: "Apps", all: "All", favorites: "Favorites", favoritesEmpty: "No favorites yet — press the star on an app.", toggleFavorite: "Toggle favorite", searchApps: "Search apps…", settings: "Settings", theme: "Appearance", language: "Language", logout: "Sign out", profile: "Profile" },
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
    shell: { home: "Trang chủ", apps: "Ứng dụng", all: "Tất cả", favorites: "Yêu thích", favoritesEmpty: "Chưa có mục yêu thích — bấm ngôi sao trên ứng dụng.", toggleFavorite: "Yêu thích", searchApps: "Tìm ứng dụng…", settings: "Cài đặt", theme: "Giao diện", language: "Ngôn ngữ", logout: "Đăng xuất", profile: "Hồ sơ" },
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
  for (const [r, n] of Object.entries(o)) {
    const i = e ? `${e}.${r}` : r;
    n && typeof n == "object" ? Y(n, i, t) : t[i] = String(n);
  }
  return t;
}, Ue = (o, e) => e ? o.replace(/\{(\w+)\}/g, (t, r) => e[r] === void 0 || e[r] === null ? t : String(e[r])) : o, Oe = (o, e) => {
  if (e?.count === void 0 || e.count === null || !o.includes("|")) return o;
  const t = Number(e.count);
  if (!Number.isFinite(t)) return o;
  const r = o.split("|").map((n) => n.trim());
  return r.length === 2 ? t === 1 ? r[0] : r[1] : r.length >= 3 ? t === 0 ? r[0] : t === 1 ? r[1] : r[2] : r[0];
};
function De(o = {}) {
  const e = o.fallbackLocale ?? "en", t = o.persist ?? !0, r = t ? (() => {
    try {
      return localStorage.getItem(L);
    } catch {
      return null;
    }
  })() : null, n = m({ locale: r || o.locale || e, messages: {} }), i = /* @__PURE__ */ new Set(), s = (u, d, g) => {
    const $ = Y(d, g || "");
    n.messages[u] = { ...n.messages[u] ?? {}, ...$ };
  }, a = (u, d) => {
    for (const [g, $] of Object.entries(u)) s(g, $, d);
  };
  a(Ce), o.messages && a(o.messages);
  const c = (u, d) => n.messages[d]?.[u], l = {
    get locale() {
      return n.locale;
    },
    set locale(u) {
      l.setLocale(u);
    },
    fallbackLocale: e,
    get availableLocales() {
      return Object.keys(n.messages);
    },
    t(u, d) {
      const g = c(u, n.locale) ?? c(u, e) ?? d?.default ?? u;
      return Ue(Oe(g, d), d);
    },
    te(u, d) {
      return c(u, d ?? n.locale) !== void 0 || !d && c(u, e) !== void 0;
    },
    setLocale(u) {
      if (!u || u === n.locale) return;
      const d = n.locale;
      if (n.locale = u, t)
        try {
          localStorage.setItem(L, u);
        } catch {
        }
      document.documentElement.setAttribute("lang", u), i.forEach((g) => g(u, d));
    },
    addMessages: a,
    addLocaleMessages: s,
    getMessages(u = n.locale, d = !0) {
      return d ? { ...n.messages[e] ?? {}, ...n.messages[u] ?? {} } : { ...n.messages[u] ?? {} };
    },
    onLocaleChange(u) {
      return i.add(u), () => i.delete(u);
    }
  };
  return typeof document < "u" && document.documentElement.setAttribute("lang", n.locale), G(() => n.locale, () => {
  }), l;
}
function A(o) {
  return o === "vi" ? "vi-VN" : o === "en" ? "en-US" : o;
}
const j = /* @__PURE__ */ new Map();
function k(o, e) {
  const t = j.get(o);
  if (t)
    return t;
  const r = e();
  return j.set(o, r), r;
}
function R(o) {
  if (o == null || o === "")
    return null;
  const e = o instanceof Date ? o : new Date(o);
  return Number.isNaN(e.getTime()) ? null : e;
}
const Le = [
  { unit: "year", ms: 365 * 864e5 },
  { unit: "month", ms: 30 * 864e5 },
  { unit: "day", ms: 864e5 },
  { unit: "hour", ms: 36e5 },
  { unit: "minute", ms: 6e4 },
  { unit: "second", ms: 1e3 }
], x = ["B", "KB", "MB", "GB", "TB", "PB"], Ne = /* @__PURE__ */ new Set([
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
function J(o, e = {}) {
  const t = e.fallbackLocale ?? "vi";
  let r = e.currency ?? "VND";
  const n = e.registry ?? Be(), i = {
    get locale() {
      return o() || t;
    },
    get currency() {
      return r;
    },
    set currency(s) {
      r = s;
    },
    formatMoney(s, a) {
      if (s == null || !Number.isFinite(s))
        return w;
      const c = a ?? r, l = A(i.locale);
      return k(`money:${l}:${c}`, () => new Intl.NumberFormat(l, {
        style: "currency",
        currency: c,
        maximumFractionDigits: 0
      })).format(s);
    },
    formatNumber(s, a = 0) {
      if (s == null || !Number.isFinite(s))
        return w;
      const c = A(i.locale);
      return k(`number:${c}:${a}`, () => new Intl.NumberFormat(c, {
        maximumFractionDigits: a
      })).format(s);
    },
    formatPercent(s, a = 1) {
      if (s == null || !Number.isFinite(s))
        return w;
      const c = A(i.locale);
      return k(`percent:${c}:${a}`, () => new Intl.NumberFormat(c, {
        style: "percent",
        maximumFractionDigits: a
      })).format(s);
    },
    formatDate(s) {
      const a = R(s);
      if (!a)
        return w;
      const c = A(i.locale);
      return k(`date:${c}`, () => new Intl.DateTimeFormat(c, {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })).format(a);
    },
    formatDateTime(s) {
      const a = R(s);
      if (!a)
        return w;
      const c = A(i.locale);
      return k(`datetime:${c}`, () => new Intl.DateTimeFormat(c, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })).format(a);
    },
    formatTime(s) {
      const a = R(s);
      if (!a)
        return w;
      const c = A(i.locale);
      return k(`time:${c}`, () => new Intl.DateTimeFormat(c, {
        hour: "2-digit",
        minute: "2-digit"
      })).format(a);
    },
    formatRelative(s) {
      const a = R(s);
      if (!a)
        return w;
      const c = A(i.locale), l = k(`relative:${c}`, () => new Intl.RelativeTimeFormat(c, {
        numeric: "auto"
      })), u = a.getTime() - Date.now();
      for (const d of Le)
        if (Math.abs(u) >= d.ms)
          return l.format(Math.round(u / d.ms), d.unit);
      return l.format(0, "second");
    },
    formatBytes(s, a = 1) {
      if (s == null || !Number.isFinite(s))
        return w;
      let c = Math.abs(s), l = 0;
      for (; c >= 1024 && l < x.length - 1; )
        c = c / 1024, l = l + 1;
      const u = s < 0 ? "-" : "", d = l === 0 ? 0 : a;
      return `${u}${i.formatNumber(c, d)} ${x[l]}`;
    },
    withLocale(s) {
      return J(() => s, { fallbackLocale: t, currency: r, registry: n });
    },
    register(s, a) {
      if (!s)
        throw new Error("[format] register() needs a namespace — use the module id.");
      const c = n.groups.get(s) ?? {};
      for (const [l, u] of Object.entries(a)) {
        if (Ne.has(l))
          throw new Error(`[format] "${l}" is a built-in formatter and cannot be replaced.`);
        c[l] = u;
        const d = n.owners.get(l);
        if (!d) {
          n.owners.set(l, s);
          continue;
        }
        d !== s && console.warn(
          `⚠️ [format] "${l}" is already registered by [${d}], so $f.${l} stays theirs. [${s}] can reach its own as $f.of('${s}').${l}.`
        );
      }
      return n.groups.set(s, c), c;
    },
    of(s) {
      return n.groups.get(s) ?? {};
    },
    ownerOf(s) {
      return n.owners.get(s) ?? null;
    }
  };
  return new Proxy(i, {
    get(s, a, c) {
      if (typeof a != "string" || a in s)
        return Reflect.get(s, a, c);
      const l = n.owners.get(a);
      if (l)
        return n.groups.get(l)?.[a];
    },
    has(s, a) {
      return a in s ? !0 : typeof a == "string" && n.owners.has(a);
    },
    ownKeys(s) {
      return [.../* @__PURE__ */ new Set([...Reflect.ownKeys(s), ...n.owners.keys()])];
    },
    getOwnPropertyDescriptor(s, a) {
      const c = Reflect.getOwnPropertyDescriptor(s, a);
      if (c)
        return c;
      if (typeof a == "string" && n.owners.has(a))
        return { configurable: !0, enumerable: !0, value: void 0 };
    }
  });
}
function je(o, e = {}) {
  return J(() => o.locale, e);
}
function xe(o) {
  return globalThis[K] = o, o;
}
function Qe() {
  return globalThis[K];
}
const Fe = {}, F = "Root", We = Fe ?? {}, qe = (o) => o || We.VITE_MASTER_API_URL || (window.location.hostname === "localhost" ? "http://localhost:4400" : ""), Ve = () => {
  const o = window.location.protocol === "https:" ? "wss:" : "ws:", e = window.location.host.replace(":4401", ":4400");
  return `${o}//${e}/socket`;
}, W = (o, e) => async () => {
  const t = o.getComponent(e);
  if (!t) throw new Error(`[sapp] Route component not registered: ${e}`);
  return typeof t == "function" ? t() : t;
};
async function Xe(o) {
  xe({ Vue: Z, Pinia: de, VueRouter: fe, VueUse: ye });
  const e = ue(o.root), t = ge();
  e.use(t);
  const r = o.discovery ?? _e;
  await r.initialize();
  const n = o.api?.baseUrl ?? qe(r.get("master_api_url"));
  console.log("💉 [sapp] apiBase:", n);
  const i = new ke();
  i.$app = e, window.$superApp = i;
  const s = o.theme.register(e, i), a = s.uiStore, c = De(o.i18n), l = je(c, { currency: o.currency });
  i.registerProtocol("i18n", c), c.onLocaleChange((p, y) => i.emit("i18n:locale-changed", { locale: p, previous: y }));
  const u = new Ee(n), d = new $e(o.socket?.url ?? Ve());
  d.connect(), i.registerProtocol("api", u), i.registerProtocol("socket", d), u.bind(i);
  const g = o.auth?.tokenKey ?? "accessToken";
  i.createApi = Ie({
    tokenKey: g,
    message: s.messageService,
    appState: () => i.$appState
  });
  const $ = o.auth?.loginPath ?? "/login", Q = o.layout ?? V({ name: "SappLayout", setup: () => () => q(pe) }), X = [
    { path: $, name: "Login", component: W(i, o.auth?.loginComponentId ?? "auth.login"), meta: { public: !0 } },
    {
      path: "/",
      name: F,
      component: Q,
      children: [
        { path: "app/:moduleId(.*)*", name: "AppGateway", component: W(i, "layout.app-container") }
      ]
    },
    ...o.routes ?? []
  ], v = me({ history: he(o.router?.base), routes: X });
  v.beforeEach((p, y, f) => {
    const S = localStorage.getItem(g);
    if (!p.meta.public && !S) return f($);
    f();
  });
  const P = { app: e, router: v, pinia: t, superApp: i, discovery: r, api: u, socket: d };
  if (await o.modules?.(P), i.state.discovery = r.getAll(), i.init({
    app: e,
    router: v,
    config: { moduleManifest: { ...o.manifest ?? {}, ...r.getAll() }, branding: o.branding },
    theme: o.tokens,
    message: s.messageService,
    dialog: s.dialogService
  }), await i.loadServerApps(), o.branding) {
    const { name: p, icon: y, logo: f } = o.branding;
    p && (document.title = p);
    const S = y || f;
    if (S) {
      const M = document.querySelector('link[rel~="icon"]') ?? Object.assign(document.createElement("link"), { rel: "icon" });
      M.href = S, M.parentNode || document.head.appendChild(M);
    }
  }
  const T = s.appState ?? Re(), O = r.get("system.workspaces");
  O && (T.workspaces = O), i.$appState = T, e.config.globalProperties.$appState = T, e.config.globalProperties.$auth = i.$authState, e.provide("$auth", i.$authState);
  for (const p of o.features ?? []) {
    const y = {
      ...P,
      featureId: p.id,
      registerRoute: (f) => v.addRoute(F, f),
      registerTopRoute: (f) => v.addRoute(f),
      registerComponent: (f) => i.registerComponent(f),
      registerSkill: (f) => i.registerSkill(f),
      registerCommand: (f) => i.registerCommand(f),
      registerMessages: (f, S) => c.addMessages(f, S),
      provide: (f, S) => e.provide(f, S)
    };
    await p.install(y), console.log(`🧩 [sapp] Shell feature installed: ${p.id}`);
  }
  const h = e.config.globalProperties;
  return h.$c = (p) => i.getComponent(p), h.$s = i, h.$superApp = i, h.$message = s.messageService, h.$dialog = s.dialogService, h.$i18n = c, h.$t = (p, y) => c.t(p, y), h.$f = l, i.$f = l, e.provide("$i18n", c), e.provide("$f", l), e.provide("ui-store", a), e.provide("$theme", o.tokens), e.provide("$superApp", i), e.provide("$s", i), e.provide("$message", s.messageService), e.provide("$dialog", s.dialogService), {
    ...P,
    mount(p = "#app") {
      return e.use(v), e.mount(p), e;
    }
  };
}
export {
  Ee as A,
  Ce as B,
  be as D,
  $e as S,
  ke as a,
  Ie as b,
  Xe as c,
  Re as d,
  Ae as e,
  J as f,
  je as g,
  De as h,
  _e as i,
  Qe as j,
  xe as k
};
//# sourceMappingURL=createSapp-BYsyLHPw.js.map
