/**
 * Módulo para gerenciar a barra de menu do editor
 * @module lenz:menubar
 */

import type { LenzDisposer } from "./types.js";
import { ensureInitialized } from "./util.js";

/**
 * Item de menu base
 * @internal
 */
interface MenuItemBase {
  /** Identificador do item */
  id?: string;

  /** Itens que este item deve aparecer antes */
  before?: string[];

  /** Itens que este item deve aparecer depois */
  after?: string[];

  /** Função que retorna se o item deve ser visível */
  isVisible?(state: any): boolean;
}

/**
 * Item de menu de ação
 */
export interface MenuItemAction extends MenuItemBase {
  /** Identificador do item */
  id: string;

  /** Tipo do item */
  type?: "item";

  /** O ícone deve ser uma string contendo um Path SVG de tamanho 24x24 */
  icon?: string;

  /** Título do item */
  title: string;

  /** Comando a ser executado ao clicar no item */
  command?: string;

  /** Atalho de teclado para o item */
  children?: MenuItem[];

  /** Função que retorna se o item deve ser desabilitado */
  isDisabled?(state: any): boolean;
}

/** Item de menu de separador */
export interface MenuItemSeparator extends MenuItemBase {
  type: "separator";
}

/**
 * Item de menu de grupo de checkbox
 */
export interface MenuItemCheckboxGroup<T = any> extends MenuItemBase {
  /** Identificador do item */
  id: string;

  /** Tipo do item */
  type: "checkbox-group";

  /** Título do grupo */
  title?: string;

  /** Função que retorna o valor do grupo */
  getValue(): T;

  /** Função chamada ao atualizar o valor do grupo */
  onUpdated?(newValue: T): void;

  /** Itens do grupo */
  items: MenuItemCheckbox<T>[];
}

/**
 * Item de menu de checkbox
 */
export interface MenuItemRadioGroup<T = any> extends MenuItemBase {
  /** Identificador do item */
  id: string;

  /** Tipo do item */
  type: "radio-group";

  /** Título do grupo */
  title?: string;

  /** Função que retorna o valor do grupo */
  getValue(): T;

  /** Função chamada ao atualizar o valor do grupo */
  onUpdated?(newValue: T): void;

  /** Itens do grupo */
  items: MenuItemRadioGroupItem<T>[];
}

/**
 * Item de menu de checkbox
 */
export interface MenuItemCheckbox<T = any> extends MenuItemBase {
  /** Identificador do item */
  id: string;

  /** Título do item */
  title: string;

  /** Comando a ser executado ao clicar no item */
  command?: string;

  /** Valor do item */
  checkedValue?: T;

  /** Valor do item quando desmarcado */
  uncheckedValue?: T;

  /** Função que retorna se o item deve ser desabilitado */
  isDisabled?(state: any): boolean;
}

/**
 * Item de menu de radio button
 */
export interface MenuItemRadioGroupItem<T = any> extends MenuItemBase {
  /** Identificador do item */
  id: string;

  /** Título do item */
  title: string;

  /** Valor do item */
  checkedValue: T;

  /** Comando a ser executado ao clicar no item */
  command?: string;

  /** Função que retorna se o item deve ser desabilitado */
  isDisabled?(state: any): boolean;
}

/**
 * Item de menu
 */
export type MenuItem =
  | MenuItemAction
  | MenuItemSeparator
  | MenuItemCheckboxGroup
  | MenuItemRadioGroup;

/**
 * Adiciona itens a barra de menu
 * @param items Itens a serem adicionados
 * @param parentId Id do item pai (Itens sem parentId ou com parentId inexistente serão adicionados na raiz)
 *
 * @example
 * ```ts
 * extendMenu([
 *  {
 *    id: "meu.menu",
 *    title: "Meu Menu",
 *    children: [
 *     {
 *      id: "meu.menu.item",
 *      title: "Meu Item",
 *      command: "meu.menu.item",
 *     },
 *   ],
 *  }
 * ], "edit");
 * ```
 */
export function extendMenu(items: MenuItem[], parentId?: string): LenzDisposer {
  const menubarStore = ensureInitialized().menubar?.();

  if (!menubarStore) {
    throw new Error("Editor not initialized yet");
  }

  return menubarStore.extendMenu(items, parentId);
}
