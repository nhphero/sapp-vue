const e = window.__MF_BRIDGE__;
(!e || !e.Pinia) && console.error("🚨 [MF_BRIDGE] FATAL: Pinia Bridge not found! Ensure Shell is loaded first.");
const {
  createPinia: i,
  defineStore: t,
  getActivePinia: a,
  setActivePinia: n,
  mapActions: o,
  mapGetters: r,
  mapState: s,
  mapStores: c,
  mapWritableState: d,
  storeToRefs: p,
  acceptHMRUpdate: P
} = e.Pinia, f = e.Pinia;
export {
  P as acceptHMRUpdate,
  i as createPinia,
  f as default,
  t as defineStore,
  a as getActivePinia,
  o as mapActions,
  r as mapGetters,
  s as mapState,
  c as mapStores,
  d as mapWritableState,
  n as setActivePinia,
  p as storeToRefs
};
//# sourceMappingURL=bridge-pinia.js.map
