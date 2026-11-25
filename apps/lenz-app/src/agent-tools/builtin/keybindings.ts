import {
  isCustomized,
  listKeybindings,
  resetUserKeybinding,
  setUserKeybinding,
} from "../../keybindings";
import { hasCommand } from "../../commands";
import { optionalText, schema, string, text, type Tools } from "./input";

const command = string("The id of a command, from list_commands.");

export const keybindingTools: Tools = [
  {
    name: "list_keybindings",
    description: "Lists the keyboard shortcuts in effect, and the command each runs.",
    readOnly: true,
    execute: () =>
      listKeybindings().map(({ label, key, command, when, user }) => ({
        shortcut: label,
        key,
        command,
        when,
        customized: user,
      })),
  },
  {
    name: "set_keybinding",
    description:
      "Gives a command a shortcut of the user's own, replacing the ones it had, or takes its shortcuts away with a null key. Kept across reloads. reset_keybinding undoes it.",
    inputSchema: schema(
      {
        command,
        key: {
          type: ["string", "null"],
          description:
            'Modifiers joined by +, then the key: "Ctrl+Shift+P", "Alt+Up", "F2". "Mod" is Cmd on a Mac and Ctrl elsewhere. Steps separated by a space make a sequence: "Ctrl+K Ctrl+O". null takes the shortcuts away.',
        },
        when: string("Condition for it to work. Left out, the command's own is kept."),
      },
      ["command", "key"],
    ),
    consequential: true,
    execute(input) {
      const id = text(input, "command");
      if (!hasCommand(id)) throw new Error(`There is no command "${id}".`);
      const key = input.key;
      if (key !== null && typeof key !== "string")
        throw new Error('"key" must be a string or null.');
      setUserKeybinding(id, key, optionalText(input, "when"));
      return { command: id, key, customized: isCustomized(id) };
    },
  },
  {
    name: "reset_keybinding",
    description: "Gives a command back the shortcuts it came with.",
    inputSchema: schema({ command }, ["command"]),
    execute(input) {
      resetUserKeybinding(text(input, "command"));
      return { command: text(input, "command"), customized: false };
    },
  },
];
