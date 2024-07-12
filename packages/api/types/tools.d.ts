import { ToolbarItem } from "./types/index.js";
export declare function prepare(tool: ToolbarItem, extensionId: string): void;
export declare function register(id: string, callback: (...args: any[]) => any): void;
export declare function activate(id: string): Promise<any>;
