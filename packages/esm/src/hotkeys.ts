/**
 * Módulo para gerenciar atalhos de teclado
 * @module lenz:hotkeys
 */

import type { LenzDisposer } from "./types.js";
import { ensureInitialized } from "./util.js";

export namespace KeyTypes {
  /**
   * Teclas de modificação
   */
  export type Modifier = "Ctrl" | "Alt" | "Shift" | "Cmd";

  /**
   * Teclas de navegação
   */
  export type Navigation =
    | "ArrowUp"
    | "ArrowDown"
    | "ArrowLeft"
    | "ArrowRight"
    | "Home"
    | "End"
    | "PageUp"
    | "PageDown";

  /**
   * Teclas de função
   */
  export type Function =
    | "F1"
    | "F2"
    | "F3"
    | "F4"
    | "F5"
    | "F6"
    | "F7"
    | "F8"
    | "F9"
    | "F10"
    | "F11"
    | "F12";

  /**
   * Teclas especiais
   */
  export type Special =
    | "Enter"
    | "Esc"
    | "Tab"
    | "Space"
    | "Backspace"
    | "Delete"
    | "CapsLock"
    | "NumLock"
    | "ScrollLock"
    | "PrintScreen"
    | "Insert"
    | "Pause";

  /**
   * Teclas de símbolos
   */
  export type Symbol =
    | "Plus"
    | "-"
    | "="
    | ";"
    | ","
    | "."
    | "/"
    | "\\"
    | "'"
    | "`"
    | "["
    | "]";

  /**
   * Teclas alfabéticas
   */
  export type Alphabetic =
    | "A"
    | "B"
    | "C"
    | "D"
    | "E"
    | "F"
    | "G"
    | "H"
    | "I"
    | "J"
    | "K"
    | "L"
    | "M"
    | "N"
    | "O"
    | "P"
    | "Q"
    | "R"
    | "S"
    | "T"
    | "U"
    | "V"
    | "W"
    | "X"
    | "Y"
    | "Z";

  /**
   * Teclas numéricas
   */
  export type Number =
    | "0"
    | "1"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7"
    | "8"
    | "9";
}

/**
 * Representa uma tecla qualquer do teclado
 */
export type AnyKey =
  | KeyTypes.Modifier
  | KeyTypes.Navigation
  | KeyTypes.Function
  | KeyTypes.Special
  | KeyTypes.Symbol
  | KeyTypes.Alphabetic
  | KeyTypes.Number;

type ExcludeRepeated<T> =
  T extends `${infer A}+${infer B}+${infer C}+${infer D}`
    ? `${A}+${Exclude<B, A | C | D>}+${Exclude<C, A | B | D>}+${Exclude<D, A | B | C>}`
    : T extends `${infer A}+${infer B}+${infer C}`
      ? `${A}+${Exclude<B, A | C>}+${Exclude<C, A | B>}`
      : T extends `${infer A}+${infer B}`
        ? `${A}+${Exclude<B, A>}`
        : T;
/**
 * Representa uma combinação de teclas
 */
export type Hotkey =
  | AnyKey
  | ExcludeRepeated<`${KeyTypes.Modifier}+${AnyKey}`>
  | ExcludeRepeated<`${KeyTypes.Modifier}+${KeyTypes.Modifier}+${AnyKey}`>
  | ExcludeRepeated<`${KeyTypes.Modifier}+${KeyTypes.Modifier}+${KeyTypes.Modifier}+${AnyKey}`>;

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
