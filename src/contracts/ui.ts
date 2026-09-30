/**
 * 🛰️ UI SERVICE CONTRACTS (`$message`, `$dialog`)
 * Standardized interfaces for cross-module communication.
 *
 * `$message` is the ONE feedback service: transient notices (toasts) and blocking questions
 * (alert / confirm / prompt) both go through it. `$dialog` renders a whole component in a modal.
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  id?: string | number;
  message: string;
  type?: ToastType;
  duration?: number;
}

export interface MessageOptions {
  title: string;
  description?: string;
  message?: string; // Alias for description
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm' | 'prompt';
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm?: (value?: any) => void | Promise<void>;
  onCancel?: () => void;
}

export interface MessageService {
  // ── Transient: a toast in the corner, gone on its own. The user does not have to answer. ──
  success: (title: string, description?: string, options?: Partial<ToastOptions>) => void;
  error: (title: string, description?: string, options?: Partial<ToastOptions>) => void;
  info: (title: string, description?: string, options?: Partial<ToastOptions>) => void;
  warning: (title: string, description?: string, options?: Partial<ToastOptions>) => void;
  /** Full control over one toast (id to replace an earlier one, duration…). */
  toast: (options: ToastOptions) => void;

  // ── Blocking: a modal the user has to close or answer. ──
  alert: (options: MessageOptions) => void;
  confirm: (options: MessageOptions) => Promise<boolean>;
  prompt: (options: MessageOptions) => Promise<string | null>;
}

/**
 * 🏗️ DIALOG SERVICE PROTOCOL
 * Programmatic modal creation — render any component as a dialog
 * without placing it in the template tree.
 * 
 * Usage: $dialog.open({ component, props, title, onClose })
 */
export interface DialogOptions {
  /** Unique dialog ID (auto-generated if omitted) */
  id?: string;
  /** The Vue component to render inside the modal body */
  component: any;
  /** Props to pass to the rendered component */
  props?: Record<string, any>;
  /** Modal title */
  title?: string;
  /** Modal description subtitle */
  description?: string;
  /** Max width class (e.g. 'max-w-xl', 'max-w-3xl') */
  maxWidth?: string;
  /** Preset size of the modal (used when `maxWidth` is not given) */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Called when the dialog is closed */
  onClose?: () => void;
  /** Called with result data when dialog emits 'submit' */
  onSubmit?: (data: any) => void | Promise<void>;
}

export interface DialogService {
  /** Open a programmatic modal with a component */
  open: (options: DialogOptions) => string;
  /** Close a specific dialog by ID */
  close: (id: string) => void;
  /** Close all open dialogs */
  closeAll: () => void;
}
