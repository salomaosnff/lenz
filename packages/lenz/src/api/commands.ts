import { CommandHostEvents } from "../internal/command";
import { commands } from "../internal";
import { Disposable } from "../types";

/**
 * Registra um comando no editor.
 * @param commandId Identificador do comando deve ser igual ao campo `contributions.commands.id` da extensão.
 * @param callback Função que será executada quando o comando for chamado.
 * @returns Um objeto que pode ser usado para remover o comando.
 */
export function registerCommand(commandId: string, callback: () => void): Disposable {
    return commands.register(commandId, callback)
}

/**
 * Escuta um evento no host de comandos.
 * @param event 
 * @param callback 
 * @returns 
 */
export function on<T extends keyof CommandHostEvents>(event: T, callback: CommandHostEvents[T]): Disposable {
    commands.on(event, callback as any)

    return {
        dispose: () => commands.off(event, callback as any)
    }
}