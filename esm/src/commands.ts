/**
 * Módulo para gerenciar e executar comandos do editor
 * @module lenz:commands 
 */

import type { LenzDisposer } from "./types.js";
import { ensureInitialized } from "./util.js";

/**
 * Representa o contexto de um comando
 */
export interface CommandContext {
  /**
   * Retorna a seleção atual do editor
   * @deprecated Utilize `selection` obter reatividade.
   */
  getSelection(): Set<Selection>;

  /**
   * Define a seleção do editor
   * @param selection
   * @deprecated Utilize `selection` obter reatividade.
   */
  setSelection(selection: HTMLElement[]): void;

  /**
   * Retorna o conteúdo do arquivo aberto no editor
   */
  getCurrentContent(): string;

  /**
   * Retorna o documento HTML atualmente aberto no editor
   */
  getCurrentDocument(): Document;
}

/**
 * Representa um comando do editor
 */
export interface Command {
  /** Identificador único do comando */
  id: string;

  /**
   * Nome do comando
   *
   * Caso não seja informado, o nome do comando não será exibido
   * na paleta de comandos
   */
  name?: string;

  /** Descrição do comando */
  description?: string;

  /** Ícone do comando deve ser uma string contendo um Path de tamanho 16x16 */
  icon?: string;

  /** Função que será executada ao chamar o comando */
  run(context: CommandContext, ...args: any[]): any;
}

/**
 * Adiciona um comando ao editor
 * @param command Identificador único do comando
 * @returns Disposer para remover o comando
 *
 * @example
 * ```ts
 * import iconEarth from "lenz:icons/earth";
 * 
 * addCommand({
 *  id: "hello",
 *  name: "Exibir mensagem", // Se não informado, este comando não será exibido na paleta de comandos e não poderá ser executado programaticamente
 *  description: "Exibe uma mensagem no console",
 *  icon: iconEarth,
 *  run(context) {
 *    console.log("Olá, mundo!");
 *  }
 * });
 */
export function addCommand(command: Command): LenzDisposer {
  const commandStore = ensureInitialized().commands();

  commandStore.registerCommand(command);

  return () => {
    commandStore.unregisterCommand(command);
  };
}

/**
 * Executa um comando registrado no editor
 * @param command Identificador único do comando
 * @param args Argumentos que serão passados para o comando
 * @returns Resultado da execução do comando
 */
export function executeCommand<T>(command: string, ...args: any[]): Promise<T> {
  const commandStore = ensureInitialized().commands();

  if (!commandStore) {
    throw new Error("Editor not initialized yet");
  }

  return commandStore.executeCommand(command, args);
}
