import * as Z from "vue";
import { reactive as p, inject as ee, provide as te, h as q, defineComponent as V, onUnmounted as re, onMounted as se, triggerRef as oe, shallowRef as ne, defineAsyncComponent as C, markRaw as v, nextTick as ie, watchEffect as ae, watch as G, computed as ce, ref as le, createApp as ue } from "vue";
import * as de from "pinia";
import { createPinia as fe } from "pinia";
import * as ge from "vue-router";
import { RouterView as me, createRouter as pe, createWebHistory as he } from "vue-router";
import * as ye from "@vueuse/core";
import { useLocalStorage as z } from "@vueuse/core";
import { S as b, R as _, H as U, A as Se, a as I, f as H, b as we, c as L, E as w, M as K } from "./format-BUIIBrkU.js";
import N from "axios";
function ke() {
  const o = p({
    user: null,
    realmRoles: [],
    clientRoles: {},
    provider: null
  });
  function e() {
    return [.../* @__PURE__ */ new Set([...o.realmRoles, ...Object.values(o.clientRoles).flat()])];
  }
  const t = (s) => s.toLowerCase(), r = () => new Set(e().map(t));
  return p({
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
    hasRole(s, i) {
      return i !== void 0 ? (o.clientRoles[i] ?? []).some((n) => t(n) === t(s)) : r().has(t(s));
    },
    hasAnyRole(...s) {
      const i = r();
      return s.some((n) => i.has(t(n)));
    },
    set(s) {
      const i = s.user.role ? [s.user.role] : [];
      o.realmRoles = [...s.realmRoles ?? i], o.clientRoles = Object.fromEntries(
        Object.entries(s.clientRoles ?? {}).map(([n, a]) => [n, [...a]])
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
      const { roles: i, realmRoles: n, clientRoles: a, ...c } = s;
      o.user = { ...o.user, ...c };
    },
    clear() {
      o.user = null, o.realmRoles = [], o.clientRoles = {}, o.provider = null;
    }
  });
}
const B = {};
class Ae {
  modules = /* @__PURE__ */ new Map();
  components = /* @__PURE__ */ new Map();
  // 🛰️ ESA v5: Reactive Registries
  _protocols = p(/* @__PURE__ */ new Map());
  _modules = p(/* @__PURE__ */ new Map());
  // 🧠 ESA v5: Event Bus (Central Nervous System)
  _eventHandlers = /* @__PURE__ */ new Map();
  // ⚡ Reactive state for UI elements (Navigation, Command Palette)
  state = p({
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
            const i = t._modules.get(s);
            return i.isEnabled === !1 ? (console.warn(`🛡️ [sys-kernel] Access denied: Module $${s} is currently DISABLED.`), null) : i;
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
    const i = e.id ?? e.name ?? "anonymous";
    return console.log(`🔌 [sys-kernel] Installing module: ${i}`), s.length >= 2 ? await s.call(e, this.$app, r, ...t) : await s.call(e, r, ...t), r;
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
    reactive: p,
    computed: ce,
    watch: G,
    watchEffect: ae,
    nextTick: ie,
    markRaw: v,
    defineAsyncComponent: C,
    shallowRef: ne,
    triggerRef: oe,
    onMounted: se,
    onUnmounted: re,
    defineComponent: V,
    h: q,
    provide: te,
    inject: ee,
    useLocalStorage: z
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
  resolveAppEntry = (e) => e.type === "package" ? this.packageEntryUrl(e.id) : this.formatAppEntryUrl(e.url);
  getDefaultApps = () => {
    const e = (this.state.discovery?.["admin.url"] || B?.VITE_ADMIN_URL || "http://localhost:4403").replace(/\/+$/, ""), t = (this.state.discovery?.["workspace.url"] || B?.VITE_WORKSPACE_URL || "http://localhost:4409").replace(/\/+$/, "");
    return [
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
    ];
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
      const s = this.getHiddenDefaults();
      return t.forEach((i) => {
        const n = r.find((a) => a.id === i.id);
        n ? (n.isSystem = !0, n.entryUrl || (n.entryUrl = this.formatAppEntryUrl(n.url))) : s.has(i.id) || r.unshift(i);
      }), r.forEach((i) => {
        i.type === "package" && (i.url = this.getApiBaseUrl(), i.entryUrl = this.packageEntryUrl(i.id));
      }), r;
    } catch (e) {
      return console.error("Failed to read registered apps from storage:", e), this.getDefaultApps();
    }
  };
  syncManifestWithRegisteredApps = () => {
    const e = this.$config;
    if (!e) return;
    const t = e.moduleManifest ??= {};
    for (const [s, i] of Object.entries(this.state.discovery || {})) {
      if (!s.endsWith(".url") || typeof i != "string" || !i) continue;
      const n = s.slice(0, -4);
      n && !t[n] && (t[n] = this.formatAppEntryUrl(i));
    }
    this.getRegisteredApps().forEach((s) => {
      if (s.id && (s.url || s.type === "package") && s.isEnabled !== !1) {
        const i = s.type === "package" ? this.packageEntryUrl(s.id) : s.entryUrl || this.formatAppEntryUrl(s.url);
        t[s.id] = i, s.id === "workspace" && (t.expose = i);
      }
    });
  };
  registerApp = (e) => {
    const t = this.normalizeAppId(e.id);
    if (!t) throw new Error("Application ID is required");
    const r = e.type === "package" ? "package" : "remote";
    if (r === "remote" && !e.url) throw new Error("Application Remote URL is required");
    const s = this.getRegisteredApps(), i = r === "package" ? this.getApiBaseUrl() : e.url.trim().replace(/\/+$/, ""), n = this.resolveAppEntry({ id: t, url: i, type: r }), a = s.findIndex((l) => l.id === t), c = {
      id: t,
      name: e.name || t,
      type: r,
      ...r === "package" && e.package ? { package: e.package } : {},
      url: i,
      entryUrl: n,
      description: e.description || "",
      icon: e.icon || "Layers",
      isEnabled: e.isEnabled ?? !0,
      isSystem: a >= 0 ? !!s[a].isSystem : !1,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return a >= 0 ? s[a] = { ...s[a], ...c } : s.push(c), localStorage.setItem(_, JSON.stringify(s)), this.syncManifestWithRegisteredApps(), this.emit(b.APPS_UPDATED, s), c;
  };
  getHiddenDefaults = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem(U) || "[]"));
    } catch {
      return /* @__PURE__ */ new Set();
    }
  };
  normalizeAppId = (e) => (e || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/^-+|-+$/g, "");
  updateApp = (e, t) => {
    const r = this.getRegisteredApps(), s = r.findIndex((l) => l.id === e);
    if (s === -1) throw new Error(`App [${e}] not found`);
    const i = r[s], n = { ...t };
    n.url && (n.url = n.url.trim().replace(/\/+$/, ""));
    const a = n.id !== void 0 ? this.normalizeAppId(n.id) : e;
    if (n.id !== void 0 && !a) throw new Error("Application ID is required");
    if (a !== e) {
      if (r.some((l) => l.id === a)) throw new Error(`App [${a}] already exists`);
      if (this.$config?.moduleManifest && delete this.$config.moduleManifest[e], i.isSystem) {
        const l = this.getHiddenDefaults();
        l.add(e), localStorage.setItem(U, JSON.stringify([...l]));
      }
      this.state.installedModules.delete(e), console.log(`🔁 [sys-kernel] App renamed: ${e} -> ${a}`);
    }
    n.id = a;
    const c = { ...i, ...n, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    if (c.type === "package")
      c.url = this.getApiBaseUrl();
    else if (delete c.package, !c.url) throw new Error("Application Remote URL is required");
    return c.entryUrl = this.resolveAppEntry(c), r[s] = c, localStorage.setItem(_, JSON.stringify(r)), this.syncManifestWithRegisteredApps(), this.emit(b.APPS_UPDATED, r), r[s];
  };
  deleteApp = (e) => {
    const t = this.getRegisteredApps(), r = t.find((i) => i.id === e);
    if (!r) return !1;
    if (r.isSystem)
      throw new Error(`System application [${e}] cannot be removed.`);
    const s = t.filter((i) => i.id !== e);
    return localStorage.setItem(_, JSON.stringify(s)), this.$config?.moduleManifest && delete this.$config.moduleManifest[e], this.emit(b.APPS_UPDATED, s), !0;
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
        const n = (await import(
          /* @vite-ignore */
          s
        )).default;
        if (n?.install) {
          console.log(`🛠️ [sys-kernel] Installing remote [${e}]...`);
          const a = this.getRegisteredApps().find((c) => c.id === e) ?? null;
          await this.install(n, { moduleId: e, basePath: `/app/${e}`, app: a }), this.markModuleInstalled(e), console.log(`✅ [sys-kernel] Remote [${e}] installed successfully.`);
        }
      } catch (i) {
        throw console.error(`🚨 [sys-kernel] Failed to load remote [${e}] from ${s}`, i), i;
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
  getModuleState = (e, t = {}) => (this.state.moduleStates[e] || (this.state.moduleStates[e] = p(t)), this.state.moduleStates[e]);
  /**
   * 🗺️ [sys-kernel] MFE Entry Registration
   */
  registerModuleEntry = (e) => {
    const t = this.getComponent(e.entryComponentId);
    t ? (this.modules.set(e.moduleId, t), console.log(`📡 [sys-kernel] Module entry registered: ${e.moduleId} -> ${e.entryComponentId}`)) : console.error(`🚨 [sys-kernel] Failed to register entry for ${e.moduleId}: Component ${e.entryComponentId} not found.`);
  };
  getModuleEntry = (e) => {
    const t = this.modules.get(e);
    return typeof t == "function" ? v(C(t)) : t ? v(t) : null;
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
    return typeof t == "function" ? r = v(C(t)) : r = v(t), this.componentCache.set(e, r), r;
  };
  skills = p([]);
  commands = p([]);
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
    const e = localStorage.getItem(Se), t = this.superApp?.$appState?.current_workspace || localStorage.getItem(I), r = `req-${Date.now()}-${Math.floor(Math.random() * 1e4)}`, s = {
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
        const s = await r.json().catch(() => ({ message: "System error" })), i = {
          message: s.error || s.message || `Request failed with status ${r.status}`,
          status: r.status,
          path: e
        };
        throw this.superApp?.emit(b.SYSTEM_ERROR, i), new Error(i.message);
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
    const r = await this.request(`${H.ENDPOINTS.SUPERAPP_CALL}/${e}`, {
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
        const t = JSON.parse(e.data), { type: r, data: s, id: i } = t;
        if (r === "ACTION_RESPONSE" && i && this.actionCallbacks.has(i)) {
          const { resolve: n } = this.actionCallbacks.get(i);
          this.actionCallbacks.delete(i), n(s);
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
    const r = (s, i) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        i(new Error("Socket unexpectedly unavailable"));
        return;
      }
      const n = Math.random().toString(36).substring(7);
      this.actionCallbacks.set(n, { resolve: s, reject: i });
      const a = { type: "ACTION", id: n, action: e, data: t };
      this.socket.send(JSON.stringify(a)), setTimeout(() => {
        this.actionCallbacks.has(n) && (this.actionCallbacks.delete(n), i(new Error(`📡 [SocketProtocol] Action "${e}" timed out.`)));
      }, 3e4);
    };
    return new Promise((s, i) => {
      this.socket?.readyState === WebSocket.OPEN ? r(s, i) : (console.log(`📡 [SocketProtocol] Action "${e}" queued (Socket connecting...)`), this.actionQueue.push(() => r(s, i)));
    });
  }
  on(e, t) {
    const r = this.handlers.get(e) || [];
    r.push(t), this.handlers.set(e, r);
  }
}
const be = { BASE_URL: "/", DEV: !1, MODE: "production", PROD: !0, SSR: !1 };
class ve {
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
      const s = r.master_api_url || be?.VITE_MASTER_API_URL || "";
      s || console.warn("🛰️ [Discovery] No master_api_url found in config.json or environment. API discovery skipped.");
      const i = s ? await fetch(`${s}${H.ENDPOINTS.DISCOVERY}`).catch(() => null) : null;
      let n = {};
      if (i && i.ok) {
        const a = i.headers.get("content-type");
        if (a && a.includes("application/json"))
          try {
            n = await i.json(), console.log("🛰️ [Discovery] Dynamic API discovery config loaded.");
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
const _e = new ve(), Re = () => {
  const o = z(we, {
    current_app: "workspace",
    current_workspace: null
  });
  return (typeof o.value != "object" || o.value === null) && (console.warn("⚠️ [AppState] Invalid storage detected, resetting to defaults."), o.value = {
    current_app: "workspace",
    current_workspace: null
  }), p({
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
}, Pe = 3e4, O = "x-request-id";
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
    requestId: o.config?.headers?.get?.(O)?.toString(),
    cause: o
  };
}
function Ce(o) {
  return function(t) {
    const { baseURL: r, headers: s, withToken: i = !0, workspace: n = !1, onError: a, setup: c, ...l } = t;
    if (!r)
      throw new Error("[createApi] `baseURL` is required — read it from env (e.g. import.meta.env.VITE_API_URL).");
    const u = N.create({
      timeout: Pe,
      ...l,
      baseURL: r,
      headers: { Accept: "application/json", ...s }
    });
    return u.interceptors.request.use((d) => {
      if (d.headers.has(O) || d.headers.set(O, Te()), i) {
        const f = localStorage.getItem(o.tokenKey);
        f && !d.headers.has("Authorization") && d.headers.set("Authorization", `Bearer ${f}`);
      }
      if (n) {
        const f = o.appState?.()?.current_workspace;
        f && d.headers.set("x-workspace-id", String(f));
      }
      return d;
    }), u.interceptors.response.use(
      (d) => d,
      (d) => {
        if (N.isCancel(d))
          return Promise.reject(d);
        const f = Me(d);
        return a ? a(f) : o.message?.error(f.message), Promise.reject(f);
      }
    ), c?.(u), u;
  };
}
const Ie = {
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
  for (const [r, s] of Object.entries(o)) {
    const i = e ? `${e}.${r}` : r;
    s && typeof s == "object" ? Y(s, i, t) : t[i] = String(s);
  }
  return t;
}, Oe = (o, e) => e ? o.replace(/\{(\w+)\}/g, (t, r) => e[r] === void 0 || e[r] === null ? t : String(e[r])) : o, De = (o, e) => {
  if (e?.count === void 0 || e.count === null || !o.includes("|")) return o;
  const t = Number(e.count);
  if (!Number.isFinite(t)) return o;
  const r = o.split("|").map((s) => s.trim());
  return r.length === 2 ? t === 1 ? r[0] : r[1] : r.length >= 3 ? t === 0 ? r[0] : t === 1 ? r[1] : r[2] : r[0];
};
function Ue(o = {}) {
  const e = o.fallbackLocale ?? "en", t = o.persist ?? !0, r = t ? (() => {
    try {
      return localStorage.getItem(L);
    } catch {
      return null;
    }
  })() : null, s = p({ locale: r || o.locale || e, messages: {} }), i = /* @__PURE__ */ new Set(), n = (u, d, f) => {
    const E = Y(d, f || "");
    s.messages[u] = { ...s.messages[u] ?? {}, ...E };
  }, a = (u, d) => {
    for (const [f, E] of Object.entries(u)) n(f, E, d);
  };
  a(Ie), o.messages && a(o.messages);
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
      const f = c(u, s.locale) ?? c(u, e) ?? d?.default ?? u;
      return Oe(De(f, d), d);
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
      document.documentElement.setAttribute("lang", u), i.forEach((f) => f(u, d));
    },
    addMessages: a,
    addLocaleMessages: n,
    getMessages(u = s.locale, d = !0) {
      return d ? { ...s.messages[e] ?? {}, ...s.messages[u] ?? {} } : { ...s.messages[u] ?? {} };
    },
    onLocaleChange(u) {
      return i.add(u), () => i.delete(u);
    }
  };
  return typeof document < "u" && document.documentElement.setAttribute("lang", s.locale), G(() => s.locale, () => {
  }), l;
}
function k(o) {
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
  const s = e.registry ?? Be(), i = {
    get locale() {
      return o() || t;
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
      const c = a ?? r, l = k(i.locale);
      return A(`money:${l}:${c}`, () => new Intl.NumberFormat(l, {
        style: "currency",
        currency: c,
        maximumFractionDigits: 0
      })).format(n);
    },
    formatNumber(n, a = 0) {
      if (n == null || !Number.isFinite(n))
        return w;
      const c = k(i.locale);
      return A(`number:${c}:${a}`, () => new Intl.NumberFormat(c, {
        maximumFractionDigits: a
      })).format(n);
    },
    formatPercent(n, a = 1) {
      if (n == null || !Number.isFinite(n))
        return w;
      const c = k(i.locale);
      return A(`percent:${c}:${a}`, () => new Intl.NumberFormat(c, {
        style: "percent",
        maximumFractionDigits: a
      })).format(n);
    },
    formatDate(n) {
      const a = R(n);
      if (!a)
        return w;
      const c = k(i.locale);
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
      const c = k(i.locale);
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
      const c = k(i.locale);
      return A(`time:${c}`, () => new Intl.DateTimeFormat(c, {
        hour: "2-digit",
        minute: "2-digit"
      })).format(a);
    },
    formatRelative(n) {
      const a = R(n);
      if (!a)
        return w;
      const c = k(i.locale), l = A(`relative:${c}`, () => new Intl.RelativeTimeFormat(c, {
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
      for (; c >= 1024 && l < x.length - 1; )
        c = c / 1024, l = l + 1;
      const u = n < 0 ? "-" : "", d = l === 0 ? 0 : a;
      return `${u}${i.formatNumber(c, d)} ${x[l]}`;
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
  return new Proxy(i, {
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
  xe({ Vue: Z, Pinia: de, VueRouter: ge, VueUse: ye });
  const e = ue(o.root), t = fe();
  e.use(t);
  const r = o.discovery ?? _e;
  await r.initialize();
  const s = o.api?.baseUrl ?? qe(r.get("master_api_url"));
  console.log("💉 [sapp] apiBase:", s);
  const i = new Ae();
  i.$app = e, window.$superApp = i;
  const n = o.theme.register(e, i), a = n.uiStore, c = Ue(o.i18n), l = je(c, { currency: o.currency });
  i.registerProtocol("i18n", c), c.onLocaleChange((m, y) => i.emit("i18n:locale-changed", { locale: m, previous: y }));
  const u = new Ee(s), d = new $e(o.socket?.url ?? Ve());
  d.connect(), i.registerProtocol("api", u), i.registerProtocol("socket", d), u.bind(i);
  const f = o.auth?.tokenKey ?? "accessToken";
  i.createApi = Ce({
    tokenKey: f,
    message: n.messageService,
    appState: () => i.$appState
  });
  const E = o.auth?.loginPath ?? "/login", Q = o.layout ?? V({ name: "SappLayout", setup: () => () => q(me) }), X = [
    { path: E, name: "Login", component: W(i, o.auth?.loginComponentId ?? "auth.login"), meta: { public: !0 } },
    {
      path: "/",
      name: F,
      component: Q,
      children: [
        { path: "app/:moduleId(.*)*", name: "AppGateway", component: W(i, "layout.app-container") }
      ]
    },
    ...o.routes ?? []
  ], $ = pe({ history: he(o.router?.base), routes: X });
  $.beforeEach((m, y, g) => {
    const S = localStorage.getItem(f);
    if (!m.meta.public && !S) return g(E);
    g();
  });
  const P = { app: e, router: $, pinia: t, superApp: i, discovery: r, api: u, socket: d };
  if (await o.modules?.(P), i.state.discovery = r.getAll(), i.init({
    app: e,
    router: $,
    config: { moduleManifest: { ...o.manifest ?? {}, ...r.getAll() }, branding: o.branding },
    theme: o.tokens,
    message: n.messageService,
    dialog: n.dialogService
  }), o.branding) {
    const { name: m, icon: y, logo: g } = o.branding;
    m && (document.title = m);
    const S = y || g;
    if (S) {
      const M = document.querySelector('link[rel~="icon"]') ?? Object.assign(document.createElement("link"), { rel: "icon" });
      M.href = S, M.parentNode || document.head.appendChild(M);
    }
  }
  const T = n.appState ?? Re(), D = r.get("system.workspaces");
  D && (T.workspaces = D), i.$appState = T, e.config.globalProperties.$appState = T, e.config.globalProperties.$auth = i.$authState, e.provide("$auth", i.$authState);
  for (const m of o.features ?? []) {
    const y = {
      ...P,
      featureId: m.id,
      registerRoute: (g) => $.addRoute(F, g),
      registerTopRoute: (g) => $.addRoute(g),
      registerComponent: (g) => i.registerComponent(g),
      registerSkill: (g) => i.registerSkill(g),
      registerCommand: (g) => i.registerCommand(g),
      registerMessages: (g, S) => c.addMessages(g, S),
      provide: (g, S) => e.provide(g, S)
    };
    await m.install(y), console.log(`🧩 [sapp] Shell feature installed: ${m.id}`);
  }
  const h = e.config.globalProperties;
  return h.$c = (m) => i.getComponent(m), h.$s = i, h.$superApp = i, h.$message = n.messageService, h.$dialog = n.dialogService, h.$i18n = c, h.$t = (m, y) => c.t(m, y), h.$f = l, i.$f = l, e.provide("$i18n", c), e.provide("$f", l), e.provide("ui-store", a), e.provide("$theme", o.tokens), e.provide("$superApp", i), e.provide("$s", i), e.provide("$message", n.messageService), e.provide("$dialog", n.dialogService), {
    ...P,
    mount(m = "#app") {
      return e.use($), e.mount(m), e;
    }
  };
}
export {
  Ee as A,
  Ie as B,
  ve as D,
  $e as S,
  Ae as a,
  Ce as b,
  Xe as c,
  Re as d,
  ke as e,
  J as f,
  je as g,
  Ue as h,
  _e as i,
  Qe as j,
  xe as k
};
//# sourceMappingURL=createSapp-Cbgy3vEd.js.map
