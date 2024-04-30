import { message as showMessage, ask } from '@tauri-apps/plugin-dialog'

export interface AlertDialogOptions {
    title?: string
    okLabel?: string
    kind?: 'info' | 'warning' | 'error'
}

export interface ConfirmDialogOptions extends AlertDialogOptions {
    cancelLabel?: string
}

export function show(message: string, options?: AlertDialogOptions): Promise<void> {
    return showMessage(message, options)
}

export function confirm(message: string, options?: ConfirmDialogOptions): Promise<boolean> {
    return ask(message, options)
}