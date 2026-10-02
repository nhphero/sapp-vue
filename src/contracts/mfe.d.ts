/**
 * 🍱 Micro-Frontend (MFE) Contracts
 * What a remote app must `export default` so the kernel can install it.
 */
import type { App } from 'vue';
import type { ISuperApp } from './kernel';
/**
 * ESA v5 module protocol: the kernel imports the remote ESM entry and calls
 * `install(app, superApp)` once. Use `defineMfeModule` for type inference.
 */
export interface IMfeModule {
    /** Primary module id (must match the id used in the app registry). */
    id: string;
    name: string;
    /** Optional additional ids served by the same bundle (e.g. a legacy alias). */
    aliases?: string[];
    install(app: App, superApp: ISuperApp): void | Promise<void>;
}
export declare function defineMfeModule<T extends IMfeModule>(module: T): T;
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
export declare function defineSubApp(config: SubAppDefinition): SubAppDefinition;
//# sourceMappingURL=mfe.d.ts.map