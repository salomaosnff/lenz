/**
 * Módulo para gerenciar a barra de menu do editor
 * @module lenz:menubar 
 */

import type { LenzDisposer } from "./types.js";
import { ensureInitialized } from "./util.js";

/**
 * Item padrão de um menu
 */
export interface MenuItemAction {
  type?: "item";
  title: string;

  /** Comando a ser executado ao clicar no item */
  command?: string;

  /**
   * Retorna se o item deve ser exibido ou não
   * @param state Estado atual do editor
   */
  isVisible?(state: any): boolean;

  /**
   * Retorna se o item deve estar desabilitado ou não
   * @param state Estado atual do editor
   */
  isDisabled?(state: any): boolean;

  /**
   * Itens filhos do item atual
   */
  children?: MenuItem[];
}

/**
 * Representa um separador de itens de menu
 */
export interface MenuItemSeparator {
  type: "separator";
}

/**
 * Representa um grupo de checkboxes
 */
export interface MenuItemCheckboxGroup<T = any> {
  type: "checkbox-group";
  title?: string;

  /**
   * Retorna o valor atual do grupo de checkboxes
   */
  getValue(): T;

  /**
   * Função chamada quando o valor do grupo de checkboxes é atualizado
   * @param newValue Novo valor do grupo de checkboxes
   */
  onUpdated?(newValue: T): void;

  /** Itens de checkboxes do grupo */
  items: MenuItemCheckbox<T>[];
}

/**
 * Representa um grupo de radio buttons
 */
export interface MenuItemRadioGroup<T = any> {
  type: "radio-group";
  title?: string;

  /**
   * Retorna o valor atual do grupo de radio buttons
   */
  getValue(): T;

  /**
   * Função chamada quando o valor do grupo de radio buttons é atualizado
   * @param newValue Novo valor do grupo de radio buttons
   */
  onUpdated?(newValue: T): void;

  /**
   * Itens de radio buttons do grupo
   */
  items: MenuItemRadioGroupItem<T>[];
}

/**
 * Representa um item de checkbox
 */
export interface MenuItemCheckbox<T = any> {
  title: string;

  /** Comando a ser executado ao clicar no item */
  command?: string;

  /** Valor retornado quando o checkbox for marcado */
  checkedValue?: T;

  /** Valor retornado quando o checkbox for desmarcado */
  uncheckedValue?: T;

  /**
   * Retorna se o item deve estar desabilitado ou não
   * @param state
   */
  isDisabled?(state: any): boolean;

  /**
   * Retorna se o item deve ser exibido ou não
   * @param state
   */
  isVisible?(state: any): boolean;
}

/**
 * Representa um item de radio button
 */
export interface MenuItemRadioGroupItem<T = any> {
  title: string;

  /** Valor retornado quando o radio button for selecionado */
  checkedValue: T;

  /** Comando a ser executado ao clicar no item */
  command?: string;

  /** Retorna se o item deve estar desabilitado ou não */
  isDisabled?(state: any): boolean;

  /** Retorna se o item deve ser exibido ou não */
  isVisible?(state: any): boolean;
}

/**
 * Representa um item de menu
 */
export type MenuItem =
  | MenuItemAction
  | MenuItemSeparator
  | MenuItemCheckboxGroup
  | MenuItemRadioGroup;

/**
 * Insere um novo item na barra de menu
 * @param parent Caminho do item pai
 * @param items Itens a serem inseridos
 * @returns Disposer para remover os itens
 */
export function addMenuItemsAt(
  parent: string[],
  items: MenuItem[]
): LenzDisposer {
  const menubarStore = ensureInitialized().menubar?.();

  if (!menubarStore) {
    throw new Error("Editor not initialized yet");
  }

  return menubarStore.addMenuItemsAt(parent, items);
}
