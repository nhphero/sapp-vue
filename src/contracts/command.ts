/**
 * 📟 Command / Skill / Action Contracts (⌘K palette)
 */
import type { ISuperApp } from './kernel';

export interface ErpCommand {
  id: string;
  name: string;
  description: string;
  shortcut?: string;
  handler: (payload?: any) => void | Promise<void>;
}

export interface ErpSkill {
  id: string;
  name: string;
  description: string;
  icon?: any;
  handler: (payload?: any) => void;
}

export interface ErpAction {
  id: string;
  name: string;
  description: string;
  params?: any;
  handler: (payload?: any) => Promise<any>;
}

/** In-process module installed by the Shell (single-argument install). */
export interface ErpModule {
  id: string;
  name: string;
  install: (superApp: ISuperApp) => void | Promise<void>;
}

export function defineErpModule(module: ErpModule): ErpModule {
  return module;
}
