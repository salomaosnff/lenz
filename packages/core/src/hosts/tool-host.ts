import { EventHost, ExtensionHost, LogHost } from '.';
import { NotInitialized } from '../const';
import { type EditorStateTool } from '../editor';
import type { ToolbarItem } from '../types';

const toolbarMap = new Map<string, EditorStateTool>();
let activeToolbarItem: string | null = null;

/**
 * Prepara um item na barra de ferramentas. Deve ser chamado antes de inicializar o item.
 */
export function prepareTool(extensionId: string, item: ToolbarItem) {
  if (toolbarMap.has(item.id)) {
    throw new Error(`Toolbar item with id "${item.id}" already exists`);
  }

  const toolbarItem: EditorStateTool = {
    priority: item.priority ?? 0,
    extensionId,
    meta: item,
    children: [],
    handler: NotInitialized,
  };

  if (item.parentId) {
    const parent = toolbarMap.get(item.parentId);

    if (!parent) {
      throw new Error(`Parent toolbar item with id "${item.parentId}" not found`);
    }

    parent.children.push(toolbarItem);
  }

  toolbarMap.set(item.id, toolbarItem);

  EventHost.emit('@app/tools:prepare', {
    ...item,
    extension: ExtensionHost.getExtension(extensionId)?.meta,
  });
}

/**
 * Inicializa um item na barra de ferramentas. Ou seja, associa uma função que será executada quando o item for clicado.
 * @param itemId Identificador do item.
 * @param handler Função que será executada quando o item for clicado.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initialize(itemId: string, handler: (...args: any[]) => void) {
  const item = toolbarMap.get(itemId);

  if (!item) {
    throw new Error(`Toolbar item with id "${itemId}" not found`);
  }

  if (item.handler !== NotInitialized) {
    throw new Error(`Toolbar item with id "${itemId}" already initialized`);
  }

  item.handler = handler;

  EventHost.emit('@app/tools:init', {
    ...item.meta,
    extension: ExtensionHost.getExtension(item.extensionId)?.meta,
  });
}

/**
 * Remove um item da barra de ferramentas.
 * @param id Identificador do item.
 */
export function removeToolbarItem(id: string) {
  const item = toolbarMap.get(id);

  if (!item) {
    return;
  }

  if (item.meta.parentId) {
    const parent = toolbarMap.get(item.meta.parentId);

    if (parent) {
      parent.children = parent.children.filter((child) => child.meta.id !== item.meta.id);
    }
  }

  toolbarMap.delete(id);
  EventHost.emit('@app/tools:remove', id);
}

/**
 * Ativa um item na barra de ferramentas.
 * @param itemId Identificador do item.
 */
export function activate(itemId: string) {
  const item = toolbarMap.get(itemId);

  if (!item) {
    throw new Error(`Toolbar item with id "${itemId}" not found`);
  }

  activeToolbarItem = itemId;

  if (item.handler !== NotInitialized) {
    item.handler();
  }

  EventHost.emit('@app/tools:activate', itemId);
}

/**
 * Retorna a ferramenta ativa.
 * @returns O identificador da ferramenta ativa.
 */
export function getActiveToolbarItem() {
  return activeToolbarItem;
}

export default {
  prepareTool,
  initialize,
  activate,
  removeToolbarItem,
  getActiveToolbarItem,
};
