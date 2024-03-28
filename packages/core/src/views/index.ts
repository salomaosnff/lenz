
export interface ViewContent {
    onInit?(element: HTMLElement): void | Promise<void>;
    onShow?(element: HTMLElement): void | Promise<void>;
    onHide?(element: HTMLElement): void | Promise<void>;
    onDestroy?(element: HTMLElement): void | Promise<void>;
}