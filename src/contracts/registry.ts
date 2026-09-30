/**
 * 🧩 Registry Contracts
 * Shapes accepted by the kernel registries (components, skills, commands,
 * module entries, remote apps).
 */
import type { Component } from 'vue';

/** Lazy or eager component reference accepted by the component registry. */
export type ComponentSource = Component | (() => Promise<any>);

export interface ComponentRegistration {
  /** Global id, e.g. `workspace.main`, `integration.form.sql`. */
  id: string;
  name?: string;
  description?: string;
  /** Free-form grouping, e.g. `Main Views`, `Feature Views`, `Internal`, `Security UI`. */
  category?: string;
  component: ComponentSource;
}

export interface SkillRegistration {
  id: string;
  name: string;
  description?: string;
  category: string;
  icon?: any;
  handler: (payload?: any) => void | Promise<void>;
}

export interface CommandRegistration {
  id: string;
  name: string;
  description?: string;
  category: string;
  shortcut?: string;
  handler: (payload?: any) => void | Promise<void>;
}

export interface ModuleEntryRegistration {
  /** MFE id used in `/app/:moduleId` routes. */
  moduleId: string;
  /** Id of a previously registered component that renders the module root. */
  entryComponentId: string;
}

export type PathChangeHandler = (subPath: string) => void;

/** Remote micro-frontend record persisted in `erp_registered_apps`. */
export interface RegisteredApp {
  id: string;
  name: string;
  /** Base URL of the remote (dev server or static host). */
  url: string;
  /** Resolved ESM entry, e.g. `${url}/src/index.ts` (dev) or `${url}/index.js` (prod). */
  entryUrl: string;
  description?: string;
  icon?: string;
  isSystem?: boolean;
  isEnabled?: boolean;
  updatedAt?: string;
}

export interface AppRegistrationInput {
  id: string;
  name: string;
  url: string;
  description?: string;
  icon?: string;
  isEnabled?: boolean;
}

/** `id` renames the app (its `/app/<id>` route and manifest key); it is normalised like `registerApp`. */
export type AppUpdateInput = Partial<Pick<RegisteredApp, 'id' | 'name' | 'url' | 'description' | 'icon' | 'isEnabled'>>;

export interface PingResult {
  success: boolean;
  latencyMs: number;
  statusText?: string;
}

/** Map of module id → remote ESM entry URL. */
export type ModuleManifest = Record<string, string>;
