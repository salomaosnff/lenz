export interface AlertDialogOptions {
    title?: string;
    okLabel?: string;
    kind?: 'info' | 'warning' | 'error';
}
export interface ConfirmDialogOptions extends AlertDialogOptions {
    cancelLabel?: string;
}
export declare function show(message: string, options?: AlertDialogOptions): Promise<void>;
export declare function confirm(message: string, options?: ConfirmDialogOptions): Promise<boolean>;
