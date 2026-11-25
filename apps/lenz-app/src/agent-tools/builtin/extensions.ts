import {
  disableExtension,
  enableExtension,
  extensionRecords,
  installFromUrl,
  reloadExtension,
  titleOf,
  uninstallExtension,
} from "../../extensions";
import { notifications } from "../../notifications";
import { schema, string, text, type Tools } from "./input";

/** Asks the user, in a dialog the agent cannot answer for them, and tells whether they agreed. */
async function confirmed(message: string, detail: string, action: string) {
  const answer = await notifications.showWarningMessage(message, { modal: true, detail }, action);
  return answer === action;
}

const extensionId = string("The id of an extension, from list_extensions.");

export const extensionTools: Tools = [
  {
    name: "list_extensions",
    description:
      "Lists the installed extensions, whether each is running, and what each adds: commands, tools and editors.",
    readOnly: true,
    execute: () =>
      [...extensionRecords.values()].map((record) => {
        const contributes = record.manifest?.contributes;
        return {
          id: record.id,
          title: titleOf(record),
          version: record.manifest?.version,
          description: record.manifest?.description,
          builtin: record.builtin,
          status: record.status,
          error: record.error,
          commands: contributes?.commands?.map((c) => c.command),
          tools: contributes?.tools?.map((t) => t.name),
          editors: contributes?.editors?.map((e) => e.id),
        };
      }),
  },
  {
    name: "enable_extension",
    description: "Turns an extension on, and keeps it on across reloads of the page.",
    inputSchema: schema({ id: extensionId }, ["id"]),
    async execute(input) {
      await enableExtension(text(input, "id"));
      return { id: text(input, "id"), status: "active" };
    },
  },
  {
    name: "disable_extension",
    description:
      "Turns an extension off, and the ones that depend on it, and keeps it off across reloads. Its tools go away.",
    inputSchema: schema({ id: extensionId }, ["id"]),
    consequential: true,
    async execute(input) {
      await disableExtension(text(input, "id"));
      return { id: text(input, "id"), status: "inactive" };
    },
  },
  {
    name: "reload_extension",
    description: "Runs an extension again from its files as they are now.",
    inputSchema: schema({ id: extensionId }, ["id"]),
    async execute(input) {
      await reloadExtension(text(input, "id"));
      return { id: text(input, "id"), status: extensionRecords.get(text(input, "id"))?.status };
    },
  },
  {
    name: "install_extension",
    description:
      "Installs an extension from the URL of its folder (the one with its package.json). It runs with the full power of the app, so the user is asked to confirm in a dialog, and may refuse.",
    inputSchema: schema({ url: string("The URL of the extension's folder.") }, ["url"]),
    consequential: true,
    async execute(input) {
      const url = text(input, "url");
      if (
        !(await confirmed(
          "Instalar esta extensão?",
          `${url}\n\nEla roda com acesso total ao app.`,
          "Instalar",
        ))
      ) {
        return { installed: false, reason: "The user did not confirm." };
      }
      return { installed: true, id: await installFromUrl(url) };
    },
  },
  {
    name: "uninstall_extension",
    description:
      "Removes an extension that was installed from a URL (the ones shipped with the app stay), without asking. It can be installed again from its URL.",
    inputSchema: schema({ id: extensionId }, ["id"]),
    consequential: true,
    async execute(input) {
      const id = text(input, "id");
      await uninstallExtension(id);
      return { uninstalled: true, id };
    },
  },
];
