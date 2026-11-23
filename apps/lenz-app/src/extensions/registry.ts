import { reactive } from "vue";
import type { ExtensionManifest } from "lenz-sdk";

export type ExtensionStatus = "loading" | "active" | "inactive" | "error";

/** What the app knows about an installed extension, loaded or not. */
export interface ExtensionRecord {
  id: string;
  /** The folder with its `package.json`, absolute. */
  folderUrl: string;
  /** Shipped with the app, as opposed to loaded from a URL by the user. */
  builtin: boolean;
  /** Known once its `package.json` was read. */
  manifest?: ExtensionManifest;
  status: ExtensionStatus;
  error?: string;
}

/** Reactive, so the extensions screen follows every load, unload and failure. */
export const extensionRecords = reactive(new Map<string, ExtensionRecord>());

export function updateRecord(
  id: string,
  patch: Partial<ExtensionRecord> & Pick<ExtensionRecord, "folderUrl">,
) {
  const current = extensionRecords.get(id);
  extensionRecords.set(id, { builtin: false, status: "loading", ...current, id, ...patch });
}

export const titleOf = (record: ExtensionRecord) => record.manifest?.displayName ?? record.id;

// What survives a reload of the page: the extensions turned off and the ones loaded from a URL.
const DISABLED_KEY = "lenz:extensions:disabled";
const EXTERNAL_KEY = "lenz:extensions:external";

function read<T>(key: string): T[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
function write(key: string, value: unknown[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be blocked; the choice then only lasts until the page closes.
  }
}

export const disabledIds = () => read<string>(DISABLED_KEY);
export const setDisabled = (id: string, disabled: boolean) =>
  write(DISABLED_KEY, [...disabledIds().filter((d) => d !== id), ...(disabled ? [id] : [])]);

export interface ExternalExtension {
  id: string;
  url: string;
}
export const externalExtensions = () => read<ExternalExtension>(EXTERNAL_KEY);
export const saveExternal = (extension: ExternalExtension) =>
  write(EXTERNAL_KEY, [...externalExtensions().filter((e) => e.id !== extension.id), extension]);
export const forgetExternal = (id: string) =>
  write(
    EXTERNAL_KEY,
    externalExtensions().filter((e) => e.id !== id),
  );
