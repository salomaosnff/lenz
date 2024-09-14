export function addHotKeys(hotKeys) {
  const hotkeysStore = window.__LENZ_STORE__?.hotkeys?.();

  if (!hotkeysStore) {
    throw new Error("Editor not initialized yet");
  }

  hotkeysStore.addHotKeys(hotKeys);

  return () => {
    hotkeysStore.removeHotKeys(Object.keys(hotKeys));
  }
}