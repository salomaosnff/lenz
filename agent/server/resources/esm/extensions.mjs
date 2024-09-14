export function getExtension(id) {
  const extensionsStore = window.__LENZ_STORE__?.extensions?.();

  if (!extensionsStore) {
    throw new Error("Editor not initialized yet");
  }

  return extensionsStore.getExtension(id);
}
