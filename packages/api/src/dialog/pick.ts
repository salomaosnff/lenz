import * as pluginDialog from "@tauri-apps/plugin-dialog";

interface OpenFileOptions {
    title?: string
    defaultPath?: string
    filters?: Record<string, string[]>
}

interface OpenFolderOptions {
    title?: string
    defaultPath?: string
    filters?: Record<string, string[]>
}

interface SaveFileOptions {
    title?: string
    defaultPath?: string
    filters?: Record<string, string[]>
}

export async function openFile(options: OpenFileOptions): Promise<string | null> {
    const result = await pluginDialog.open({
        title: options.title ?? 'Abrir arquivo',
        multiple: false,
        directory: false,
        canCreateDirectories: true,
        defaultPath: options.defaultPath ?? '.',
        filters: Object.entries(options.filters ?? {}).map(([name, extensions]) => ({ name, extensions }))
    })

    return result?.path ?? null
}

export async function openFiles(options: OpenFileOptions): Promise<string[] | null> {
    const result = await pluginDialog.open({
        title: options.title ?? 'Abrir arquivos',
        multiple: true,
        directory: false,
        canCreateDirectories: true,
        defaultPath: options.defaultPath ?? '.',
        filters: Object.entries(options.filters ?? {}).map(([name, extensions]) => ({ name, extensions }))
    })

    return result?.map(r => r.path) ?? null
}


export async function saveFile(options: SaveFileOptions): Promise<string | null> {
    return pluginDialog.save({
        title: options.title ?? 'Salvar arquivo',
        canCreateDirectories: true,
        defaultPath: options.defaultPath ?? '.',
        filters: Object.entries(options.filters ?? {}).map(([name, extensions]) => ({ name, extensions }))
    })
}

export function openFolder(options: OpenFolderOptions): Promise<string | null> {
    return pluginDialog.open({
        title: options.title ?? 'Abrir pasta',
        multiple: false,
        directory: true,
        canCreateDirectories: true,
        defaultPath: options.defaultPath ?? '.',
        recursive: true,
        filters: Object.entries(options.filters ?? {}).map(([name, extensions]) => ({ name, extensions }))
    })
}

export function openFolders(options: OpenFolderOptions): Promise<string[] | null> {
    return pluginDialog.open({
        title: options.title ?? 'Abrir pasta',
        multiple: true,
        directory: true,
        canCreateDirectories: true,
        defaultPath: options.defaultPath ?? '.',
        recursive: true,
        filters: Object.entries(options.filters ?? {}).map(([name, extensions]) => ({ name, extensions }))
    })
}