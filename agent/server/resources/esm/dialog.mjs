export function confirm(options) {
    const dialogStore = window.__LENZ_STORE__?.dialog?.();
  
    if (!dialogStore) {
      throw new Error("Editor not initialized yet");
    }

    return dialogStore.confirm(options);
}

export function prompt(options) {
    const dialogStore = window.__LENZ_STORE__?.dialog?.();
  
    if (!dialogStore) {
      throw new Error("Editor not initialized yet");
    }

    return dialogStore.prompt(options);
}