/**
 * Módulo para criar diálogos de confirmação e prompts
 * @module lenz:dialog
 */
/**
 * Opções da janela de confirmação
 */
export interface ConfirmDialogOptions {
    /** Título da janela de confirmação */
    title: string;
    /** Mensagem exibida na janela de confirmação */
    message: string;
    /**
     * Texto do botão de confirmação
     * @default "OK"
     */
    confirmText?: string;
    /**
     * Texto do botão de cancelamento
     * @default "Cancelar"
     */
    cancelText?: string;
}
/**
 * Exibe uma janela de confirmação
 * @param options Opções da janela de confirmação
 * @returns Promise que será resolvida com `true` se o usuário confirmar a ação ou `false` caso contrário.
 * @example
 * ```ts
 * const confirmed = await confirm({
 *   title: "Confirmação",
 *   message: "Deseja realmente excluir o item selecionado?"
 * });
 */
export declare function confirm(options: ConfirmDialogOptions): any;
/**
 * Opções da janela de prompt
 */
export interface PromptDialogOptions {
    /** Título da janela de prompt */
    title: string;
    /** Mensagem exibida na janela de prompt */
    message: string;
    /** Valor padrão do campo de texto */
    defaultValue?: string;
    /**
     * Texto do botão de confirmação
     * @default "OK"
     */
    confirmText?: string;
    /**
     * Texto do botão de cancelamento
     * @default "Cancelar"
     */
    cancelText?: string;
}
/**
 * Exibe uma janela de prompt para o usuário inserir um texto
 * @param options Opções da janela de prompt
 * @returns Promise que será resolvida com o texto inserido pelo usuário ou o valor padrão caso o usuário cancele a ação.
 * @example
 * ```ts
 * const name = await prompt({
 *  title: "Informe seu nome",
 *  message: "Digite seu nome completo",
 *  defaultValue: "Fulano de Tal"
 * });
 * ```
 */
export declare function prompt(options: PromptDialogOptions): any;
