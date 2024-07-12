import { ExtensionMetadata } from "./types/index.js";
export interface ExtensionSearchItem {
    manifest: ExtensionMetadata;
    script_path: string;
}
export declare function search(): Promise<ExtensionSearchItem[]>;
export declare function init(): Promise<void>;
export declare function activate(extension: ExtensionSearchItem): Promise<void>;
export declare function deactivate(extensionId: string): Promise<void>;
export declare function get(extensionId: string): {
    exports: Record<string, any>;
    manifest: ExtensionMetadata;
};
