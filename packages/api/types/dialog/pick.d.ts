interface OpenFileOptions {
    title?: string;
    defaultPath?: string;
    filters?: Record<string, string[]>;
}
interface OpenFolderOptions {
    title?: string;
    defaultPath?: string;
    filters?: Record<string, string[]>;
}
interface SaveFileOptions {
    title?: string;
    defaultPath?: string;
    filters?: Record<string, string[]>;
}
export declare function openFile(options: OpenFileOptions): Promise<string | null>;
export declare function openFiles(options: OpenFileOptions): Promise<string[] | null>;
export declare function saveFile(options: SaveFileOptions): Promise<string | null>;
export declare function openFolder(options: OpenFolderOptions): Promise<string | null>;
export declare function openFolders(options: OpenFolderOptions): Promise<string[] | null>;
export {};
