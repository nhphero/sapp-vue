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
/**
 * Where a registered app's bundle comes from:
 * - `remote`  — a host of its own (`url`: a dev server or a static host). The default.
 * - `package` — a bundle uploaded to the backend with `sapp publish`; the backend serves the version
 *   currently deployed for this app id at `<api>/packages/<id>/index.js` (`package-manager.apps.set`).
 */
export type AppSourceType = 'remote' | 'package';
/** Micro-frontend record persisted in `erp_registered_apps`. */
export interface RegisteredApp {
    id: string;
    name: string;
    /** Source of the bundle; absent on records saved before types existed = `remote`. */
    type?: AppSourceType;
    /** `package` apps: the package name the deployment uses (informational; the backend decides the version). */
    package?: string;
    /** `package` apps: the deployed version (from the server's `/packages/apps.json`) — the entry points into its files. */
    version?: string;
    /** `package` apps: `stable` when the app follows its package's stable alias (`version` = what stable names now). */
    channel?: 'stable' | null;
    /** `server`: created by the backend's package registry (a mini app package), listed from `/packages/apps.json`. */
    managedBy?: 'server';
    /** `remote`: base URL of the remote. `package`: the backend base URL it is served from. */
    url: string;
    /**
     * Resolved ESM entry: `${url}/src/index.ts` (dev) / `${url}/index.js` (prod); a package app:
     * `<package files>/<package>/<version>/index.js` (the extracted version, a static file), or the
     * `<api>/packages/<id>/index.js` shim while its version is not known yet.
     */
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
    /** Default `remote`. */
    type?: AppSourceType;
    /** Required for `remote`; ignored for `package` (served by the backend). */
    url?: string;
    /** `package` apps: the package deployed for this app. */
    package?: string;
    description?: string;
    icon?: string;
    isEnabled?: boolean;
}
/** `id` renames the app (its `/app/<id>` route and manifest key); it is normalised like `registerApp`. */
export type AppUpdateInput = Partial<Pick<RegisteredApp, 'id' | 'name' | 'type' | 'package' | 'url' | 'description' | 'icon' | 'isEnabled'>>;
export interface PingResult {
    success: boolean;
    latencyMs: number;
    statusText?: string;
}
/** Map of module id → remote ESM entry URL. */
export type ModuleManifest = Record<string, string>;
//# sourceMappingURL=registry.d.ts.map