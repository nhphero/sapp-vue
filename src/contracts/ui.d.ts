/**
 * 🛰️ UI SERVICE CONTRACTS (`$toast`, `$message`, `$dialog`)
 * Standardized interfaces for cross-module communication.
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';
export interface ToastOptions {
    id?: string | number;
    message: string;
    type?: ToastType;
    duration?: number;
}
export interface ToastService {
    show: (options: ToastOptions) => void;
    success: (title: string, description?: string, options?: ToastOptions) => void;
    error: (title: string, description?: string, options?: ToastOptions) => void;
    info: (title: string, description?: string, options?: ToastOptions) => void;
    warning: (title: string, description?: string, options?: ToastOptions) => void;
}
export interface MessageOptions {
    title: string;
    description?: string;
    message?: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'confirm' | 'prompt';
    confirmText?: string;
    cancelText?: string;
    placeholder?: string;
    defaultValue?: string;
    onConfirm?: (value?: any) => void | Promise<void>;
    onCancel?: () => void;
}
export interface MessageService {
    show: (options: MessageOptions) => void;
    confirm: (options: MessageOptions) => Promise<boolean>;
    prompt: (options: MessageOptions) => Promise<string | null>;
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
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
//# sourceMappingURL=ui.d.ts.map