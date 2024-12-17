import type { Command, CommandContext } from "lenz:commands";
import { defineStore } from "pinia";

import iconFire from "lenz:icons/fire";
import iconAbout from "lenz:icons/information";

import aboutPage from "../assets/about.html?raw";

export const useCommandsStore = defineStore("commands", () => {
  const hooksStore = useHooksStore();
  const hotkeysStore = useHotKeysStore();
  const menubarStore = useMenuBarStore();
  const windowsStore = useWindowStore();
  const editorStore = useEditorStore();

  const frequencyMap = useLocalStorage<Record<string, number>>(
    "commands.frequency",
    {}
  );

  const commands = ref<Record<string, Command>>({});
  const showCommands = ref(false);

  function registerCommand(command: Command) {
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

        const context: CommandContext = {
          selection: editorStore.selectionRef,
          hover: editorStore.hoverRef,
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

        windowsStore.createWindow({
          content: (el) => {
            const page = new DOMParser().parseFromString(
              aboutPage,
              "text/html"
            );
            const heads = Array.from(page.head.querySelectorAll("link, style"));
            const body = Array.from(page.body.children);

            heads.forEach((head) => {
              el.appendChild(head);
            });

            body.forEach((child) => {
              el.appendChild(child);
            });

            const checkbox = el.querySelector(
              "#not-show-again"
            ) as HTMLInputElement;
            checkbox.checked =
              localStorage.getItem("about.notShowAgain") === "true";

            checkbox.addEventListener("change", () => {
              localStorage.setItem(
                "about.notShowAgain",
                checkbox.checked ? "true" : "false"
              );
            });

            return () => {
              heads.forEach((head) => {
                head.remove();
              });

              body.forEach((child) => {
                child.remove();
              });
            };
          },
          width: 600,
          height: Math.min(532, document.body.clientHeight - 64),
          resizable: false,
          collapsible: false,
          modal: true,
          movable: false,
          themed: true,
          title: "Sobre o Lenz Designer",
          onClose() {
            isAboutOpen = false;
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

  registerCommand({
    id: "view.preview",
    name: "Pré-visualizar",
    run({ getCurrentContent }) {
      const url = URL.createObjectURL(
        new Blob([getCurrentContent()], { type: "text/html" })
      );

      const win = window.open(url, "_blank");

      win?.addEventListener("close", () => {
        URL.revokeObjectURL(url);
      });
    },
  });

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
