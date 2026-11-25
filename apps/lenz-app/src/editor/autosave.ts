import { watch } from "vue";
import { useStorage } from "@vueuse/core";
import type { Disposable } from "lenz-sdk";
import { useWorkspaceStore } from "../fs/workspace";
import { useEditorStore } from "./store";

/** On by default: the project lives in the browser, and nobody should lose work to a closed tab. */
export const autosaveEnabled = useStorage("lenz:autosave", true);

/** How long (ms) without a change before a file is saved. */
export const AUTOSAVE_DELAY = 1000;

/**
 * Saves the files of the project on its own: shortly after the last change to each one, and at
 * once when the page loses the user's attention (another window, another browser tab). A file
 * that is not from the project (a new one, or from the file picker) has nowhere to be written
 * and is left alone. Call it after Pinia is installed. Dispose to stop.
 */
export function installAutosave(delay = AUTOSAVE_DELAY): Disposable {
  const editor = useEditorStore();
  const workspace = useWorkspaceStore();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  function save(id: string) {
    clearTimeout(timers.get(id));
    timers.delete(id);
    const tab = editor.tabs.find((t) => t.id === id);
    if (!autosaveEnabled.value || !tab || !editor.isDirty(tab) || !workspace.isFileBacked(id))
      return;
    // A failure was already shown to the user, and the file stays unsaved. It is tried again
    // with the next change, not in a loop.
    editor.save(id).catch(() => {});
  }

  /** (Re)starts the wait of every file with something to save. */
  function schedule() {
    if (!autosaveEnabled.value) return;
    for (const tab of editor.tabs) {
      if (!editor.isDirty(tab) || !workspace.isFileBacked(tab.id)) continue;
      clearTimeout(timers.get(tab.id));
      timers.set(
        tab.id,
        setTimeout(() => save(tab.id), delay),
      );
    }
  }

  function flush() {
    for (const id of timers.keys()) save(id);
  }

  const onHidden = () => {
    if (document.visibilityState === "hidden") flush();
  };
  // Where there is no page (tests), the timers are all there is.
  const inPage = typeof window !== "undefined" && typeof document !== "undefined";

  // Any change to the content of a tab, or turning it on, starts the wait again.
  const stopWatching = watch(
    [() => editor.tabs.map((tab) => tab.content), autosaveEnabled],
    schedule,
  );
  if (inPage) {
    window.addEventListener("blur", flush);
    document.addEventListener("visibilitychange", onHidden);
  }

  return {
    dispose() {
      stopWatching();
      if (inPage) {
        window.removeEventListener("blur", flush);
        document.removeEventListener("visibilitychange", onHidden);
      }
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    },
  };
}
