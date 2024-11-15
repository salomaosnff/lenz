import { defineStore } from "pinia";

import * as fs from "lenz:fs";


import { invoke } from "lenz:invoke";
import { isEqual } from "lodash-es";
import { useHistoryStore } from "./history";

import iconQuit from "lenz:icons/close_circle";
import iconSave from "lenz:icons/content_save";
import iconFile from 'lenz:icons/file_document_outline';
import icon_redo from "lenz:icons/redo";
import icon_undo from "lenz:icons/undo";

export class EditorFile {
  dirty = false;

  constructor(
    public filepath: string,
    public data: string
  ) {}

  static async open(filepath: string) {
    const data = await fs.readFile(filepath);

    return new EditorFile(filepath, new TextDecoder().decode(data));
  }

  text() {
    if (typeof this.data === "string") {
      return this.data;
    }

    return new TextDecoder().decode(this.data);
  }

  write(data: string) {
    if (isEqual(data, this.data)) {
      return;
    }

    this.data = data;
    this.dirty = true;
  }

  async save(data = this.data) {
    await fs.writeFile(this.filepath, data);
    this.dirty = false;
  }
}

export const useFileStore = defineStore("file", () => {
  const historyStore = useHistoryStore();
  const settingsStore = useSettingsStore();
  const commandsStore = useCommandsStore();
  const hotkeysStore = useHotKeysStore();
  const menubarStore = useMenuBarStore();
  const hooksStore = useHooksStore();

  const autoSaveTimers = new Map<string, number>();

  const openedFiles = ref<Map<string, EditorFile>>(new Map());
  const currentFilename = useLocalStorage<string>("lenz.file.last_opened", "");
  const currentFile = computed(() => {
    if (!currentFilename.value) {
      return;
    }

    return openedFiles.value.get(currentFilename.value);
  });

  function triggerAutoSave(filepath: string) {
    if (!settingsStore.settings?.files?.autosave) {
      return;
    }
    const timer = autoSaveTimers.get(filepath);

    if (timer) {
      clearTimeout(timer);
    }

    autoSaveTimers.set(
      filepath,
      setTimeout(() => {
        saveFile(filepath);
        autoSaveTimers.delete(filepath);
      }, settingsStore.settings?.files?.autosave?.interval ?? 3000)
    );
  }

  async function openFile(filepath: string) {
    if (openedFiles.value.has(filepath)) {
      return openedFiles.value.get(filepath);
    }

    historyStore.drop(filepath);

    const file = await EditorFile.open(filepath);

    historyStore.save(filepath, {
      data: file.data.slice(),
      selection: [],
    });

    openedFiles.value.set(filepath, file);
    currentFilename.value = filepath;

    return file;
  }

  function closeFile(filepath: string) {
    openedFiles.value.delete(filepath);
    historyStore.drop(filepath);
  }

  function saveFile(filepath: string) {
    const file = openedFiles.value.get(filepath);

    if (!file) {
      throw new Error(`File ${filepath} is not opened`);
    }

    return file.save();
  }

  async function writeFile(
    filepath: string,
    data: string,
    writeHistory = true
  ) {
    const file = openedFiles.value.get(filepath);

    if (!file) {
      throw new Error(`File ${filepath} is not opened`);
    }

    if (isEqual(data, file.data)) {
      return;
    }

    return hooksStore.callHooks("file.write", async () => {
      if (writeHistory) {
        historyStore.save(filepath, {
          data: data.slice(),
          selection:
            historyStore
              .get<{ selection: string[] }>(filepath)
              ?.selection?.slice() ?? [],
        });
      }

      file.write(data);

      triggerAutoSave(filepath);
    });
  }

  async function saveAll() {
    for (const file of openedFiles.value.values()) {
      if (file.dirty) {
        await file.save();
      }
    }
  }

  if (currentFilename.value && !openedFiles.value.has(currentFilename.value)) {
    openFile(currentFilename.value);
  }

  if (import.meta.env.PROD) {
    window.addEventListener("beforeunload", async () => {
      await commandsStore.executeCommand("app.quit");
    });
  }

  nextTick(() => {
    hotkeysStore.addHotKeys({
      "Ctrl+O": "file.open.html",
      "Ctrl+S": "file.save",
      "Ctrl+Z": "file.undo",
      "Ctrl+Y": "file.redo",
      "Ctrl+Q": "app.quit",
    });

    commandsStore.registerCommand({
      id: "file.open.html",
      name: "Abrir arquivo",
      icon: iconFile,
      description: "Abrir uma página HTML",
      async run() {
        const filepath = await commandsStore.executeCommand<string>(
          "dialog.file.open",
          {
            filters: {
              "Páginas HTML": ["*html"],
            },
          }
        );
        await openFile(filepath);
      },
    });

    commandsStore.registerCommand({
      id: "file.save",
      name: "Salvar",
      description: "Salvar alterações no arquivo atual",
      async run() {
        await currentFile.value?.save();
      },
    });

    commandsStore.registerCommand({
      id: "file.undo",
      name: "Desfazer",
      description: "Desfazer a última ação",
      icon: icon_undo,
      async run() {
        if (!currentFile.value) {
          return;
        }

        const { data } = (historyStore.undo(currentFile.value.filepath) ??
          {}) as {
          data: string;
          selection: string[];
        };

        writeFile(currentFile.value.filepath, data, false);
      },
    });

    commandsStore.registerCommand({
      id: "file.redo",
      name: "Refazer",
      description: "Refazer a última ação",
      icon: icon_redo,
      async run() {
        if (!currentFile.value) {
          return;
        }

        const { data } = (historyStore.redo(currentFile.value.filepath) ??
          {}) as {
          data: string;
          selection: string[];
        };

        writeFile(currentFile.value.filepath, data, false);
      },
    });

    menubarStore.extendMenu(
      [
        {
          title: "Abrir arquivo HTML",
          id: "file.open.html",
          command: "file.open.html",
        },
        {
          title: "Salvar",
          id: "file.save",
          icon: iconSave,
          command: "file.save",
        },
        { type: "separator", id: "file.separator" },
        {
          id: "file.autosave",
          type: "checkbox-group",
          onUpdated(newValue: boolean) {
            settingsStore.settings.files.autosave = newValue;
          },
          getValue: () => settingsStore.settings.files.autosave,
          items: [
            {
              id: "file.autosave.enabled",
              title: "Salvar automaticamente",
              checkedValue: true,
              uncheckedValue: false,
              before: ["app.quit"],
            },
          ],
        },
        {
          type: "separator",
          id: "app.quit.separator",
          before: ["app.quit"],
        },
        {
          id: "app.quit",
          title: "Sair da aplicação",
          command: "app.quit",
        },
      ],
      "file"
    );

    commandsStore.registerCommand({
      id: "app.quit",
      name: "Sair da aplicação",
      icon: iconQuit,
      description: "Fecha a aplicação",
      async run() {
        await saveAll();
        await invoke("app.quit");
        window.close();
      },
    });

    menubarStore.extendMenu(
      [
        {
          id: "file.undo",
          title: "Desfazer",
          command: "file.undo",
        },
        {
          id: "file.redo",
          title: "Refazer",
          command: "file.redo",
        },
      ],
      "edit"
    );
  });

  return {
    openedFiles,
    openFile,
    closeFile,
    saveFile,
    writeFile,
    saveAll,
    currentFile,
  };
});
