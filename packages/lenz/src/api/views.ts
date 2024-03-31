import { ViewController } from "../internal/view";
import { views } from "../internal";

/**
 * Registra uma visualização.
 * @param viewId Identificador da visualização deve ser igual ao campo `contributions.views.id` da extensão.
 * @param controller Controlador da visualização.
 * @returns Um objeto que pode ser usado para remover a visualização.
 */
export function registerView(viewId: string, controller: ViewController) {
  return views.register(viewId, controller);
}