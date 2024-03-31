import path from "node:path"
import { AsyncOrSync, ExtensionMeta, Disposable } from "../types"
import fs, { mkdir } from 'node:fs/promises'
import EventEmitter from "node:events"
import { BUILTIN_EXTENSIONS_DIR, USER_EXTENSIONS_DIR } from "../const"
import { commands as commandsHost } from './command'
import { views as viewsHost } from './view'
import { tools as toolsHost } from './tool'
import { providers as providersHost } from './provider'

export interface ExtensionHostOptions {
    /**
     * Pastas onde serão procuradas as extensões
     */
    searchPaths: string[]
}

/**
 * Contexto de execução de uma extensão
 */
export interface ExtensionContext {
    /** Inscrições da extensão */
    subscriptions: Set<Disposable>
}

/**
 * Script de uma extensão
 */
export interface ExtensionModule<T extends {} = {}> {
    /**
     * Função que será executada quando a extensão for ativada
     * @param context Contexto da extensão
     */
    activate?(context: ExtensionContext): AsyncOrSync<T | void>

    /**
     * Função que será executada quando a extensão for desativada
     */
    deactivate?(context: ExtensionContext): AsyncOrSync<void>
}

export interface ExtensionItem {
    /** Metadados da extensão */
    meta: ExtensionMeta

    /** Caminho da extensão */
    path: string

    /** Caminho do arquivo principal da extensão */
    main: string

    /** Exportações da extensão */
    exports: Record<string, unknown>

    /** Contexto da extensão */
    context: ExtensionContext

    /** Módulo da extensão */
    script: ExtensionModule
}

