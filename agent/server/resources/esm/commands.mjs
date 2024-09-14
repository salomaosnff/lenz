export function addCommand(command, callback) {
  const commandStore = window.__LENZ_STORE__?.commands?.();

  if (!commandStore) {
    throw new Error("Editor not initialized yet");
  }

  commandStore.registerCommand(command, callback);

  return () => {
    commandStore.unregisterCommand(command);
  }
}

export function executeCommand(command, args) {
  const commandStore = window.__LENZ_STORE__?.commands?.();

  if (!commandStore) {
    throw new Error("Editor not initialized yet");
  }

  return commandStore.executeCommand(command, args);
}
