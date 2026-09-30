/**
 * 🍱 Micro-Frontend (MFE) Contracts
 * What a remote app must `export default` so the kernel can install it.
 */
import type { App } from 'vue';
import type { ISuperApp } from './kernel';
import type { RegisteredApp } from './registry';

/**
 * ESA v5 module protocol: the kernel imports the remote ESM entry and calls
 * `install(app, superApp)` once. Use `defineMfeModule` for type inference.
 */
export interface MfeInstallOptions {
  /** Id the Shell is mounting this bundle under (registry id / `/app/<id>`); may differ from `IMfeModule.id`. */
  moduleId?: string;
  /** Route prefix the Shell mounts the bundle at, e.g. `/app/orders`. */
  basePath?: string;
  /** The registry record configured in Admin → Application Registry (slug, name, url, icon, description, isEnabled…). */
  app?: RegisteredApp | null;
}

export interface IMfeModule {
  /** Primary module id (must match the id used in the app registry). */
  id: string;
  name: string;
  /** Optional additional ids served by the same bundle (e.g. `expose` → workspace). */
  aliases?: string[];
  install(app: App, superApp: ISuperApp, options?: MfeInstallOptions): void | Promise<void>;
}

export function defineMfeModule<T extends IMfeModule>(module: T): T {
  return module;
}

// --- Legacy mount/unmount protocol (SubAppLoader) ---

export interface SubAppContext {
  accessToken: string | null;
  user: {
    id: string;
    username: string;
    role: string;
  };
  eventBus: {
    emit: (event: string, data: any) => void;
    on: (event: string, callback: (data: any) => void) => void;
  };
}

export interface SubAppDefinition {
  name: string;
  version: string;
  mount: (container: HTMLElement, context: SubAppContext) => void;
  unmount: (container: HTMLElement) => void;
}

export function defineSubApp(config: SubAppDefinition): SubAppDefinition {
  return config;
}
