import EventEmitter from "events";
import { AsyncOrSync, Disposable, ToolMeta } from "../types";

/**
 * Função que será executada quando um comando for ativada
 */
export type ToolHandler = () => AsyncOrSync<any>

/**
 * Função padrão para ferramentas que não foram implementadas
 */
export const VoidToolHandler: ToolHandler = () => console.warn("Tool handler not implemented")

export interface ToolHostItem {
    /** Meta informações da ferramenta */
    meta: ToolMeta

    /** Função que será executada quando a ferramenta for ativada */
    handler: ToolHandler
    
    /** Identificador da extensão que registrou a ferramenta */
    extensionId: string
}

export interface ToolHostEvents {
    prepare: [tool: ToolHostItem],
    register: [tool: ToolHostItem],
    unregister: [tool: ToolHostItem],
    activate: [tool: ToolHostItem]
    update: [tool: ToolHostItem]
}

/**
 * Representa um host de ferramentas
 * Um host de ferramentas é onde as ferramentas ficam "hospedadas".
 * O host de ferramentas é responsável por registrar, preparar e ativar ferramentas.
 */
export class ToolHost extends EventEmitter<ToolHostEvents> {
    #toolMap = new Map<string, ToolHostItem>()

    /**
     * Mapa de ferramentas registradas
     */
    get toolMap() {
        return new Map(this.#toolMap)
    }

    /**
     * Prepara uma ferramenta para ser registrada
     * @param extensionId Extensão que registrou a ferramenta
     * @param meta Metadados da ferramenta
     * @returns Descartável para remover a ferramenta
     */
    prepare(extensionId: string, meta: ToolMeta): Disposable {
        const item: ToolHostItem = {
            meta,
            extensionId,
            handler: VoidToolHandler,
        }

        this.#toolMap.set(meta.id, item)

        this.emit('prepare', item)
        this.emit("update", item)

        return {
            dispose: () => this.unregister(meta.id)
        }
    }

    /**
     * Obtém as informações de uma ferramenta
     * @param toolId Identificador da ferramenta
     * @returns Informações da ferramenta
     * @throws Se a ferramenta não for encontrada
     */
    getTool(toolId: string): ToolHostItem {
        const item = this.#toolMap.get(toolId)

        if (!item) {
            throw new Error(`Tool "${toolId}" not found`)
        }

        return item
    }

    /**
     * Registra uma ferramenta definindo sua função de execução
     * @param toolId Identificador da ferramenta
     * @param handler Função que será executada quando a ferramenta for ativada
     * @returns Descartável para remover a ferramenta
     */
    register(toolId: string, handler: ToolHandler): Disposable {
        const item = this.getTool(toolId)

        if (item.handler !== VoidToolHandler) {
            throw new Error(`Tool "${toolId}" already registered`)
        }

        item.handler = handler

        this.emit("register", item)
        this.emit("update", item)

        return {
            dispose: () => this.unregister(toolId)
        }
    }

    /**
     * Remove uma ferramenta do host
     * @param toolId Identificador da ferramenta
     */
    unregister(toolId: string): void {
        const item = this.getTool(toolId)

        item.handler = VoidToolHandler

        this.#toolMap.delete(toolId)

        this.emit("unregister", item)
        this.emit("update", item)
    }

    /**
     * Ativa uma ferramenta
     * @param toolId Identificador da ferramenta
     */
    activate(toolId: string): void {
        const item = this.getTool(toolId)

        this.emit("activate", item)

        item.handler()
    }
}

export const tools = new ToolHost()