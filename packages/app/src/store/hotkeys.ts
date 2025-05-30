import { AnyKey, Hotkey, KeyTypes } from "lenz:hotkeys";
import { defineStore } from "pinia";

const ModifierList = ["Ctrl", "Alt", "Shift", "Cmd"] as const;
const Modifier = new Set(ModifierList);

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

  return event.key as AnyKey;

}

export const useHotKeysStore = defineStore("hotkeys", () => {
  const commandStore = useCommandsStore();

  const hotKeyToCommand = new Map<Hotkey, string>();
  const commandToHotKey = new Map<string, Hotkey>();
  const currentPressedKeys = new Set<AnyKey>();
  const activeElement = useActiveElement();
  const showHotKeys = ref(false);

  window.addEventListener('focus', () => currentPressedKeys.clear())
  window.addEventListener('blur', () => currentPressedKeys.clear())

  function isInEditableField(tag?: HTMLElement | null): boolean {
    return (
      typeof tag === "object" &&
      tag !== null &&
      (tag.tagName === "INPUT" ||
        tag.tagName === "TEXTAREA" ||
        tag.contentEditable === "true" ||
        (tag.tagName === "IFRAME" &&
          isInEditableField(
            (tag as HTMLIFrameElement).contentDocument
              ?.activeElement as HTMLElement
          )))
    );
  }

  function handleKeyDown(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();

    // if (event.key === "Escape") {
    //   currentPressedKeys.clear();
    //   showHotKeys.value = false;
    //   return;
    // }

    if (isInEditableField(activeElement.value)) {
      return;
    }

    const key = getKeyName(event);

    if (!currentPressedKeys.has(key)) {
      currentPressedKeys.add(key);
    }

    const pressedKeys = Array.from(currentPressedKeys)
      .sort((a, b) => {
        if (Modifier.has(a as KeyTypes.Modifier) && !Modifier.has(b as KeyTypes.Modifier)) {
          return -1;
        }

        if (Modifier.has(b as KeyTypes.Modifier) && !Modifier.has(a as KeyTypes.Modifier)) {
          return 1;
        }

        return a.localeCompare(b);
      })
      .join("+")
      .toLowerCase();

    for (const [hotKey, command] of hotKeyToCommand) {
      const keys = hotKey
        .split("+")
        .sort((a, b) => {
          if (Modifier.has(a as KeyTypes.Modifier) && !Modifier.has(b as KeyTypes.Modifier)) {
            return -1;
          }

          if (Modifier.has(b as KeyTypes.Modifier) && !Modifier.has(a as KeyTypes.Modifier)) {
            return 1;
          }

          return a.localeCompare(b);
        })
        .join("+")
        .toLowerCase();

      if (keys !== pressedKeys) {
        continue;
      }

      commandStore.executeCommand(command);
    }
  }

  function handleKeyUp(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();

    const key = getKeyName(event);

    if (currentPressedKeys.has(key)) {
      currentPressedKeys.delete(key);
    }
  }

  window.addEventListener("keydown", handleKeyDown, {
    capture: true,
  });

  window.addEventListener("keyup", handleKeyUp, {
    capture: true,
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

  return {
    showHotKeys,
    pressedKeys: readonly(currentPressedKeys),
    hotKeyToCommand: readonly(hotKeyToCommand),
    commandToHotKey: readonly(commandToHotKey),
    handleKeyDown,
    handleKeyUp,
    addHotKeys,
    removeHotKeys,
    getHotKey,
    getCommand,
  };
});
