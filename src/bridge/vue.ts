// 🌉 VUE BRIDGE (Operation Bridge of Truth)
// This file acts as a proxy to the global Vue instance provided by the Shell.
// It ensures that absolutely every module in the MFE uses the same object.

const bridge = (window as any).__MF_BRIDGE__;

if (!bridge || !bridge.Vue) {
  console.error('🚨 [MF_BRIDGE] FATAL: Vue Bridge not found! Ensure Shell is loaded first.');
}

// Named exports for common Vue APIs to support tree-shaking and IDEs
export const {
  createApp,
  defineComponent,
  defineAsyncComponent,
  ref,
  reactive,
  computed,
  watch,
  watchEffect,
  onMounted,
  onUnmounted,
  onBeforeUnmount,
  onUpdated,
  nextTick,
  provide,
  inject,
  h,
  Fragment,
  Teleport,
  Suspense,
  toRef,
  toRefs,
  unref,
  toValue,
  isRef,
  isReactive,
  isReadonly,
  isProxy,
  markRaw,
  shallowRef,
  shallowReactive,
  shallowReadonly,
  customRef,
  triggerRef,
  useSlots,
  useAttrs,
  getCurrentInstance,
  // --- Internal Compiler/Renderer APIs (Required for .vue templates) ---
  openBlock,
  createBlock,
  createElementBlock,
  createVNode,
  createBaseVNode,
  createElementVNode, // 👈 Added specific request
  createTextVNode,
  createCommentVNode,
  createStaticVNode,
  resolveComponent,
  resolveDynamicComponent,
  resolveDirective,
  withCtx,
  withDirectives,
  withModifiers,
  withKeys,
  withMemo,
  isMemoSame,
  renderList,
  renderSlot,
  toDisplayString,
  vShow,
  vModelText,
  vModelCheckbox,
  vModelRadio,
  vModelSelect,
  vModelDynamic,
  // --- Standard Built-ins ---
  KeepAlive,
  BaseTransition,
  Transition,
  TransitionGroup
} = bridge.Vue;

// Default export for 'import Vue from "vue"'
export default bridge.Vue;
