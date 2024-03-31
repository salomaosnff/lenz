import { Disposable } from "../types";

/**
 * Registra um atalho de teclado.
 * @param key Combinação de teclas.
 * @param callback Função que será executada quando o atalho for acionado.
 * @returns Um objeto que pode ser usado para remover o atalho.
 */
export function registerKeybinding(key: string, callback: () => void): Disposable {
  const shortcut = new nw.Shortcut({
    key,
    active: callback,
    failed: () => {
      console.error(`Failed to register keybinding: ${key}`);
    },
  });

  return { dispose: () => nw.App.unregisterGlobalHotKey(shortcut) };
}