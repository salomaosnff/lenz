/**
 * Módulo para gerenciar hooks de eventos
 * @module lenz:hooks 
 */

import { ensureInitialized } from "./util.js";

/**
 * Executa um callback antes de um evento ser disparado
 * @param event Evento a ser monitorado
 * @param callback Função a ser executada
 * @returns Disposer
 */
export function onBefore(event: string, callback: Function) {
  return ensureInitialized().hooks().onBefore(event, callback);
}

/**
 * Executa um callback depois de um evento ser disparado
 * @param event Evento a ser monitorado
 * @param callback Função a ser executada
 * @returns Disposer
 */
export function onAfter(event: string, callback: Function) {
  return ensureInitialized().hooks().onAfter(event, callback);
}

