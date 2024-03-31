import EventEmitter from "events";
import { AsyncOrSync, CommandMeta, Disposable } from "../types";
import { ExtensionItem, extensions } from "./extension";

/**
 * Função que será executada quando um comando for disparado
 * @param args Argumentos passados para o comando
 * @returns Nada ou uma promessa que será resolvida quando o comando for finalizado
 */
export type CommandHandler = (...args: any[]) => AsyncOrSync<void>

/**
 * Função padrão para comandos que não foram implementados
 */
export const VoidCommandHandler: CommandHandler = () => console.warn("Command handler not implemented")

export interface CommandRegistryItem {
    /** Meta informações do comando */
    meta: CommandMeta

    /** Função que será executada quando o comando for disparado */
    handler: CommandHandler
    
    /** Extensão que registrou o comando */
    extension: ExtensionItem
}

export interface CommandHostEvents {
    prepare: [command: CommandRegistryItem],
    register: [command: CommandRegistryItem],
    unregister: [command: CommandRegistryItem],
    execute: [command: CommandRegistryItem, args: any[]]
    update: [command: CommandRegistryItem]
}

/**
 * Representa um host de comandos
 * Um host de comandos é onde os comandos ficam "hospedados".
 * O host de comandos é responsável por registrar, preparar e executar comandos.
 */
export class CommandHost extends EventEmitter<CommandHostEvents> {
    #commandMap = new Map<string, CommandRegistryItem>()

    /**
     * Mapa de comandos registrados
     */
    get commandMap() {
        return new Map(this.#commandMap)
    }

    /**
     * Prepara um comando para ser registrado
     * @param extensionId Extensão que registrou o comando
     * @param meta Metadados do comando
     * @returns Descartável para remover o comando
     */
    prepare(extensionId: string, meta: CommandMeta): Disposable {
        const item: CommandRegistryItem = {
            meta,
            extension: extensions.getExtension(extensionId),
            handler: VoidCommandHandler,
        }

        this.#commandMap.set(meta.id, item)

        this.emit('prepare', item)
        this.emit("update", item)

        return {
            dispose: () => this.unregister(meta.id)
        }
    }

    /**
     * Obtém as informações de um comando
     * @param commandId Identificador do comando
     * @returns Informações do comando
     * @throws Se o comando não for encontrado
     */
    getCommand(commandId: string): CommandRegistryItem {
        const item = this.#commandMap.get(commandId)

        if (!item) {
            throw new Error(`Command ${commandId} not found`)
        }

        return item
    }

    /**
     * Registra um comando definindo sua função de execução
     * @param commandId Identificador do comando
     * @param handler Função que será executada quando o comando for disparado
     * @returns Descartável para remover o comando
     */
    register(commandId: string, handler: CommandHandler): Disposable {
        const item = this.getCommand(commandId)

        if (item.handler !== VoidCommandHandler) {
            throw new Error(`Command ${commandId} already registered`)
        }

        item.handler = handler

        this.emit("register", item)
        this.emit("update", item)

        return {
            dispose: () => this.unregister(commandId)
        }
    }

    /**
     * Remove um comando registrado
     * @param commandId Identificador do comando
     */
    unregister(commandId: string): void {
        const item = this.getCommand(commandId)

        item.handler = VoidCommandHandler

        this.#commandMap.delete(commandId)

        this.emit("unregister", item)
        this.emit("update", item)
    }

    /**
     * Executa um comando
     * @param commandId Identificador do comando
     * @param args Argumentos passados para o comando
     * @returns Promessa que será resolvida quando o comando for finalizado
     */
    execute(commandId: string, ...args: any[]): Promise<unknown> {
        const item = this.getCommand(commandId)

        this.emit("execute", item, args)

        return Promise.resolve(item.handler(...args))
    }
}

export const commands = new CommandHost()