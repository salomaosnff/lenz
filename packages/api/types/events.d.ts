import { Disposable, ToolbarItem } from "./types/index.js";
type Listener<T extends any[]> = (...args: T) => void;
declare class EventEmitter<T extends Record<string, any[]>> {
    on<K extends keyof T & string>(event: K, listener: Listener<T[K]>): Disposable;
    once<K extends keyof T & string>(event: K, listener: Listener<T[K]>): Disposable;
    emit<K extends keyof T & string>(event: K, ...args: T[K]): void;
}
declare const _default: EventEmitter<{
    "extensions:init": [extensionId: string];
    "extensions:activate": [extensionId: string];
    "extensions:error": [error: any, extensionId: string];
    "tools:prepare": [tool: ToolbarItem];
    "tools:register": [tool: ToolbarItem];
    "tools:remove": [toolId: string];
    "tools:activate": [toolId: string];
}>;
export default _default;
