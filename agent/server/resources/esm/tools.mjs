export function addTool(tool, hooks) {
    const toolsStore = window.__LENZ_STORE__?.tools?.();
    
    if (!toolsStore) {
        throw new Error("Editor not initialized yet");
    }
    
    toolsStore.registerTool(tool, hooks);
    
    return () => {
        toolsStore.unregisterTool(tool.id);
    }
}