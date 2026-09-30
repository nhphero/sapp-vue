import * as Z from "vue";
import { reactive as g, inject as ee, provide as te, h as V, defineComponent as q, onUnmounted as re, onMounted as se, triggerRef as oe, shallowRef as ne, defineAsyncComponent as C, markRaw as v, nextTick as ie, watchEffect as ae, watch as G, computed as ce, ref as le, createApp as ue } from "vue";
import * as de from "pinia";
import { createPinia as fe } from "pinia";
import * as me from "vue-router";
import { RouterView as pe, createRouter as ge, createWebHistory as he } from "vue-router";
import * as ye from "@vueuse/core";
import { useLocalStorage as z } from "@vueuse/core";
import { S as b, R as _, H as N, A as Se, a as I, f as H, b as we, c as L, E as w, M as K } from "./format-BUIIBrkU.js";
import U from "axios";
function $e() {
  const n = g({
    user: null,
    realmRoles: [],
    clientRoles: {},
    provider: null
  });
  function e() {
    return [.../* @__PURE__ */ new Set([...n.realmRoles, ...Object.values(n.clientRoles).flat()])];
  }
  const t = (s) => s.toLowerCase(), r = () => new Set(e().map(t));
  return g({
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
    hasRole(s, i) {
      return i !== void 0 ? (n.clientRoles[i] ?? []).some((o) => t(o) === t(s)) : r().has(t(s));
    },
    hasAnyRole(...s) {
      const i = r();
      return s.some((o) => i.has(t(o)));
    },
    set(s) {
      const i = s.user.role ? [s.user.role] : [];
      n.realmRoles = [...s.realmRoles ?? i], n.clientRoles = Object.fromEntries(
        Object.entries(s.clientRoles ?? {}).map(([o, a]) => [o, [...a]])
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
      const { roles: i, realmRoles: o, clientRoles: a, ...c } = s;
      n.user = { ...n.user, ...c };
    },
    clear() {
      n.user = null, n.realmRoles = [], n.clientRoles = {}, n.provider = null;
    }
  });
}
const j = {};
class Ae {
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
  $message = null;
  $dialog = null;
  $api = null;
  $appState = null;
  $authState = $e();
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
    reactive: g,
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
    defineComponent: q,
    h: V,
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
  getDefaultApps = () => {
    const e = (this.state.discovery?.["admin.url"] || j?.VITE_ADMIN_URL || "http://localhost:4403").replace(/\/+$/, ""), t = (this.state.discovery?.["workspace.url"] || j?.VITE_WORKSPACE_URL || "http://localhost:4409").replace(/\/+$/, "");
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
   * `[{ id, name, description?, icon? }]`, each mounted from its `<id>.url` entry. They join the
   * defaults, so a new mini app is listed by configuration — no code change, no per-browser setup.
   */
  getConfiguredApps = () => {
    const e = this.state.discovery?.["registry.apps"];
    return Array.isArray(e) ? e.filter((t) => t?.id && typeof this.state.discovery?.[`${t.id}.url`] == "string").map((t) => {
      const r = String(this.state.discovery[`${t.id}.url`]).replace(/\/+$/, "");
      return {
        id: String(t.id),
        name: t.name || String(t.id),
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
        const o = r.find((a) => a.id === i.id);
        o ? (o.isSystem = !0, o.entryUrl || (o.entryUrl = this.formatAppEntryUrl(o.url))) : s.has(i.id) || r.unshift(i);
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
      const o = s.slice(0, -4);
      o && !t[o] && (t[o] = this.formatAppEntryUrl(i));
    }
    this.getRegisteredApps().forEach((s) => {
      if (s.id && s.url && s.isEnabled !== !1) {
        const i = s.entryUrl || this.formatAppEntryUrl(s.url);
        t[s.id] = i, s.id === "workspace" && (t.expose = i);
      }
    });
  };
  registerApp = (e) => {
    const t = this.normalizeAppId(e.id);
    if (!t) throw new Error("Application ID is required");
    if (!e.url) throw new Error("Application Remote URL is required");
    const r = this.getRegisteredApps(), s = this.formatAppEntryUrl(e.url), i = r.findIndex((a) => a.id === t), o = {
      id: t,
      name: e.name || t,
      url: e.url.trim().replace(/\/+$/, ""),
      entryUrl: s,
      description: e.description || "",
      icon: e.icon || "Layers",
      isEnabled: e.isEnabled ?? !0,
      isSystem: i >= 0 ? !!r[i].isSystem : !1,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return i >= 0 ? r[i] = { ...r[i], ...o } : r.push(o), localStorage.setItem(_, JSON.stringify(r)), this.syncManifestWithRegisteredApps(), this.emit(b.APPS_UPDATED, r), o;
  };
  getHiddenDefaults = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem(N) || "[]"));
    } catch {
      return /* @__PURE__ */ new Set();
    }
  };
  normalizeAppId = (e) => (e || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/^-+|-+$/g, "");
  updateApp = (e, t) => {
    const r = this.getRegisteredApps(), s = r.findIndex((c) => c.id === e);
    if (s === -1) throw new Error(`App [${e}] not found`);
    const i = r[s], o = { ...t };
    o.url && (o.url = o.url.trim().replace(/\/+$/, ""), o.entryUrl = this.formatAppEntryUrl(o.url));
    const a = o.id !== void 0 ? this.normalizeAppId(o.id) : e;
    if (o.id !== void 0 && !a) throw new Error("Application ID is required");
    if (a !== e) {
      if (r.some((c) => c.id === a)) throw new Error(`App [${a}] already exists`);
      if (this.$config?.moduleManifest && delete this.$config.moduleManifest[e], i.isSystem) {
        const c = this.getHiddenDefaults();
        c.add(e), localStorage.setItem(N, JSON.stringify([...c]));
      }
      this.state.installedModules.delete(e), console.log(`🔁 [sys-kernel] App renamed: ${e} -> ${a}`);
    }
    return o.id = a, r[s] = { ...i, ...o, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }, localStorage.setItem(_, JSON.stringify(r)), this.syncManifestWithRegisteredApps(), this.emit(b.APPS_UPDATED, r), r[s];
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
        const o = this.getRegisteredApps().find((a) => a.id === e);
        o && o.url && (s = o.entryUrl || this.formatAppEntryUrl(o.url), this.$config && (this.$config.moduleManifest || (this.$config.moduleManifest = {}), this.$config.moduleManifest[e] = s));
      }
      if (!s) {
        console.warn(`⚠️ [sys-kernel] No URL manifest found for [${e}].`);
        return;
      }
      try {
        console.log(`🔌 [sys-kernel] Connecting to remote module [${e}] at ${s}`);
        const o = (await import(
          /* @vite-ignore */
          s
        )).default;
        if (o?.install) {
          console.log(`🛠️ [sys-kernel] Installing remote [${e}]...`);
          const a = this.getRegisteredApps().find((c) => c.id === e) ?? null;
          await this.install(o, { moduleId: e, basePath: `/app/${e}`, app: a }), this.markModuleInstalled(e), console.log(`✅ [sys-kernel] Remote [${e}] installed successfully.`);
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
  getModuleState = (e, t = {}) => (this.state.moduleStates[e] || (this.state.moduleStates[e] = g(t)), this.state.moduleStates[e]);
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
class ke {
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
          const { resolve: o } = this.actionCallbacks.get(i);
          this.actionCallbacks.delete(i), o(s);
          return;
        }
        if (r === "EVENT" && t.event) {
          this.handlers.has(t.event) && this.handlers.get(t.event)?.forEach((o) => o(t.data));
          return;
        }
        this.handlers.has(r) && this.handlers.get(r)?.forEach((o) => o(s));
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
      const o = Math.random().toString(36).substring(7);
      this.actionCallbacks.set(o, { resolve: s, reject: i });
      const a = { type: "ACTION", id: o, action: e, data: t };
      this.socket.send(JSON.stringify(a)), setTimeout(() => {
        this.actionCallbacks.has(o) && (this.actionCallbacks.delete(o), i(new Error(`📡 [SocketProtocol] Action "${e}" timed out.`)));
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
      let o = {};
      if (i && i.ok) {
        const a = i.headers.get("content-type");
        if (a && a.includes("application/json"))
          try {
            o = await i.json(), console.log("🛰️ [Discovery] Dynamic API discovery config loaded.");
          } catch {
            console.warn("🛰️ [Discovery] API returned invalid JSON");
          }
      }
      this.config = { ...o, ...r }, this.initialized = !0, e && (e.state.discovery = { ...this.config }), console.log("🛰️ [Discovery] Total variables loaded:", Object.keys(this.config).length);
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
  const n = z(we, {
    current_app: "workspace",
    current_workspace: null
  });
  return (typeof n.value != "object" || n.value === null) && (console.warn("⚠️ [AppState] Invalid storage detected, resetting to defaults."), n.value = {
    current_app: "workspace",
    current_workspace: null
  }), g({
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
}, Pe = 3e4, O = "x-request-id";
function Te() {
  if (typeof crypto.randomUUID == "function")
    return crypto.randomUUID();
  const n = crypto.getRandomValues(new Uint8Array(16));
  n[6] = n[6] & 15 | 64, n[8] = n[8] & 63 | 128;
  const e = Array.from(n, (t) => t.toString(16).padStart(2, "0")).join("");
  return `${e.slice(0, 8)}-${e.slice(8, 12)}-${e.slice(12, 16)}-${e.slice(16, 20)}-${e.slice(20)}`;
}
function Me(n) {
  const e = n.response?.data, t = e && typeof e == "object" ? e.message || e.error_description || (typeof e.error == "string" ? e.error : void 0) : void 0;
  return {
    status: n.response?.status ?? null,
    message: t || n.message || "Request failed",
    code: e && typeof e == "object" && (e.code || (typeof e.error == "string" ? e.error : void 0)) || n.code,
    data: e,
    url: n.config?.url,
    method: n.config?.method?.toUpperCase(),
    requestId: n.config?.headers?.get?.(O)?.toString(),
    cause: n
  };
}
function Ce(n) {
  return function(t) {
    const { baseURL: r, headers: s, withToken: i = !0, workspace: o = !1, onError: a, setup: c, ...d } = t;
    if (!r)
      throw new Error("[createApi] `baseURL` is required — read it from env (e.g. import.meta.env.VITE_API_URL).");
    const l = U.create({
      timeout: Pe,
      ...d,
      baseURL: r,
      headers: { Accept: "application/json", ...s }
    });
    return l.interceptors.request.use((u) => {
      if (u.headers.has(O) || u.headers.set(O, Te()), i) {
        const f = localStorage.getItem(n.tokenKey);
        f && !u.headers.has("Authorization") && u.headers.set("Authorization", `Bearer ${f}`);
      }
      if (o) {
        const f = n.appState?.()?.current_workspace;
        f && u.headers.set("x-workspace-id", String(f));
      }
      return u;
    }), l.interceptors.response.use(
      (u) => u,
      (u) => {
        if (U.isCancel(u))
          return Promise.reject(u);
        const f = Me(u);
        return a ? a(f) : n.message?.error(f.message), Promise.reject(f);
      }
    ), c?.(l), l;
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
}, Y = (n, e = "", t = {}) => {
  for (const [r, s] of Object.entries(n)) {
    const i = e ? `${e}.${r}` : r;
    s && typeof s == "object" ? Y(s, i, t) : t[i] = String(s);
  }
  return t;
}, Oe = (n, e) => e ? n.replace(/\{(\w+)\}/g, (t, r) => e[r] === void 0 || e[r] === null ? t : String(e[r])) : n, De = (n, e) => {
  if (e?.count === void 0 || e.count === null || !n.includes("|")) return n;
  const t = Number(e.count);
  if (!Number.isFinite(t)) return n;
  const r = n.split("|").map((s) => s.trim());
  return r.length === 2 ? t === 1 ? r[0] : r[1] : r.length >= 3 ? t === 0 ? r[0] : t === 1 ? r[1] : r[2] : r[0];
};
function Ne(n = {}) {
  const e = n.fallbackLocale ?? "en", t = n.persist ?? !0, r = t ? (() => {
    try {
      return localStorage.getItem(L);
    } catch {
      return null;
    }
  })() : null, s = g({ locale: r || n.locale || e, messages: {} }), i = /* @__PURE__ */ new Set(), o = (l, u, f) => {
    const E = Y(u, f || "");
    s.messages[l] = { ...s.messages[l] ?? {}, ...E };
  }, a = (l, u) => {
    for (const [f, E] of Object.entries(l)) o(f, E, u);
  };
  a(Ie), n.messages && a(n.messages);
  const c = (l, u) => s.messages[u]?.[l], d = {
    get locale() {
      return s.locale;
    },
    set locale(l) {
      d.setLocale(l);
    },
    fallbackLocale: e,
    get availableLocales() {
      return Object.keys(s.messages);
    },
    t(l, u) {
      const f = c(l, s.locale) ?? c(l, e) ?? u?.default ?? l;
      return Oe(De(f, u), u);
    },
    te(l, u) {
      return c(l, u ?? s.locale) !== void 0 || !u && c(l, e) !== void 0;
    },
    setLocale(l) {
      if (!l || l === s.locale) return;
      const u = s.locale;
      if (s.locale = l, t)
        try {
          localStorage.setItem(L, l);
        } catch {
        }
      document.documentElement.setAttribute("lang", l), i.forEach((f) => f(l, u));
    },
    addMessages: a,
    addLocaleMessages: o,
    getMessages(l = s.locale, u = !0) {
      return u ? { ...s.messages[e] ?? {}, ...s.messages[l] ?? {} } : { ...s.messages[l] ?? {} };
    },
    onLocaleChange(l) {
      return i.add(l), () => i.delete(l);
    }
  };
  return typeof document < "u" && document.documentElement.setAttribute("lang", s.locale), G(() => s.locale, () => {
  }), d;
}
function $(n) {
  return n === "vi" ? "vi-VN" : n === "en" ? "en-US" : n;
}
const B = /* @__PURE__ */ new Map();
function A(n, e) {
  const t = B.get(n);
  if (t)
    return t;
  const r = e();
  return B.set(n, r), r;
}
function R(n) {
  if (n == null || n === "")
    return null;
  const e = n instanceof Date ? n : new Date(n);
  return Number.isNaN(e.getTime()) ? null : e;
}
const Le = [
  { unit: "year", ms: 365 * 864e5 },
  { unit: "month", ms: 30 * 864e5 },
  { unit: "day", ms: 864e5 },
  { unit: "hour", ms: 36e5 },
  { unit: "minute", ms: 6e4 },
  { unit: "second", ms: 1e3 }
], x = ["B", "KB", "MB", "GB", "TB", "PB"], Ue = /* @__PURE__ */ new Set([
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
function je() {
  return { groups: /* @__PURE__ */ new Map(), owners: /* @__PURE__ */ new Map() };
}
function J(n, e = {}) {
  const t = e.fallbackLocale ?? "vi";
  let r = e.currency ?? "VND";
  const s = e.registry ?? je(), i = {
    get locale() {
      return n() || t;
    },
    get currency() {
      return r;
    },
    set currency(o) {
      r = o;
    },
    formatMoney(o, a) {
      if (o == null || !Number.isFinite(o))
        return w;
      const c = a ?? r, d = $(i.locale);
      return A(`money:${d}:${c}`, () => new Intl.NumberFormat(d, {
        style: "currency",
        currency: c,
        maximumFractionDigits: 0
      })).format(o);
    },
    formatNumber(o, a = 0) {
      if (o == null || !Number.isFinite(o))
        return w;
      const c = $(i.locale);
      return A(`number:${c}:${a}`, () => new Intl.NumberFormat(c, {
        maximumFractionDigits: a
      })).format(o);
    },
    formatPercent(o, a = 1) {
      if (o == null || !Number.isFinite(o))
        return w;
      const c = $(i.locale);
      return A(`percent:${c}:${a}`, () => new Intl.NumberFormat(c, {
        style: "percent",
        maximumFractionDigits: a
      })).format(o);
    },
    formatDate(o) {
      const a = R(o);
      if (!a)
        return w;
      const c = $(i.locale);
      return A(`date:${c}`, () => new Intl.DateTimeFormat(c, {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })).format(a);
    },
    formatDateTime(o) {
      const a = R(o);
      if (!a)
        return w;
      const c = $(i.locale);
      return A(`datetime:${c}`, () => new Intl.DateTimeFormat(c, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })).format(a);
    },
    formatTime(o) {
      const a = R(o);
      if (!a)
        return w;
      const c = $(i.locale);
      return A(`time:${c}`, () => new Intl.DateTimeFormat(c, {
        hour: "2-digit",
        minute: "2-digit"
      })).format(a);
    },
    formatRelative(o) {
      const a = R(o);
      if (!a)
        return w;
      const c = $(i.locale), d = A(`relative:${c}`, () => new Intl.RelativeTimeFormat(c, {
        numeric: "auto"
      })), l = a.getTime() - Date.now();
      for (const u of Le)
        if (Math.abs(l) >= u.ms)
          return d.format(Math.round(l / u.ms), u.unit);
      return d.format(0, "second");
    },
    formatBytes(o, a = 1) {
      if (o == null || !Number.isFinite(o))
        return w;
      let c = Math.abs(o), d = 0;
      for (; c >= 1024 && d < x.length - 1; )
        c = c / 1024, d = d + 1;
      const l = o < 0 ? "-" : "", u = d === 0 ? 0 : a;
      return `${l}${i.formatNumber(c, u)} ${x[d]}`;
    },
    withLocale(o) {
      return J(() => o, { fallbackLocale: t, currency: r, registry: s });
    },
    register(o, a) {
      if (!o)
        throw new Error("[format] register() needs a namespace — use the module id.");
      const c = s.groups.get(o) ?? {};
      for (const [d, l] of Object.entries(a)) {
        if (Ue.has(d))
          throw new Error(`[format] "${d}" is a built-in formatter and cannot be replaced.`);
        c[d] = l;
        const u = s.owners.get(d);
        if (!u) {
          s.owners.set(d, o);
          continue;
        }
        u !== o && console.warn(
          `⚠️ [format] "${d}" is already registered by [${u}], so $f.${d} stays theirs. [${o}] can reach its own as $f.of('${o}').${d}.`
        );
      }
      return s.groups.set(o, c), c;
    },
    of(o) {
      return s.groups.get(o) ?? {};
    },
    ownerOf(o) {
      return s.owners.get(o) ?? null;
    }
  };
  return new Proxy(i, {
    get(o, a, c) {
      if (typeof a != "string" || a in o)
        return Reflect.get(o, a, c);
      const d = s.owners.get(a);
      if (d)
        return s.groups.get(d)?.[a];
    },
    has(o, a) {
      return a in o ? !0 : typeof a == "string" && s.owners.has(a);
    },
    ownKeys(o) {
      return [.../* @__PURE__ */ new Set([...Reflect.ownKeys(o), ...s.owners.keys()])];
    },
    getOwnPropertyDescriptor(o, a) {
      const c = Reflect.getOwnPropertyDescriptor(o, a);
      if (c)
        return c;
      if (typeof a == "string" && s.owners.has(a))
        return { configurable: !0, enumerable: !0, value: void 0 };
    }
  });
}
function Be(n, e = {}) {
  return J(() => n.locale, e);
}
function xe(n) {
  return globalThis[K] = n, n;
}
function Qe() {
  return globalThis[K];
}
const Fe = {}, F = "Root", We = Fe ?? {}, Ve = (n) => n || We.VITE_MASTER_API_URL || (window.location.hostname === "localhost" ? "http://localhost:4400" : ""), qe = () => {
  const n = window.location.protocol === "https:" ? "wss:" : "ws:", e = window.location.host.replace(":4401", ":4400");
  return `${n}//${e}/socket`;
}, W = (n, e) => async () => {
  const t = n.getComponent(e);
  if (!t) throw new Error(`[sapp] Route component not registered: ${e}`);
  return typeof t == "function" ? t() : t;
};
async function Xe(n) {
  xe({ Vue: Z, Pinia: de, VueRouter: me, VueUse: ye });
  const e = ue(n.root), t = fe();
  e.use(t);
  const r = n.discovery ?? _e;
  await r.initialize();
  const s = n.api?.baseUrl ?? Ve(r.get("master_api_url"));
  console.log("💉 [sapp] apiBase:", s);
  const i = new Ae();
  i.$app = e, window.$superApp = i;
  const o = n.theme.register(e, i), a = o.uiStore, c = Ne(n.i18n), d = Be(c, { currency: n.currency });
  i.registerProtocol("i18n", c), c.onLocaleChange((p, y) => i.emit("i18n:locale-changed", { locale: p, previous: y }));
  const l = new Ee(s), u = new ke(n.socket?.url ?? qe());
  u.connect(), i.registerProtocol("api", l), i.registerProtocol("socket", u), l.bind(i);
  const f = n.auth?.tokenKey ?? "accessToken";
  i.createApi = Ce({
    tokenKey: f,
    message: o.messageService,
    appState: () => i.$appState
  });
  const E = n.auth?.loginPath ?? "/login", Q = n.layout ?? q({ name: "SappLayout", setup: () => () => V(pe) }), X = [
    { path: E, name: "Login", component: W(i, n.auth?.loginComponentId ?? "auth.login"), meta: { public: !0 } },
    {
      path: "/",
      name: F,
      component: Q,
      children: [
        { path: "app/:moduleId(.*)*", name: "AppGateway", component: W(i, "layout.app-container") }
      ]
    },
    ...n.routes ?? []
  ], k = ge({ history: he(n.router?.base), routes: X });
  k.beforeEach((p, y, m) => {
    const S = localStorage.getItem(f);
    if (!p.meta.public && !S) return m(E);
    m();
  });
  const P = { app: e, router: k, pinia: t, superApp: i, discovery: r, api: l, socket: u };
  if (await n.modules?.(P), i.state.discovery = r.getAll(), i.init({
    app: e,
    router: k,
    config: { moduleManifest: { ...n.manifest ?? {}, ...r.getAll() }, branding: n.branding },
    theme: n.tokens,
    message: o.messageService,
    dialog: o.dialogService
  }), n.branding) {
    const { name: p, icon: y, logo: m } = n.branding;
    p && (document.title = p);
    const S = y || m;
    if (S) {
      const M = document.querySelector('link[rel~="icon"]') ?? Object.assign(document.createElement("link"), { rel: "icon" });
      M.href = S, M.parentNode || document.head.appendChild(M);
    }
  }
  const T = o.appState ?? Re(), D = r.get("system.workspaces");
  D && (T.workspaces = D), i.$appState = T, e.config.globalProperties.$appState = T, e.config.globalProperties.$auth = i.$authState, e.provide("$auth", i.$authState);
  for (const p of n.features ?? []) {
    const y = {
      ...P,
      featureId: p.id,
      registerRoute: (m) => k.addRoute(F, m),
      registerTopRoute: (m) => k.addRoute(m),
      registerComponent: (m) => i.registerComponent(m),
      registerSkill: (m) => i.registerSkill(m),
      registerCommand: (m) => i.registerCommand(m),
      registerMessages: (m, S) => c.addMessages(m, S),
      provide: (m, S) => e.provide(m, S)
    };
    await p.install(y), console.log(`🧩 [sapp] Shell feature installed: ${p.id}`);
  }
  const h = e.config.globalProperties;
  return h.$c = (p) => i.getComponent(p), h.$s = i, h.$superApp = i, h.$message = o.messageService, h.$dialog = o.dialogService, h.$i18n = c, h.$t = (p, y) => c.t(p, y), h.$f = d, i.$f = d, e.provide("$i18n", c), e.provide("$f", d), e.provide("ui-store", a), e.provide("$theme", n.tokens), e.provide("$superApp", i), e.provide("$s", i), e.provide("$message", o.messageService), e.provide("$dialog", o.dialogService), {
    ...P,
    mount(p = "#app") {
      return e.use(k), e.mount(p), e;
    }
  };
}
export {
  Ee as A,
  Ie as B,
  ve as D,
  ke as S,
  Ae as a,
  Ce as b,
  Xe as c,
  Re as d,
  $e as e,
  J as f,
  Be as g,
  Ne as h,
  _e as i,
  Qe as j,
  xe as k
};
//# sourceMappingURL=createSapp-NLCrX91C.js.map
