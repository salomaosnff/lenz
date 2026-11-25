import { allCommands, availableCommands, executeCommand } from "../../commands";
import { keybindingsFor } from "../../keybindings";
import { boolean, flag, schema, string, text, type Tools } from "./input";

export const commandTools: Tools = [
  {
    name: "list_commands",
    description:
      "Lists the app's commands (the ones of the command palette), with the id to pass to run_command and their shortcuts. Many things the app can do are only here, so look before saying something cannot be done.",
    inputSchema: schema({
      includeUnavailable: boolean("Also list the commands that cannot run now. Defaults to false."),
    }),
    readOnly: true,
    execute: (input) =>
      (flag(input, "includeUnavailable") ? allCommands() : availableCommands()).map((command) => ({
        id: command.id,
        title: command.title,
        category: command.category,
        shortcuts: keybindingsFor(command.id),
      })),
  },
  {
    name: "run_command",
    description:
      "Runs one of the app's commands by id, as if the user had picked it. See list_commands for the ids. A command may open dialogs and wait for the user.",
    inputSchema: schema(
      {
        id: string("The id of the command."),
        args: { type: "array", description: "Arguments for the command, if it takes any." },
      },
      ["id"],
    ),
    consequential: true,
    async execute(input) {
      const args = Array.isArray(input.args) ? input.args : [];
      return (await executeCommand(text(input, "id"), ...args)) ?? "Done.";
    },
  },
];
