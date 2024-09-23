/**
 * Módulo para gerenciar atalhos de teclado
 * @module lenz:hotkeys 
 */

import type { LenzDisposer } from "./types.js";
import { ensureInitialized } from "./util.js";


/**
 * Mapeia combinacoes de teclas para comandos
 * @param hotKeys Mapeamento de teclas para comandos
 * @example
 * ```ts
 * addHotKeys({
 *  "Ctrl+S": 'file.save',
 *  "Ctrl+Z": 'history.undo',
 * });
 * @returns Disposer para remover as teclas de atalho
 */
export function addHotKeys(hotKeys: Record<string, string>): LenzDisposer {
  const hotkeysStore = ensureInitialized().hotkeys();

  hotkeysStore.addHotKeys(hotKeys);

  return () => {
    hotkeysStore.removeHotKeys(Object.keys(hotKeys));
  };
}
