import { ViewHost } from "../hosts";
import { ViewContent } from "../views";

/**
 * Registra uma visualização.
 * @param viewId Identificador da visualização deve ser igual ao campo `contributions.views.id` da extensão.
 * @param view Conteúdo da visualização.
 * @returns Um objeto que pode ser usado para remover a visualização.
 */
export function registerView(viewId: string, content: ViewContent) {
    ViewHost.setViewContent(viewId, content);
  
    return {
      dispose: () => ViewHost.removeView(viewId)
    }
  }