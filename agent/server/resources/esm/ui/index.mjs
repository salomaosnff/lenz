export function showWindow(options = {}) {
  const store = window.__LENZ_STORE__?.windows?.();

  if (!store) {
    throw new Error("Editor not initialized yet");
  }

  return store.createWindow(options);
}
