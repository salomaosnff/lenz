import { fetchManifest, isActive, loadExtension, unloadExtension } from "./loader";
import { extensionRecords, forgetExternal, saveExternal, setDisabled } from "./registry";

const recordOf = (id: string) => {
  const record = extensionRecords.get(id);
  if (!record) throw new Error(`There is no extension "${id}".`);
  return record;
};

/** Turns an extension on and remembers it. A failure stays in the record, and is thrown too. */
export async function enableExtension(id: string) {
  const record = recordOf(id);
  setDisabled(id, false);
  await loadExtension(id, record.folderUrl, { builtin: record.builtin });
}

/** Turns an extension off, and the ones that depend on it, and remembers it. */
export async function disableExtension(id: string) {
  recordOf(id);
  setDisabled(id, true);
  await unloadExtension(id);
}

/** Runs the extension again from its files, as they are now. Its dependents come back too. */
export async function reloadExtension(id: string) {
  const record = recordOf(id);
  const unloaded = isActive(id) ? await unloadExtension(id) : [];
  const restart = unloaded.length
    ? [id, ...unloaded.filter((other) => other !== id).reverse()]
    : [id];
  for (const other of restart) {
    const { folderUrl, builtin } = recordOf(other);
    // A dependent that fails must not stop the others from coming back.
    const result = loadExtension(other, folderUrl, { builtin, fresh: true });
    if (other === record.id) await result;
    else await result.catch(() => {});
  }
}

/** Loads an extension from the folder at `url` (the one with its `package.json`) and keeps it. */
export async function installFromUrl(input: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(input.trim(), location.href);
  } catch {
    throw new Error("This is not a valid URL.");
  }
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only http and https URLs can be loaded.");
  // Accept the address of the package.json as well as the one of its folder.
  url.hash = "";
  url.search = "";
  url.pathname = url.pathname.replace(/package\.json$/, "");
  if (!url.pathname.endsWith("/")) url.pathname += "/";

  const manifest = await fetchManifest(url.href, true);
  if (extensionRecords.has(manifest.name)) {
    throw new Error(`The extension "${manifest.name}" is already installed.`);
  }
  saveExternal({ id: manifest.name, url: url.href });
  setDisabled(manifest.name, false);
  // Kept even when it fails to start: the page shows the error, and Reload tries again.
  await loadExtension(manifest.name, url.href, { builtin: false, fresh: true });
  return manifest.name;
}

/** Removes an extension that was loaded from a URL. The ones shipped with the app stay. */
export async function uninstallExtension(id: string) {
  const record = recordOf(id);
  if (record.builtin) throw new Error("Built-in extensions cannot be removed.");
  await unloadExtension(id);
  forgetExternal(id);
  setDisabled(id, false);
  extensionRecords.delete(id);
}
