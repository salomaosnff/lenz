import { Disposable } from "../types";
import { tools } from "../internal/tool";
import type { ToolHostEvents } from "../internal/tool";

/**
 * Registra uma ferramenta na barra de ferramentas.
 * @param toolId Identificador da ferramenta.
 * @param callback Função que será executada quando a ferramenta for ativada.
 * @returns Um objeto que pode ser usado para remover o item da barra de atividades.
 */
export function registerTool(toolId: string, callback: () => void): Disposable {
    console.log('tools.registerTool', toolId)
    return tools.register(toolId, callback)
}


/**
 * Escuta um evento no host de comandos.
 * @param event 
 * @param callback 
 * @returns 
 */
export function on<T extends keyof ToolHostEvents>(event: T, callback: ToolHostEvents[T]): Disposable {
    tools.on(event, callback as any)

    return {
        dispose: () => tools.off(event, callback as any)
    }
}