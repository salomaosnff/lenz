import { defineStore } from "pinia";

const ModifierList = ["Ctrl", "Alt", "Shift", "Cmd"] as const;
const Modifier = new Set(ModifierList);

type Modifier = typeof Modifier extends Set<infer T> ? T : never;

type Navigation =
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "Home"
  | "End"
  | "PageUp"
  | "PageDown";

type Function =
  | "F1"
  | "F2"
  | "F3"
  | "F4"
  | "F5"
  | "F6"
  | "F7"
  | "F8"
  | "F9"
  | "F10"
  | "F11"
  | "F12";

type Special =
  | "Enter"
  | "Esc"
  | "Tab"
  | "Space"
  | "Backspace"
  | "Delete"
  | "CapsLock"
  | "NumLock"
  | "ScrollLock"
  | "PrintScreen"
  | "Insert"
  | "Pause";

type Symbol =
  | "Plus"
  | "-"
  | "="
  | ";"
  | ","
  | "."
  | "/"
  | "\\"
  | "'"
  | "`"
  | "["
  | "]";

type Letter =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  | "P"
  | "Q"
  | "R"
  | "S"
  | "T"
  | "U"
  | "V"
  | "W"
  | "X"
  | "Y"
  | "Z";

type Number = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

export type Key =
  | Modifier
  | Navigation
  | Function
  | Special
  | Symbol
  | Letter
  | Number;

export type Hotkey =
  | Key
  | `${Modifier}+${Key}`
  | `${Modifier}+${Modifier}+${Key}`
  | `${Modifier}+${Modifier}+${Modifier}+${Key}`;

function getKeyName(event: KeyboardEvent) {
  if (event.key === " ") {
    return "Space";
  }

  if (event.key === "Control") {
    return "Ctrl";
  }

  if (event.key === "Meta") {
    return "Cmd";
  }

  if (event.key === "Escape") {
    return "Esc";
  }

  if (event.key === "+") {
    return "Plus";
  }

  return event.key as Key;
}

export const useHotKeysStore = defineStore("hotkeys", () => {
  const commandStore = useCommandsStore();
  const menubarStore = useMenuBarStore();

  const hotKeyToCommand = new Map<Hotkey, string>();
  const commandToHotKey = new Map<string, Hotkey>();
  const currentPressedKeys = new Set<Key>();
  const activeElement = useActiveElement();
  const showHotKeys = ref(false);

  window.addEventListener(
    "keydown",
    (event) => {
      if (
        activeElement.value?.tagName === "INPUT" ||
        activeElement.value?.tagName === "TEXTAREA" ||
        activeElement.value?.contentEditable === "true"
      ) {
        return;
      }
      const key = getKeyName(event);

      if (!currentPressedKeys.has(key)) {
        currentPressedKeys.add(key);
      }

      const pressedKeys = Array.from(currentPressedKeys)
        .sort((a, b) => a.localeCompare(b))
        .join("+")
        .toLocaleLowerCase();

      for (const [hotKey, command] of hotKeyToCommand) {
        const keys = hotKey
          .toLocaleLowerCase()
          .split("+")
          .sort((a, b) => a.localeCompare(b))
          .join("+");

        if (keys !== pressedKeys) {
          continue;
        }

        event.preventDefault();

        commandStore.executeCommand(command);
      }
    },
    {
      capture: true,
    }
  );

  window.addEventListener("keyup", (event) => {
    const key = getKeyName(event);

    if (currentPressedKeys.has(key)) {
      currentPressedKeys.delete(key);
    }
  });

  function addHotKeys(hotKeys: {
    [k in Hotkey]?: string;
  }) {
    for (const [hotKey, command] of Object.entries(hotKeys) as [
      Hotkey,
      string,
    ][]) {
      if (hotKeyToCommand.has(hotKey)) {
        console.warn(
          `Hotkey ${hotKey} is already in use by "${hotKeyToCommand.get(hotKey)}"`
        );
        continue;
      }

      hotKeyToCommand.set(hotKey, command);
      commandToHotKey.set(command, hotKey);
    }
  }

  function removeHotKeys(hotKeys: Hotkey[]) {
    for (const hotKey of hotKeys) {
      const command = hotKeyToCommand.get(hotKey);

      if (command) {
        commandToHotKey.delete(command);
      }

      hotKeyToCommand.delete(hotKey);
    }
  }

  function getHotKey(command: string) {
    return commandToHotKey.get(command);
  }

  function getCommand(hotKey: Hotkey) {
    return hotKeyToCommand.get(hotKey);
  }

  nextTick(() => {
    addHotKeys({
      F2: "help.hotkeys",
    });

    commandStore.registerCommand({
      id: "help.hotkeys",
      name: "Exibir atalhos de teclado",
      description:
        "Exibe uma lista com todos os atalhos de teclado disponíveis",
      async run() {
        showHotKeys.value = true;
      },
    });

    menubarStore.addMenuItemsAt(
      ["Ajuda"],
      [
        {
          type: "item",
          title: "Atalhos de teclado",
          command: "help.hotkeys",
        },
      ]
    );
  });

  return {
    showHotKeys,
    pressedKeys: readonly(currentPressedKeys),
    hotKeyToCommand: readonly(hotKeyToCommand),
    commandToHotKey: readonly(commandToHotKey),
    addHotKeys,
    removeHotKeys,
    getHotKey,
    getCommand,
  };
});
