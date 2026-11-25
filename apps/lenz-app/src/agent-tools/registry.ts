import type { Disposable } from "lenz-sdk";
import type { AgentTool, AgentToolBackend } from "./types";

const tools = new Map<string, AgentTool>();

/** A backend that is in use, with what it holds for each tool. */
interface Attachment {
  backend: AgentToolBackend;
  registrations: Map<string, Disposable>;
}
const attachments = new Set<Attachment>();

/** A backend that fails must not take the app, or the other backends, with it. */
function safely(attachment: Attachment, action: string, fn: () => void) {
  try {
    fn();
  } catch (error) {
    console.warn(`The agent tools backend "${attachment.backend.id}" failed to ${action}.`, error);
  }
}

function offer(attachment: Attachment, tool: AgentTool) {
  safely(attachment, `register "${tool.name}"`, () => {
    attachment.registrations.set(tool.name, attachment.backend.register(tool));
  });
}

function withdraw(attachment: Attachment, name: string) {
  const registration = attachment.registrations.get(name);
  attachment.registrations.delete(name);
  if (registration) safely(attachment, `unregister "${name}"`, () => registration.dispose());
}

/** Makes a tool available to agents, through every backend in use. Dispose to take it away. */
export function registerTool(tool: AgentTool): Disposable {
  if (tools.has(tool.name)) throw new Error(`A tool "${tool.name}" is already registered.`);
  tools.set(tool.name, tool);
  attachments.forEach((attachment) => offer(attachment, tool));
  return {
    dispose() {
      // A newer tool of the same name is not ours to remove.
      if (tools.get(tool.name) !== tool) return;
      tools.delete(tool.name);
      attachments.forEach((attachment) => withdraw(attachment, tool.name));
    },
  };
}

/**
 * Starts exposing the tools through a backend: the ones registered already and the ones to come.
 * Dispose to stop. A backend that is not supported is left out, which is not an error.
 */
export function useBackend(backend: AgentToolBackend): Disposable {
  const attachment: Attachment = { backend, registrations: new Map() };
  let supported = false;
  safely(attachment, "tell whether it is supported", () => (supported = backend.isSupported()));
  if (!supported) return { dispose() {} };

  attachments.add(attachment);
  tools.forEach((tool) => offer(attachment, tool));
  return {
    dispose() {
      if (!attachments.delete(attachment)) return;
      [...attachment.registrations.keys()].forEach((name) => withdraw(attachment, name));
    },
  };
}

/** The tools registered now. */
export const allTools = (): AgentTool[] => [...tools.values()];
