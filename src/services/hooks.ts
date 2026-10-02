import { markRaw, reactive } from 'vue';
import type { HookHandler, HookProvider, HookSlotEntry, IHooks } from '../contracts/hooks';

/**
 * 🪝 The hook registry behind `superApp.$hook` (contracts/hooks.ts): slots and providers are reactive (the
 * theme's slots re-render when a plugin adds something), events are a plain listener list.
 */
export function createHooks(): IHooks {
  const slots = reactive<Record<string, HookSlotEntry[]>>({});
  const providerMap = reactive<Record<string, HookProvider[]>>({});
  const handlers = new Map<string, Set<HookHandler>>();

  const raw = <T extends { component?: any }>(entry: T): T =>
    (entry.component ? { ...entry, component: markRaw(entry.component) } : { ...entry });

  const hooks: IHooks = {
    add(slot, entry) {
      const list = (slots[slot] ??= []);
      const at = list.findIndex(e => e.id === entry.id);
      const value = raw(entry);
      if (at === -1) list.push(value);
      else list.splice(at, 1, value);
      return () => hooks.remove(slot, entry.id);
    },
    remove(slot, id) {
      const list = slots[slot];
      if (!list) return;
      const at = list.findIndex(e => e.id === id);
      if (at !== -1) list.splice(at, 1);
    },
    entries(slot) {
      return (slots[slot] ?? [])
        .filter(entry => {
          try {
            return !entry.when || entry.when();
          } catch {
            return false;
          }
        })
        .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
    },

    on(event, handler) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
      return () => hooks.off(event, handler);
    },
    off(event, handler) {
      handlers.get(event)?.delete(handler);
    },
    async emit(event, payload) {
      for (const handler of [...(handlers.get(event) ?? [])]) {
        try {
          await handler(payload);
        } catch (err) {
          console.error(`🪝 [hooks] A listener of "${event}" failed:`, err);
        }
      }
    },

    provide(capability, provider) {
      const list = (providerMap[capability] ??= []);
      const at = list.findIndex(p => p.id === provider.id);
      const value = raw(provider);
      if (at === -1) list.push(value);
      else list.splice(at, 1, value);
      return () => {
        const current = providerMap[capability];
        const index = current?.findIndex(p => p.id === provider.id) ?? -1;
        if (index !== -1) current!.splice(index, 1);
      };
    },
    providers(capability) {
      return [...(providerMap[capability] ?? [])].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    },
    resolve(capability, input) {
      for (const provider of hooks.providers(capability)) {
        try {
          if (!provider.match || provider.match(input)) return provider;
        } catch {
          // a provider whose match throws does not take it
        }
      }
      return null;
    },

    scope(owner) {
      const disposers: Array<() => void> = [];
      const keep = (dispose: () => void) => {
        disposers.push(dispose);
        return dispose;
      };
      const scoped: IHooks & { dispose(): void } = {
        add: (slot, entry) => keep(hooks.add(slot, { ...entry, owner })),
        remove: hooks.remove,
        entries: hooks.entries,
        on: (event, handler) => keep(hooks.on(event, handler)),
        off: hooks.off,
        emit: hooks.emit,
        provide: (capability, provider) => keep(hooks.provide(capability, provider)),
        providers: hooks.providers,
        resolve: hooks.resolve,
        scope: hooks.scope,
        dispose: () => {
          while (disposers.length) disposers.pop()!();
        },
      };
      return scoped;
    },
  };
  return hooks;
}
