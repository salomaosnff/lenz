import { defineStore } from "pinia";

export interface EditorCommand {
  id: string;
  name: string;
  description: string;
  icon?: string;
  run(...args: any): any;
}

export const useCommandsStore = defineStore("commands", () => {
  const hotkeysStore = useHotKeysStore();
  const menubarStore = useMenuBarStore();
  const commands = ref<Record<string, EditorCommand>>({});
  const editorStore = useEditorStore();
  const showCommands = ref(false);

  function registerCommand(command: EditorCommand) {
    if (!command.id) {
      throw new Error("Command id is required");
    }

    if (!command.name) {
      throw new Error("Command name is required");
    }

    if (typeof command.run !== "function") {
      throw new Error("Command run function is required");
    }

    if (commands.value[command.id]) {
      throw new Error(`Command with id ${command.id} already exists`);
    }

    commands.value[command.id] = command;
  }

  async function executeCommand<T>(id: string, ...args: any): Promise<T> {
    if (!commands.value[id]) {
      throw new Error(`Command with id ${id} does not exist`);
    }

    return commands.value[id].run(
      {
        getSelection: editorStore.getSelection,
        getSelection: editorStore.setSelection,
        getHover: editorStore.getHover,
        getCurrentDocument: editorStore.getCurrentDocument,
        getCurrentContent: editorStore.getCurrentContent,
      },
      ...args
    );
  }

  function unregisterCommand(id: string) {
    delete commands.value[id];
  }

  function getCommand(id: string) {
    return commands.value[id];
  }

  nextTick(() => {
    registerCommand({
      id: "commands.show",
      name: "Abrir paleta de comandos",
      description: "Exibe todos os comandos disponíveis",
      async run() {
        showCommands.value = true;
      },
    });
    hotkeysStore.addHotKeys({
      F1: "commands.show",
    });
    menubarStore.addMenuItemsAt(["Ajuda"], [
      {
        type: "item",
        title: "Abrir paleta de comandos",
        command: "commands.show",
      },
    ]);
  });

  return {
    showCommands,
    commands,
    getCommand,
    registerCommand,
    executeCommand,
    unregisterCommand,
  };
});
