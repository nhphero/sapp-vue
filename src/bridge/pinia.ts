// 🌉 PINIA BRIDGE (Operation Bridge of Truth)
const bridge = (window as any).__MF_BRIDGE__;

if (!bridge || !bridge.Pinia) {
  console.error('🚨 [MF_BRIDGE] FATAL: Pinia Bridge not found! Ensure Shell is loaded first.');
}

export const {
  createPinia,
  defineStore,
  getActivePinia,
  setActivePinia,
  mapActions,
  mapGetters,
  mapState,
  mapStores,
  mapWritableState,
  storeToRefs,
  acceptHMRUpdate
} = bridge.Pinia;

export default bridge.Pinia;
