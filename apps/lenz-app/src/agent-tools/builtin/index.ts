import type { Disposable } from "lenz-sdk";
import { registerTool } from "../registry";
import { appTools } from "./app";
import { commandTools } from "./commands";
import { dialogTools } from "./dialogs";
import { editorTools } from "./editor";
import { extensionTools } from "./extensions";
import { fileTools } from "./files";
import { keybindingTools } from "./keybindings";
import { layoutTools } from "./layout";

/** What the app itself lets agents do, by area. Each tool is told in its own file. */
const tools = [
  ...appTools,
  ...commandTools,
  ...editorTools,
  ...fileTools,
  ...layoutTools,
  ...extensionTools,
  ...keybindingTools,
  ...dialogTools,
];

/** The app's own tools. Needs the stores, so a tool only runs after Pinia is installed. */
export function registerBuiltinTools(): Disposable {
  const registered = tools.map(registerTool);
  return { dispose: () => registered.forEach((d) => d.dispose()) };
}
