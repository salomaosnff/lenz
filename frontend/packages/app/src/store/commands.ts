import { createChannel } from "lenz:ui";
import { defineStore } from "pinia";
import aboutPage from "../assets/about.html?raw";

import iconFire from "lenz:icons/fire";
import iconAbout from "lenz:icons/information";

export interface EditorCommand {
  id: string;
  name: string;
  description: string;
  icon?: string;
  run(...args: any): any;
}

export const useCommandsStore = defineStore("commands", () => {
  const hooksStore = useHooksStore();
  const hotkeysStore = useHotKeysStore();
  const menubarStore = useMenuBarStore();
  const windowsStore = useWindowStore();
  const editorStore = useEditorStore();

  const frequencyMap = useLocalStorage<Record<string, number>>("commands.frequency", {});

  const commands = ref<Record<string, EditorCommand>>({});
  const showCommands = ref(false);

  function registerCommand(command: EditorCommand) {
    return hooksStore.callHooks(
      "commands.register",
      () => {
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
      },
      command
    );
  }

  async function executeCommand<T>(id: string, ...args: any): Promise<T> {
    return hooksStore.callHooks(
      "commands.execute",
      async () => {
        if (!commands.value[id]) {
          throw new Error(`Command with id ${id} does not exist`);
        }

        const context = {
          selection: editorStore.selectionRef.clone(),
          getSelection: editorStore.getSelection,
          setSelection: editorStore.setSelection,
          getHover: editorStore.getHover,
          getCurrentDocument: editorStore.getCurrentDocument,
          getCurrentContent: editorStore.getCurrentContent,
        };

        frequencyMap.value[id] = (frequencyMap.value[id] || 0) + 1;

        return hooksStore.callHooks(
          `commands.execute.${id}`,
          () => commands.value[id].run(context, ...args),
          context,
          ...args
        );
      },
      id,
      ...args
    );
  }

  function unregisterCommand(id: string) {
    return hooksStore.callHooks(
      "commands.unregister",
      () =>
        hooksStore.callHooks(`commands.unregister.${id}`, () => {
          delete commands.value[id];
        }),
      id
    );
  }

  function getCommand(id: string) {
    return commands.value[id];
  }

  nextTick(() => {
    registerCommand({
      id: "commands.palette.open",
      name: "Abrir paleta de comandos",
      icon: iconFire,
      description: "Exibe todos os comandos disponíveis",
      async run() {
        showCommands.value = true;
      },
    });

    let isAboutOpen = false;

    registerCommand({
      id: "help.about",
      name: "Sobre",
      description: "Sobre o projeto",
      icon: iconAbout,
      async run() {
        if (isAboutOpen) {
          return;
        }

        isAboutOpen = true;

        const [tx, rx] = createChannel();

        rx.addListener((value: any) => {
          localStorage.setItem("about.notShowAgain", value ? "true" : "false");
        });

        windowsStore.createWindow({
          content: aboutPage,
          width: 600,
          height: Math.min(532, document.body.clientHeight - 64),
          resizable: false,
          modal: true,
          movable: false,
          themed: true,
          title: "Sobre o Lenz Designer",
          data: {
            notShowAgain: localStorage.getItem("about.notShowAgain") === "true",
            tx,
          },
          onClose() {
            isAboutOpen = false;
            tx.close()
          },
        });
      },
    });

    hotkeysStore.addHotKeys({
      Space: "commands.palette.open",
    });

    menubarStore.extendMenu(
      [
        {
          id: "commands.palette.open",
          type: "item",
          title: "Abrir paleta de comandos",
          command: "commands.palette.open",
          before: ["help.site.separator"],
        },
      ],
      "help"
    );

    if (localStorage.getItem("about.notShowAgain") !== "true") {
      executeCommand("help.about");
    }
  });

  function getFrequency(id: string) {
    return frequencyMap.value[id] || 0;
  }

  return {
    showCommands,
    commands,
    getFrequency,
    getCommand,
    registerCommand,
    executeCommand,
    unregisterCommand,
  };
});
