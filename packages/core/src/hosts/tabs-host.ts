import { EventHost, ExtensionHost } from '.';
import type { EditorStateTab } from '../editor';
import type { ToolbarItem } from '../types';

const tabMap = new Map<string, EditorStateTab>();
let activeTab: string | null = null;

/**
 * Prepara uma aba. Deve ser chamado antes de inicializar a aba.
 */
export function prepareTab(extensionId: string, item: ToolbarItem) {
    if (tabMap.has(item.id)) {
        throw new Error(`Toolbar item with id "${item.id}" already exists`);
    }

    const toolbarItem: EditorStateTab = {
        extensionId,
        meta: item,
        views: [],
    };

    tabMap.set(item.id, toolbarItem);

    EventHost.emit('@app/tabs:prepare', {
        ...item,
        extension: ExtensionHost.getExtension(extensionId)?.meta,
    });
}

/**
 * Remove um item da barra de ferramentas.
 * @param id Identificador do item.
 */
export function removeTab(id: string) {
    const item = tabMap.get(id);

    if (!item) {
        return;
    }

    tabMap.delete(id);
    EventHost.emit('@app/tabs:remove', id);
}

/**
 * Ativa uma aba.
 * @param itemId Identificador do item.
 */
export function activate(itemId: string) {
    const item = tabMap.get(itemId);

    if (!item) {
        throw new Error(`Toolbar item with id "${itemId}" not found`);
    }

    activeTab = itemId;

    EventHost.emit('@app/tabs:activate', {
        ...item.meta,
        extension: ExtensionHost.getExtension(item.extensionId)?.meta,
    });
}

/**
 * Retorna a aba ativa.
 * @returns O identificador da aba ativa.
 */
export function getActiveTab() {
    return activeTab;
}

export default {
    prepareTab,
    activate,
    removeTab,
};