export class ExtensionHost extends EventEmitter<{
    start: [],
    search: [extensions: ExtensionItem[]],
    stop: [],
    load: [extensionPath: ExtensionItem],
    prepare: [extension: ExtensionItem]
    activate: [extension: ExtensionItem]
    unload: [extension: ExtensionItem],
    update: [extension: ExtensionItem]
    deactivate: [extension: ExtensionItem]
}> {
    #extensionMap = new Map<string, ExtensionItem>()

    constructor(private options: ExtensionHostOptions) {
        super()
    }

    prepareExtension(extensionItem: ExtensionItem) {
        const extensionId = extensionItem.meta.id
        const {
            l10n = {},
            providers = [],
            commands = [],
            panels = [],
            tools = [],
            views = {}
        } = extensionItem.meta.contributes ?? {}

        for (const provider of providers) {
            providersHost.prepare(extensionId, provider)
        }

        for (const command of commands) {
            commandsHost.prepare(extensionId, command)
        }

        for (const panel of panels) {
            viewsHost.registerPanel(panel)
        }

        for (const tool of tools) {
            toolsHost.prepare(extensionId, tool)
        }

        for (const [panelId, panelViews = []] of Object.entries(views)) {
            for (const view of panelViews) {
                viewsHost.prepare(extensionId, panelId, view)
            }
        }

        this.emit('prepare', extensionItem)
    }

    /**
     * Carrega uma extensão
     * @param extensionItem Informações da extensão
     */
    async loadExtension(extensionItem: ExtensionItem) {
        try {
            this.emit('load', extensionItem)

            this.#extensionMap.set(extensionItem.meta.id, extensionItem)

            this.prepareExtension(extensionItem)
            extensionItem.exports = (await Promise.resolve(extensionItem.script.activate?.(extensionItem.context))) ?? {}

            this.emit('activate', extensionItem)
            this.emit('update', extensionItem)
        } catch (error) {
            console.error(`Failed to load extension "${extensionItem.meta.id}"`, error)
            return
        }
    }

    /**
     * Obtém as informações de uma extensão
     * @param extensionId Identificador da extensão
     * @returns Informações da extensão
     * @throws Se a extensão não for encontrada
     */
    getExtension(extensionId: string): ExtensionItem {
        const item = this.#extensionMap.get(extensionId)

        if (!item) {
            throw new Error(`Extension "${extensionId}" not found`)
        }

        return item
    }

    /**
     * Descarrega uma extensão
     * @param extensionId Identificador da extensão
     * @returns Se a extensão foi descarregada
     * @throws Se a extensão não for encontrada
     */
    async unloadExtension(extensionId: string) {
        const item = this.getExtension(extensionId)

        this.emit('unload', item)

        await Promise.resolve(item.script.deactivate?.(item.context))

        item.context.subscriptions.forEach(subscription => subscription.dispose())

        this.#extensionMap.delete(extensionId)

        this.emit('deactivate', item)
        this.emit('update', item)
    }

    /**
     * Obtém todas as extensões carregadas
     * @returns Lista de extensões
     */
    getExtensions(): ExtensionItem[] {
        return Array.from(this.#extensionMap.values())
    }

    /**
     * Cria uma extensão
     * @param manifestPath Pasta onde está localizado o manifesto da extensão
     * @returns Informações da extensão
     * @throws Se a extensão já estiver carregadaserá criado o arquivo de manifesto da extensão
     * @throws Se ocorrer um erro ao carregar a extensão
     */
    async createExtension(manifestPath: string): Promise<ExtensionItem> {
        const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'))

        if (!manifest.id) {
            throw new Error(`Extension at "${manifestPath}" has no id`)
        }

        if (!manifest.main) {
            throw new Error(`Extension at "${manifestPath}" has no main`)
        }

        const mainPath = path.resolve(path.dirname(manifestPath), manifest.main)

        return {
            meta: manifest,
            path: manifestPath,
            main: mainPath,
            exports: {},
            script: require(mainPath),
            context: {
                subscriptions: new Set()
            },
        }
    }

    /**
     * Procura por extensões nas pastas de busca
     * @returns Lista de extensões encontradas
     * @throws Se ocorrer um erro ao ler as pastas
     */
    async searchExtensions() {
        console.log('Searching extensions in', this.options.searchPaths)
        const extensions: ExtensionItem[] = []

        for (const extensionFolder of this.options.searchPaths) {
            if (!(await fs.access(extensionFolder).then(() => true).catch(() => {
                console.warn(`Extension folder "${extensionFolder}" not found`)
                return false
            }))) {
                continue
            }

            const folders = await fs.readdir(extensionFolder, { withFileTypes: true })

            for (const folder of folders) {
                if (!folder.isDirectory()) {
                    continue
                }

                const manifestPath = path.join(extensionFolder, folder.name, 'manifest.json')

                if (!await fs.access(manifestPath).then(() => true).catch(() => false)) {
                    continue
                }

                try {
                    const extension = await this.createExtension(manifestPath)

                    extensions.push(extension)
                } catch (error) {
                    console.warn(`Failed to load extension at "${manifestPath}"`, error)
                }
            }
        }

        this.emit('search', extensions)

        return extensions
    }


    /**
     * Inicia o host de extensões
     * @throws Se ocorrer um erro ao carregar as extensões
     */
    async start() {
        await mkdir(USER_EXTENSIONS_DIR, { recursive: true })

        const extensions = await this.searchExtensions()
        const extensionMap = new Map(extensions.map(extension => [extension.meta.id, extension]))

        const dfs = async (extension: ExtensionItem, visited: Set<string> = new Set()) => {
            if (visited.has(extension.meta.id)) {
                return
            }

            visited.add(extension.meta.id)

            for (const dependency of extension.meta.depends ?? []) {
                const dep = extensionMap.get(dependency)

                if (!dep) {
                    console.warn(`Dependency "${dependency}" not found for extension "${extension.meta.id}"`)
                    continue
                }

                await dfs(dep, visited)
            }

            for (const inject of extension.meta.inject ?? []) {
                const dep = extensions.find(ext => ext.meta.contributes?.providers?.some(provider => provider.id === inject))

                if (!dep) {
                    console.warn(`Extension "${extension.meta.id}" requires provider "${inject}" but it was not provided by any extension`)
                    continue
                }

                await dfs(dep, visited)
            }

            await this.loadExtension(extension)
        }

        const visited = new Set<string>()

        for (const extension of extensions) {
            await dfs(extension, visited)
        }

        this.emit('start')
    }

    /**
     * Para o host de extensões
     */
    async stop() {
        for (const extension of this.getExtensions()) {
            await this.unloadExtension(extension.meta.id)
        }
        this.emit('stop')
    }
}

export const extensions = new ExtensionHost({
    searchPaths: [
        BUILTIN_EXTENSIONS_DIR,
        USER_EXTENSIONS_DIR
    ]
})