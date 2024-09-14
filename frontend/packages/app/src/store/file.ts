import { defineStore } from "pinia";

import { prompt } from "lenz:dialog";

import * as fs from "lenz:fs";
import * as history from "lenz:history";
import { MenuItem } from "./menubar";

import icon_redo from "lenz:icons/redo";
import icon_undo from "lenz:icons/undo";

export class EditorFile {
  dirty = false;
  autoSaveTimer: number | null = null;

  constructor(
    private getAutoSave: () => boolean,
    public filepath: string,
    public data: Uint8Array
  ) {}

  static async open(filepath: string, getAutoSave: () => boolean) {
    const data = await fs.readFile(filepath);

    await history.drop(filepath);
    await history.save(filepath, data);

    return new EditorFile(getAutoSave, filepath, data);
  }

  triggerAutoSave() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    if (!this.getAutoSave()) {
      return;
    }

    this.autoSaveTimer = setTimeout(() => {
      this.save();
      this.autoSaveTimer = null;
    }, 5_000);
  }

  text() {
    if (typeof this.data === "string") {
      return this.data;
    }

    return new TextDecoder().decode(this.data);
  }

  async write(
    data: ArrayBufferView | ArrayBuffer | string,
    writeHistory = true
  ) {
    if (typeof data === "string") {
      data = new TextEncoder().encode(data);
    }

    if (data instanceof ArrayBuffer) {
      data = new Uint8Array(data);
    }

    this.data = data as Uint8Array;
    this.dirty = true;

    if (writeHistory) {
      await history.save(this.filepath, data);
    }

    this.triggerAutoSave();
  }

  async undo() {
    this.data = await history.undo(this.filepath);
    this.dirty = true;
    this.triggerAutoSave();
  }

  async redo() {
    this.data = await history.redo(this.filepath);
    this.dirty = true;
    this.triggerAutoSave();
  }

  async save(data = this.data) {
    await fs.writeFile(this.filepath, data);
    this.dirty = false;
  }
}

export const useFileStore = defineStore("file", () => {
  const settingsStore = useSettingsStore();
  const commandsStore = useCommandsStore();
  const hotkeysStore = useHotKeysStore();
  const menubarStore = useMenuBarStore();
  const openedFiles = ref<Map<string, EditorFile>>(new Map());
  const currentFilename = ref<string>();
  const currentFile = computed(() => {
    if (!currentFilename.value) {
      return;
    }

    return openedFiles.value.get(currentFilename.value);
  });

  async function openFile(filepath: string) {
    if (openedFiles.value.has(filepath)) {
      return openedFiles.value.get(filepath);
    }

    const file = await EditorFile.open(
      filepath,
      () => settingsStore.settings.files.autosave
    );

    openedFiles.value.set(filepath, file);
    currentFilename.value = filepath;

    return file;
  }

  function closeFile(filepath: string) {
    openedFiles.value.delete(filepath);
  }

  function saveFile(filepath: string) {
    const file = openedFiles.value.get(filepath);

    if (!file) {
      throw new Error(`File ${filepath} is not opened`);
    }

    return file.save();
  }

  async function writeFile(filepath: string, data: Uint8Array) {
    const file = openedFiles.value.get(filepath);

    if (!file) {
      throw new Error(`File ${filepath} is not opened`);
    }

    return file.write(data);
  }

  async function saveAll() {
    for (const file of openedFiles.value.values()) {
      if (file.dirty) {
        await file.save();
      }
    }
  }

  openFile("/home/sallon/Área de trabalho/hello.lenz/index.html");

  hotkeysStore.addHotKeys({
    "Ctrl+O": "file.open.html",
    "Ctrl+S": "file.save",
    "Ctrl+Z": "file.undo",
    "Ctrl+Y": "file.redo",
  });

  commandsStore.registerCommand({
    id: "file.open.html",
    name: "Abrir arquivo",
    description: "Abrir uma página HTML",
    async run() {
      const filepath = await prompt({
        message: "Informe o caminho para o arquivo:",
      });
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
      await currentFile.value?.undo();
    },
  });

  commandsStore.registerCommand({
    id: "file.redo",
    name: "Refazer",
    description: "Refazer a última ação",
    icon: icon_redo,
    async run() {
      await currentFile.value?.redo();
    },
  });

  menubarStore.addMenuItemsAt(["Arquivo"], [
    {
      title: "Abrir arquivo HTML",
      command: "file.open.html",
    },
    {
      title: "Salvar",
      command: "file.save",
    },
    { type: "separator" },
    {
      type: "checkbox-group",
      onUpdated(newValue: boolean) {
        settingsStore.settings.files.autosave = newValue;
      },
      getValue: () => settingsStore.settings.files.autosave,
      items: [
        {
          title: "Salvar automaticamente",
          checkedValue: true,
          uncheckedValue: false,
        },
      ],
    },
  ] as MenuItem[]);

  menubarStore.addMenuItemsAt(["Editar"], [
    {
      title: "Desfazer",
      command: "file.undo",
    },
    {
      title: "Refazer",
      command: "file.redo",
    },
  ] as MenuItem[]);

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
