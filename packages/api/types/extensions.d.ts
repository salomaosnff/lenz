export interface ExtensionSearchItem {
    manifest: Record<string, any>;
    script_path: string;
}
export declare function search(): Promise<ExtensionSearchItem[]>;
export declare function activate(): Promise<void>;
