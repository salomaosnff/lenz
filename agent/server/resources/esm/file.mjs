function ensureStore() {
    const store = window.__LENZ_STORE__?.files?.();

    if (!store) {
        throw new Error("Editor not initialized yet");
    }

    return store;
}

export function getCurrentFile() {
    return ensureStore().currentFile;
}

export async function open(filepath) {
    await ensureStore().openFile(filepath);
}

export async function write(content, writeHistory = true) {
    const store = ensureStore();
    let lastContent = store.content;

    if (typeof content === 'function') {
        content = (await content(lastContent)) ?? lastContent;
    }
   
    
    await store.writeFile(store.currentFile.filepath, content, writeHistory);
}

export async function save() {
    await getCurrentFile().save();
}