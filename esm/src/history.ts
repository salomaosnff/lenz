
/**
 * Módulo para gerenciamento de históricos
 * @module lenz:history 
*/

import { ensureInitialized } from "./util.js";

/**
 * Obtém o histórico de um estado ou cria um novo
 * @param key Identificador do estado
 * @param initialData Dados iniciais
 * @returns
 */
export function ensureHistory(key: string, initialData: string) {
  return ensureInitialized().history().ensureHistory(key, initialData);
}

/**
 * Salva um novo estado
 * @param key Identificador do estado
 * @param data Dados a serem salvos
 * @returns
 */
export function save(key: string, data: string) {
  return ensureInitialized().history().save(key, data);
}

/**
 * Volta para o estado anterior
 * @param key 
 * @returns 
 */
export function undo(key: string) {
  return ensureInitialized().history().undo(key);
}

/**
 * Refaz o próximo estado
 * @param key 
 * @returns 
 */
export function redo(key: string) {
  return ensureInitialized().history().redo(key);
}

/**
 * Exclui todo o histórico deste estado
 * @param key 
 * @returns 
 */
export function drop(key: string) {
  return ensureInitialized().history().drop(key);
}

/**
 * Obtém o estado atual
 * @param key 
 * @returns 
 */
export function read(key: string) {
  return ensureInitialized().history().read(key);
}

/**
 * Retorna se é possível voltar ao estado atual
 * @param key 
 * @returns 
 */
export function canUndo(key: string) {
  return ensureInitialized().history().canUndo(key);
}

/**
 * Retorna se é possível refazer refazer o próximo estado
 * @param key 
 * @returns 
 */
export function canRedo(key: string) {
  return ensureInitialized().history().canRedo(key);
}
