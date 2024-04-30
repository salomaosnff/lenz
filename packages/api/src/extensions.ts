import { invoke } from "@tauri-apps/api/core";
import { emitTo } from '@tauri-apps/api/event';
import * as dialogApi from './dialog/index.js';
import * as splash from './splash.js';

export interface ExtensionSearchItem {
    manifest: Record<string, any>
    script_path: string
}

export function search(): Promise<ExtensionSearchItem[]> {
    return invoke('extensions_search')
}

const describeTask = (...tasks: string[]) => {
    return emitTo('splash', 'update', {
        tasks
    })
}

export async function activate() {
    const extensions = await search()

    for (const extension of extensions) {
        try {
            console.log(`Initializing extension ${extension.manifest.id}...`)

        describeTask(`Initializing ${extension.manifest.name}...`)
        const task = describeTask.bind(null, extension.manifest.name)
        
        const { activate } = await import(/* @vite-ignore */`user:/${extension.script_path}`)

        await activate?.(task)
        console.log(`Extension ${extension.manifest.id} activated`)
        } catch (err: any) {
            await dialogApi.show(`${err.name}: ${err.message}\nStackTrace:\n${err.stack}`,{
                title: `Erro ao ativar extensão ${extension.manifest.name}`,
                kind: 'error'
            })
        }
    }

    console.log('All extensions activated')
    await splash.hide()
}