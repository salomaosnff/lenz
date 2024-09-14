export function addMenuItemsAt(parent, items) {
    const menubarStore = window.__LENZ_STORE__?.menubar?.();

    if (!menubarStore) {
        throw new Error("Editor not initialized yet");
    }

    return menubarStore.addMenuItemsAt(parent, items);
}