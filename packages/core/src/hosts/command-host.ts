import { NotInitialized } from '../const';
import { type EditorStateCommand } from '../editor';
import type { Command } from '../types';
import EventHost, { createAppEvent } from './event-host';
import ExtensionHost from './extension-host';
import { LogHost } from './index';

const commandMap = new Map<string, EditorStateCommand>();

/**
 * Prepara um comando no editor, deve ser chamado antes de inicializar o comando.
 * @param extensionId Identificador da extensão que registra o comando.
 * @param meta Metadados do comando.
 */
export function prepareCommand(extensionId: string, meta: Command) {
  const extension = ExtensionHost.getExtension(extensionId);

  if (!extension) {
    throw new Error(`Extension ${extensionId} not found`);
  }

  const command: EditorStateCommand = {
    extensionId,
    meta,
    handler: NotInitialized,
  };

  commandMap.set(meta.id, command);

  LogHost.debug(`[CommandHost] Command "${meta.id}" prepared for extension "${extensionId}"`);
}

/**
 * Inicializa um comando no editor, ou seja, associa uma função que será executada quando o comando for chamado.
 * @param commandId Identificador do comando.
 * @param handler Função que será executada quando o comando for chamado.
 */
export function initializeCommand(commandId: string, handler: EditorStateCommand['handler']) {
  const command = commandMap.get(commandId);

  if (!command) {
    throw new Error(`Command ${commandId} not found`);
  }

  if (command.handler !== NotInitialized) {
    throw new Error(`Command ${commandId} already initialized`);
  }

  command.handler = handler;

  EventHost.emit(createAppEvent('commands:init'), {
    ...command.meta,
    extension: ExtensionHost.getExtension(command.extensionId)?.meta,
  });
  LogHost.debug(`[CommandHost] Command "${command.meta.id}" from extension "${command.extensionId}" initialized!`);
}

/**
 * Remove um comando do editor.
 * @param commandId Identificador do comando.
 */
export function removeCommand(commandId: string) {
  commandMap.delete(commandId);

  EventHost.emit(createAppEvent('commands:remove'), commandId);
}

/**
 * Executa um comando no editor.
 * @param commandId Identificador do comando.
 * @param args Argumentos que serão passados para a função associada ao comando.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function execute(commandId: string, ...args: any[]) {
  const command = commandMap.get(commandId);

  if (!command) {
    throw new Error(`Command ${commandId} not found`);
  }

  if (command.handler === NotInitialized) {
    throw new Error(`Command ${commandId} not initialized`);
  }

  EventHost.emit(createAppEvent('commands:execute'), {
    commandId,
    args,
  });

  const result = command.handler(...args);

  EventHost.emit(createAppEvent('commands:executed'), {
    commandId,
    args,
  });

  return result;
}

/**
 * Host de comandos do editor.
 *
 * Este módulo é responsável por registrar e executar e controlar os comandos do editor.
 */
export default {
  prepareCommand,
  initializeCommand,
  removeCommand,
  execute,
};
