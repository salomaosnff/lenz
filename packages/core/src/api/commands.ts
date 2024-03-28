import CommandHost from "../hosts/command-host";
import { Disposable } from "../types";

/**
 * Registra um comando no editor.
 * @param commandId Identificador do comando deve ser igual ao campo `contributions.commands.id` da extensão.
 * @param callback Função que será executada quando o comando for chamado.
 * @returns Um objeto que pode ser usado para remover o comando.
 */
export function registerCommand(commandId: string, callback: () => void): Disposable {
    CommandHost.initializeCommand(commandId, callback);

    return {
        dispose() {
            CommandHost.removeCommand(commandId);
        },
    };
}