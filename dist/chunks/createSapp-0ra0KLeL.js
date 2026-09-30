import * as W from "vue";
import { reactive as g, inject as z, provide as q, h as N, defineComponent as U, onUnmounted as K, onMounted as J, triggerRef as V, shallowRef as F, defineAsyncComponent as b, markRaw as E, nextTick as Y, watchEffect as Q, watch as L, computed as X, ref as Z, createApp as ee } from "vue";
import * as te from "pinia";
import { createPinia as se } from "pinia";
import * as oe from "vue-router";
import { RouterView as ne, createRouter as re, createWebHistory as ie } from "vue-router";
import * as ae from "@vueuse/core";
import { useLocalStorage as x } from "@vueuse/core";
import { S as A, R as $, H as R, A as le, a as C, f as j, b as ce, c as T, M as B } from "./i18n-CxgmT8C9.js";
const O = {};
class ue {
  modules = /* @__PURE__ */ new Map();
  components = /* @__PURE__ */ new Map();
  // 🛰️ ESA v5: Reactive Registries
  _protocols = g(/* @__PURE__ */ new Map());
  _modules = g(/* @__PURE__ */ new Map());
  // 🧠 ESA v5: Event Bus (Central Nervous System)
  _eventHandlers = /* @__PURE__ */ new Map();
  // ⚡ Reactive state for UI elements (Navigation, Command Palette)
  state = g({
    isInitializing: !0,
    skills: [],
    commands: [],
    installedModules: /* @__PURE__ */ new Set(),
    moduleStates: {},
    // 🧠 Centralized Mini-App State
    discovery: {}
    // 🛰️ System discovery parameters
  });
  loadingPromises = /* @__PURE__ */ new Map();
  $app = null;
  $router = null;
  $config = null;
  $theme = null;
  $toast = null;
  $message = null;
  $dialog = null;
  $api = null;
  $appState = null;
  /** The Proxy returned by the constructor; always hand THIS out (arrow fields capture the raw target as `this`). */
  _self;
  constructor() {
    const e = new Proxy(this, {
      get: (t, s) => {
        if (typeof s == "string" && s.startsWith("$")) {
          const o = s.slice(1);
          if (t._protocols.has(o)) return t._protocols.get(o);
          if (t._modules.has(o)) {
            const n = t._modules.get(o);
            return n.isEnabled === !1 ? (console.warn(`🛡️ [sys-kernel] Access denied: Module $${o} is currently DISABLED.`), null) : n;
          }
          if (o in t) return t[s];
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
    s && (s.isEnabled = t, console.log(`🛡️ [sys-kernel] Module status changed: $${e} -> ${t ? "ENABLED" : "DISABLED"}`), this.emit(A.SYSTEM_GOVERNANCE, { id: e, isEnabled: t }));
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
    const o = e.install;
    if (typeof o != "function") throw new Error("[sys-kernel] install(): plugin has no install() method");
    const n = e.id ?? e.name ?? "anonymous";
    return console.log(`🔌 [sys-kernel] Installing module: ${n}`), o.length >= 2 ? await o.call(e, this.$app, s, ...t) : await o.call(e, s, ...t), s;
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
    ref: Z,
    reactive: g,
    computed: X,
    watch: L,
    watchEffect: Q,
    nextTick: Y,
    markRaw: E,
    defineAsyncComponent: b,
    shallowRef: F,
    triggerRef: V,
    onMounted: J,
    onUnmounted: K,
    defineComponent: U,
    h: N,
    provide: q,
    inject: z,
    useLocalStorage: x
  };
  init = (e) => {
    console.log("🚀 [sys-kernel] SuperApp Platform Kernel Initializing..."), this.$app = e.app, this.$router = e.router, this.$api = e.api, this.$config = e.config ?? null, this.$theme = e.theme, this.$toast = e.toast, this.$message = e.message, this.$dialog = e.dialog, this.state.isInitializing = !1, this.syncManifestWithRegisteredApps();
  };
  // --- 🌐 DYNAMIC APPLICATION REGISTRY ---
  formatAppEntryUrl = (e) => {
    if (!e) return "";
    const t = e.trim().replace(/\/+$/, "");
    return t.endsWith(".js") || t.endsWith(".ts") ? t : `${t}/index.js`;
  };
  getDefaultApps = () => {
    const e = (this.state.discovery?.["admin.url"] || O?.VITE_ADMIN_URL || "http://localhost:4403").replace(/\/+$/, ""), t = (this.state.discovery?.["workspace.url"] || O?.VITE_WORKSPACE_URL || "http://localhost:4409").replace(/\/+$/, "");
    return [
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
    ];
  };
  getRegisteredApps = () => {
    try {
      const e = localStorage.getItem($), t = this.getDefaultApps();
      if (!e)
        return localStorage.setItem($, JSON.stringify(t)), t;
      const s = JSON.parse(e);
      if (!Array.isArray(s)) return t;
      const o = this.getHiddenDefaults();
      return t.forEach((n) => {
        const r = s.find((l) => l.id === n.id);
        r ? (r.isSystem = !0, r.entryUrl || (r.entryUrl = this.formatAppEntryUrl(r.url))) : o.has(n.id) || s.unshift(n);
      }), s;
    } catch (e) {
      return console.error("Failed to read registered apps from storage:", e), this.getDefaultApps();
    }
  };
  syncManifestWithRegisteredApps = () => {
    const e = this.$config;
    if (!e) return;
    const t = e.moduleManifest ??= {};
    for (const [o, n] of Object.entries(this.state.discovery || {})) {
      if (!o.endsWith(".url") || typeof n != "string" || !n) continue;
      const r = o.slice(0, -4);
      r && !t[r] && (t[r] = this.formatAppEntryUrl(n));
    }
    this.getRegisteredApps().forEach((o) => {
      if (o.id && o.url && o.isEnabled !== !1) {
        const n = o.entryUrl || this.formatAppEntryUrl(o.url);
        t[o.id] = n, o.id === "workspace" && (t.expose = n);
      }
    });
  };
  registerApp = (e) => {
    const t = this.normalizeAppId(e.id);
    if (!t) throw new Error("Application ID is required");
    if (!e.url) throw new Error("Application Remote URL is required");
    const s = this.getRegisteredApps(), o = this.formatAppEntryUrl(e.url), n = s.findIndex((l) => l.id === t), r = {
      id: t,
      name: e.name || t,
      url: e.url.trim().replace(/\/+$/, ""),
      entryUrl: o,
      description: e.description || "",
      icon: e.icon || "Layers",
      isEnabled: e.isEnabled ?? !0,
      isSystem: n >= 0 ? !!s[n].isSystem : !1,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return n >= 0 ? s[n] = { ...s[n], ...r } : s.push(r), localStorage.setItem($, JSON.stringify(s)), this.syncManifestWithRegisteredApps(), this.emit(A.APPS_UPDATED, s), r;
  };
  getHiddenDefaults = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem(R) || "[]"));
    } catch {
      return /* @__PURE__ */ new Set();
    }
  };
  normalizeAppId = (e) => (e || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/^-+|-+$/g, "");
  updateApp = (e, t) => {
    const s = this.getRegisteredApps(), o = s.findIndex((c) => c.id === e);
    if (o === -1) throw new Error(`App [${e}] not found`);
    const n = s[o], r = { ...t };
    r.url && (r.url = r.url.trim().replace(/\/+$/, ""), r.entryUrl = this.formatAppEntryUrl(r.url));
    const l = r.id !== void 0 ? this.normalizeAppId(r.id) : e;
    if (r.id !== void 0 && !l) throw new Error("Application ID is required");
    if (l !== e) {
      if (s.some((c) => c.id === l)) throw new Error(`App [${l}] already exists`);
      if (this.$config?.moduleManifest && delete this.$config.moduleManifest[e], n.isSystem) {
        const c = this.getHiddenDefaults();
        c.add(e), localStorage.setItem(R, JSON.stringify([...c]));
      }
      this.state.installedModules.delete(e), console.log(`🔁 [sys-kernel] App renamed: ${e} -> ${l}`);
    }
    return r.id = l, s[o] = { ...n, ...r, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }, localStorage.setItem($, JSON.stringify(s)), this.syncManifestWithRegisteredApps(), this.emit(A.APPS_UPDATED, s), s[o];
  };
  deleteApp = (e) => {
    const t = this.getRegisteredApps(), s = t.find((n) => n.id === e);
    if (!s) return !1;
    if (s.isSystem)
      throw new Error(`System application [${e}] cannot be removed.`);
    const o = t.filter((n) => n.id !== e);
    return localStorage.setItem($, JSON.stringify(o)), this.$config?.moduleManifest && delete this.$config.moduleManifest[e], this.emit(A.APPS_UPDATED, o), !0;
  };
  pingApp = async (e) => {
    const t = Date.now();
    try {
      const s = new AbortController(), o = setTimeout(() => s.abort(), 3500);
      return await fetch(e, {
        method: "GET",
        mode: "no-cors",
        signal: s.signal
      }), clearTimeout(o), { success: !0, latencyMs: Date.now() - t, statusText: "Online" };
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
      let o = (this.$config?.moduleManifest || {})[e];
      if (!o) {
        const r = this.getRegisteredApps().find((l) => l.id === e);
        r && r.url && (o = r.entryUrl || this.formatAppEntryUrl(r.url), this.$config && (this.$config.moduleManifest || (this.$config.moduleManifest = {}), this.$config.moduleManifest[e] = o));
      }
      if (!o) {
        console.warn(`⚠️ [sys-kernel] No URL manifest found for [${e}].`);
        return;
      }
      try {
        console.log(`🔌 [sys-kernel] Connecting to remote module [${e}] at ${o}`);
        const r = (await import(
          /* @vite-ignore */
          o
        )).default;
        if (r?.install) {
          console.log(`🛠️ [sys-kernel] Installing remote [${e}]...`);
          const l = this.getRegisteredApps().find((c) => c.id === e) ?? null;
          await this.install(r, { moduleId: e, basePath: `/app/${e}`, app: l }), this.markModuleInstalled(e), console.log(`✅ [sys-kernel] Remote [${e}] installed successfully.`);
        }
      } catch (n) {
        throw console.error(`🚨 [sys-kernel] Failed to load remote [${e}] from ${o}`, n), n;
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
  getModuleState = (e, t = {}) => (this.state.moduleStates[e] || (this.state.moduleStates[e] = g(t)), this.state.moduleStates[e]);
  // Moved to standalone ApiModule.ts
  createApi = (e) => (console.warn("⚠️ [sys-kernel] createApi is deprecated. Use $superApp.$api instead."), this._protocols.get("api"));
  /**
   * 🗺️ [sys-kernel] MFE Entry Registration
   */
  registerModuleEntry = (e) => {
    const t = this.getComponent(e.entryComponentId);
    t ? (this.modules.set(e.moduleId, t), console.log(`📡 [sys-kernel] Module entry registered: ${e.moduleId} -> ${e.entryComponentId}`)) : console.error(`🚨 [sys-kernel] Failed to register entry for ${e.moduleId}: Component ${e.entryComponentId} not found.`);
  };
  getModuleEntry = (e) => {
    const t = this.modules.get(e);
    return typeof t == "function" ? E(b(t)) : t ? E(t) : null;
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
    return typeof t == "function" ? s = E(b(t)) : s = E(t), this.componentCache.set(e, s), s;
  };
  skills = g([]);
  commands = g([]);
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
    s && s.forEach((o) => o(t));
  };
}
class de {
  id = "api";
  baseUrl;
  superApp = null;
  constructor(e = "") {
    this.baseUrl = e;
  }
  setBaseUrl(e) {
    this.baseUrl = e;
  }
  /**
   * 🔗 Bind to SuperApp to enable event broadcasting
   */
  bind(e) {
    this.superApp = e;
  }
  getHeaders() {
    const e = localStorage.getItem(le), t = this.superApp?.$appState?.current_workspace || localStorage.getItem(C), s = `req-${Date.now()}-${Math.floor(Math.random() * 1e4)}`, o = {
      Authorization: e ? `Bearer ${e}` : "",
      "Content-Type": "application/json",
      "request-id": s
    };
    return t && (o["x-workspace-id"] = t, localStorage.getItem(C) !== String(t) && localStorage.setItem(C, String(t))), o;
  }
  async request(e, t = {}) {
    try {
      const s = await fetch(`${this.baseUrl}${e}`, {
        ...t,
        headers: { ...this.getHeaders(), ...t.headers }
      });
      if (!s.ok) {
        const o = await s.json().catch(() => ({ message: "System error" })), n = {
          message: o.error || o.message || `Request failed with status ${s.status}`,
          status: s.status,
          path: e
        };
        throw this.superApp?.emit(A.SYSTEM_ERROR, n), new Error(n.message);
      }
      return s.json().catch(() => ({}));
    } catch (s) {
      throw s.message !== "System error" && this.superApp?.emit(A.SYSTEM_ERROR, { message: s.message, path: e }), s;
    }
  }
  /**
   * ⚡ Invoke a SuperApp Action via the Bridge
   */
  async doAction(e, t = {}) {
    console.log(`📡 [ApiProtocol] Invoking action: ${e}`, t);
    const s = await this.request(`${j.ENDPOINTS.SUPERAPP_CALL}/${e}`, {
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
class pe {
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
        const t = JSON.parse(e.data), { type: s, data: o, id: n } = t;
        if (s === "ACTION_RESPONSE" && n && this.actionCallbacks.has(n)) {
          const { resolve: r } = this.actionCallbacks.get(n);
          this.actionCallbacks.delete(n), r(o);
          return;
        }
        if (s === "EVENT" && t.event) {
          this.handlers.has(t.event) && this.handlers.get(t.event)?.forEach((r) => r(t.data));
          return;
        }
        this.handlers.has(s) && this.handlers.get(s)?.forEach((r) => r(o));
      } catch (t) {
        console.error("📡 [SocketProtocol] Message Parse Error", t);
      }
    };
  }
  /**
   * ⚡ Execute an action (Queued if connecting)
   */
  async doAction(e, t) {
    const s = (o, n) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        n(new Error("Socket unexpectedly unavailable"));
        return;
      }
      const r = Math.random().toString(36).substring(7);
      this.actionCallbacks.set(r, { resolve: o, reject: n });
      const l = { type: "ACTION", id: r, action: e, data: t };
      this.socket.send(JSON.stringify(l)), setTimeout(() => {
        this.actionCallbacks.has(r) && (this.actionCallbacks.delete(r), n(new Error(`📡 [SocketProtocol] Action "${e}" timed out.`)));
      }, 3e4);
    };
    return new Promise((o, n) => {
      this.socket?.readyState === WebSocket.OPEN ? s(o, n) : (console.log(`📡 [SocketProtocol] Action "${e}" queued (Socket connecting...)`), this.actionQueue.push(() => s(o, n)));
    });
  }
  on(e, t) {
    const s = this.handlers.get(e) || [];
    s.push(t), this.handlers.set(e, s);
  }
}
const he = { BASE_URL: "/", DEV: !1, MODE: "production", PROD: !0, SSR: !1 };
class ge {
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
        const l = t.headers.get("content-type");
        l && l.includes("application/json") ? (s = await t.json(), console.log("🏗️ [Discovery] Static runtime config loaded from /config.json")) : console.warn("🏗️ [Discovery] /config.json returned non-JSON content (likely index.html fallback)");
      }
      const o = s.master_api_url || he?.VITE_MASTER_API_URL || "";
      o || console.warn("🛰️ [Discovery] No master_api_url found in config.json or environment. API discovery skipped.");
      const n = o ? await fetch(`${o}${j.ENDPOINTS.DISCOVERY}`).catch(() => null) : null;
      let r = {};
      if (n && n.ok) {
        const l = n.headers.get("content-type");
        if (l && l.includes("application/json"))
          try {
            r = await n.json(), console.log("🛰️ [Discovery] Dynamic API discovery config loaded.");
          } catch {
            console.warn("🛰️ [Discovery] API returned invalid JSON");
          }
      }
      this.config = { ...r, ...s }, this.initialized = !0, e && (e.state.discovery = { ...this.config }), console.log("🛰️ [Discovery] Total variables loaded:", Object.keys(this.config).length);
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
const me = new ge(), fe = () => {
  const i = x(ce, {
    current_app: "workspace",
    current_workspace: null
  });
  return (typeof i.value != "object" || i.value === null) && (console.warn("⚠️ [AppState] Invalid storage detected, resetting to defaults."), i.value = {
    current_app: "workspace",
    current_workspace: null
  }), g({
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
}, ye = {
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
      savedOnDevice: "Saved on this browser"
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
      savedOnDevice: "Lưu trên trình duyệt này"
    }
  }
}, G = (i, e = "", t = {}) => {
  for (const [s, o] of Object.entries(i)) {
    const n = e ? `${e}.${s}` : s;
    o && typeof o == "object" ? G(o, n, t) : t[n] = String(o);
  }
  return t;
}, Se = (i, e) => e ? i.replace(/\{(\w+)\}/g, (t, s) => e[s] === void 0 || e[s] === null ? t : String(e[s])) : i;
function we(i = {}) {
  const e = i.fallbackLocale ?? "en", t = i.persist ?? !0, s = t ? (() => {
    try {
      return localStorage.getItem(T);
    } catch {
      return null;
    }
  })() : null, o = g({ locale: s || i.locale || e, messages: {} }), n = /* @__PURE__ */ new Set(), r = (a, d, h) => {
    const k = G(d, h || "");
    o.messages[a] = { ...o.messages[a] ?? {}, ...k };
  }, l = (a, d) => {
    for (const [h, k] of Object.entries(a)) r(h, k, d);
  };
  l(ye), i.messages && l(i.messages);
  const c = (a, d) => o.messages[d]?.[a], S = {
    get locale() {
      return o.locale;
    },
    set locale(a) {
      S.setLocale(a);
    },
    fallbackLocale: e,
    get availableLocales() {
      return Object.keys(o.messages);
    },
    t(a, d) {
      const h = c(a, o.locale) ?? c(a, e) ?? d?.default ?? a;
      return Se(h, d);
    },
    te(a, d) {
      return c(a, d ?? o.locale) !== void 0 || !d && c(a, e) !== void 0;
    },
    setLocale(a) {
      if (!a || a === o.locale) return;
      const d = o.locale;
      if (o.locale = a, t)
        try {
          localStorage.setItem(T, a);
        } catch {
        }
      document.documentElement.setAttribute("lang", a), n.forEach((h) => h(a, d));
    },
    addMessages: l,
    addLocaleMessages: r,
    getMessages(a = o.locale, d = !0) {
      return d ? { ...o.messages[e] ?? {}, ...o.messages[a] ?? {} } : { ...o.messages[a] ?? {} };
    },
    onLocaleChange(a) {
      return n.add(a), () => n.delete(a);
    }
  };
  return typeof document < "u" && document.documentElement.setAttribute("lang", o.locale), L(() => o.locale, () => {
  }), S;
}
function Ae(i) {
  return globalThis[B] = i, i;
}
function Re() {
  return globalThis[B];
}
const ke = {}, I = "Root", Ee = ke ?? {}, $e = (i) => i || Ee.VITE_MASTER_API_URL || (window.location.hostname === "localhost" ? "http://localhost:4400" : ""), _e = () => {
  const i = window.location.protocol === "https:" ? "wss:" : "ws:", e = window.location.host.replace(":4401", ":4400");
  return `${i}//${e}/socket`;
}, D = (i, e) => async () => {
  const t = i.getComponent(e);
  if (!t) throw new Error(`[sapp] Route component not registered: ${e}`);
  return typeof t == "function" ? t() : t;
};
async function Te(i) {
  Ae({ Vue: W, Pinia: te, VueRouter: oe, VueUse: ae });
  const e = ee(i.root), t = se();
  e.use(t);
  const s = i.discovery ?? me;
  await s.initialize();
  const o = i.api?.baseUrl ?? $e(s.get("master_api_url"));
  console.log("💉 [sapp] apiBase:", o);
  const n = new ue();
  n.$app = e, window.$superApp = n;
  const r = i.theme.register(e, n), l = r.uiStore, c = we(i.i18n);
  n.registerProtocol("i18n", c), c.onLocaleChange((p, f) => n.emit("i18n:locale-changed", { locale: p, previous: f }));
  const S = new de(o), a = new pe(i.socket?.url ?? _e());
  a.connect(), n.registerProtocol("api", S), n.registerProtocol("socket", a), S.bind(n);
  const d = i.auth?.tokenKey ?? "accessToken", h = i.auth?.loginPath ?? "/login", k = i.layout ?? U({ name: "SappLayout", setup: () => () => N(ne) }), H = [
    { path: h, name: "Login", component: D(n, i.auth?.loginComponentId ?? "auth.login"), meta: { public: !0 } },
    {
      path: "/",
      name: I,
      component: k,
      children: [
        { path: "app/:moduleId(.*)*", name: "AppGateway", component: D(n, "layout.app-container") }
      ]
    },
    ...i.routes ?? []
  ], w = re({ history: ie(i.router?.base), routes: H });
  w.beforeEach((p, f, u) => {
    const y = localStorage.getItem(d);
    if (!p.meta.public && !y) return u(h);
    u();
  });
  const _ = { app: e, router: w, pinia: t, superApp: n, discovery: s, api: S, socket: a };
  if (await i.modules?.(_), n.state.discovery = s.getAll(), n.init({
    app: e,
    router: w,
    config: { moduleManifest: { ...i.manifest ?? {}, ...s.getAll() }, branding: i.branding },
    theme: i.tokens,
    toast: r.toastService,
    message: r.messageService,
    dialog: r.dialogService
  }), i.branding) {
    const { name: p, icon: f, logo: u } = i.branding;
    p && (document.title = p);
    const y = f || u;
    if (y) {
      const P = document.querySelector('link[rel~="icon"]') ?? Object.assign(document.createElement("link"), { rel: "icon" });
      P.href = y, P.parentNode || document.head.appendChild(P);
    }
  }
  const v = r.appState ?? fe(), M = s.get("system.workspaces");
  M && (v.workspaces = M), n.$appState = v, e.config.globalProperties.$appState = v;
  for (const p of i.features ?? []) {
    const f = {
      ..._,
      featureId: p.id,
      registerRoute: (u) => w.addRoute(I, u),
      registerTopRoute: (u) => w.addRoute(u),
      registerComponent: (u) => n.registerComponent(u),
      registerSkill: (u) => n.registerSkill(u),
      registerCommand: (u) => n.registerCommand(u),
      registerMessages: (u, y) => c.addMessages(u, y),
      provide: (u, y) => e.provide(u, y)
    };
    await p.install(f), console.log(`🧩 [sapp] Shell feature installed: ${p.id}`);
  }
  const m = e.config.globalProperties;
  return m.$c = (p) => n.getComponent(p), m.$s = n, m.$superApp = n, m.$toast = r.toastService, m.$message = r.messageService, m.$dialog = r.dialogService, m.$i18n = c, m.$t = (p, f) => c.t(p, f), e.provide("$i18n", c), e.provide("ui-store", l), e.provide("$theme", i.tokens), e.provide("$superApp", n), e.provide("$s", n), e.provide("$message", r.messageService), e.provide("$toast", r.toastService), {
    ..._,
    mount(p = "#app") {
      return e.use(w), e.mount(p), e;
    }
  };
}
export {
  de as A,
  ye as B,
  ge as D,
  pe as S,
  ue as a,
  fe as b,
  Te as c,
  we as d,
  me as e,
  Re as g,
  Ae as i
};
//# sourceMappingURL=createSapp-0ra0KLeL.js.map
