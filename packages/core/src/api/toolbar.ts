import { Disposable } from "../types";
import ToolHost from "../hosts/tool-host";

/**
 * Registra um item na barra de atividades.
 * @param activityBarId Identificador do item da barra de atividades deve ser igual ao campo `contributions.activityBar.id` da extensão.
 * @param callback Função que será executada quando o item da barra de atividades for clicado.
 * @returns Um objeto que pode ser usado para remover o item da barra de atividades.
 */
export function registerToolbarItem(toolbarId: string, callback: () => void): Disposable {
    ToolHost.initialize(toolbarId, callback);
  
    return {
      dispose() {
        ToolHost.removeToolbarItem(toolbarId);
      },
    };
  }