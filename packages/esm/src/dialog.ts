/**
 * Módulo para criar diálogos de confirmação e prompts
 * @module lenz:dialog
 */

import { ensureInitialized } from "./util.js";

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
export function confirm(options: ConfirmDialogOptions) {
  return ensureInitialized().dialog().confirm(options);
}

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
   * Oculta os caracteres digitados
   */
  hidden?: boolean;

  /**
   * Texto exibido no campo de texto quando vazio
   */
  placeholder?: string;

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

  /**
   * Tipo do campo de texto
   * @default "text"
   */
  inputType?:
    | "text"
    | "password"
    | "email"
    | "number"
    | "tel"
    | "url"
    | "search"
    | "date"
    | "time"
    | "datetime-local"
    | "month"
    | "week"
    | "color";

  /**
   * Função que retorna sugestões para o campo de texto
   * @param value Texto digitado pelo usuário
   */
  getSuggestions?(value: string): Promise<PromptSuggestion[]>;
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
export function prompt(options: PromptDialogOptions) {
  return ensureInitialized().dialog().prompt(options);
}

/**
 * Representa uma sugestão para um prompt
 */
export interface PromptSuggestion {
  /** Texto da sugestão */
  title: string;

  /** Descrição da sugestão */
  description?: string;

  /** Valor a ser retornado caso a sugestão seja selecionada */
  value: any;
}

/**
 * Cria uma função de busca de sugestões para um campo de texto
 * @param suggestions Lista de sugestões disponíveis
 * @returns Função que retorna as sugestões que contém o texto digitado pelo usuário
 */
export function searchSuggestions(suggestions: PromptSuggestion[]) {
  return async (value: string) => {
    const lower = value.toLowerCase().trim();

    if (!lower) {
      return suggestions;
    }

    return suggestions.filter((s) => {
      const text = String(s.title)
        .concat(s.description ?? "")
        .concat(s.value ?? "")
        .toLowerCase()
        .trim();

      if (!text) {
        return false;
      }

      return text.includes(lower);
    });
  };
}
