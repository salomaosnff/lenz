import { ToolbarItem } from "./types/index.js";
import events from "./events.js";

const toolsMap = new Map<
  string,
  {
    tool: ToolbarItem;
    extensionId: string;
    handler?: (...args: any[]) => any;
  }
>();

const VOID = () => {};

export function prepare(tool: ToolbarItem, extensionId: string) {
  console.log(`Preparing tool ${tool.id}...`);
  toolsMap.set(tool.id, {
    tool,
    extensionId,
    handler: VOID,
  });
  console.log(toolsMap);

  events.emit("tools:prepare", tool);
}

console.log("tools.ts");

export function register(id: string, callback: (...args: any[]) => any) {
  console.log(`Registering tool ${id}...`);
  const tool = toolsMap.get(id);

  console.log(toolsMap);

  if (!tool) {
    throw new Error(`Tool ${id} not prepared`);
  }

  if (tool.handler !== VOID) {
    throw new Error(`Tool ${id} already registered`);
  }

  tool.handler = callback;

  events.emit("tools:register", tool.tool);
}

export async function activate(id: string) {
  console.log(`Activating tool ${id}...`);

  const tool = toolsMap.get(id);

  if (!tool) {
    throw new Error(`Tool ${id} not prepared`);
  }

  if (tool.handler === VOID) {
    throw new Error(`Tool ${id} not registered`);
  }

  const result = await tool.handler();

  events.emit("tools:activate", id);

  return result;
}
