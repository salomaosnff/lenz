
/**
 * Registra um item no menu de contexto.
 * @param contextMenuId Identificador do item do menu de contexto deve ser igual ao campo `contributions.contextMenu.id` da extensão.
 * @param callback Função que será executada quando o item do menu de contexto for clicado.
 * @param options Opções para o item do menu de contexto.
 * @returns Um objeto que pode ser usado para remover o item do menu de contexto.
 */
export function registerContextMenu(
    _contextMenuId: string,
    _options?: {
      /** Retorna se o item do menu de contexto está visível **/
      when?(): boolean
  
      /** Retorna se o item do menu de contexto está desabilitado **/
      isDisabled?(): boolean
  
      /** Ação que será executada quando o item do menu de contexto for ativado **/
      handler(): void
    },
  ): Disposable {
    // TODO: Implementar registro de itens no menu de contexto
    throw new Error('Not implemented');
  }