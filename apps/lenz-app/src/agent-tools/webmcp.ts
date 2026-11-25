import { splitToolOutput, type Disposable } from "lenz-sdk";
import type { AgentTool, AgentToolBackend } from "./types";

/**
 * What a browser's WebMCP gives (https://github.com/webmachinelearning/webmcp). The API is young
 * and moves, so this is only what is used, and every difference between versions stays in this file.
 */
interface ModelContext {
  /** Newer versions take a `signal` to unregister by; older ones return nothing. */
  registerTool(tool: object, options?: { signal?: AbortSignal }): unknown;
  /** Older versions only: newer ones unregister by the signal. */
  unregisterTool?(name: string): void;
}

/** Where to look for it: the window, which tests replace. Its types do not know WebMCP yet. */
export interface WebMcpScope {
  document?: unknown;
  navigator?: unknown;
}

type Holder = { modelContext?: ModelContext } | undefined;

/** Newer versions put it on the document, older ones on the navigator. */
const modelContextOf = (scope: WebMcpScope) =>
  (scope.document as Holder)?.modelContext ?? (scope.navigator as Holder)?.modelContext;

/** What an agent reads of what a tool returned: a string as is, anything else as JSON. */
export const resultText = (value: unknown) =>
  typeof value === "string" ? value : (JSON.stringify(value ?? null) ?? "null");

/**
 * What WebMCP wants back from a tool: a result in the shape of MCP's, with text for the agent to
 * read and the images the tool made, if any.
 */
function toResult(output: unknown, isError = false) {
  const { value, images } = splitToolOutput(output);
  const content = [
    { type: "text", text: resultText(value) },
    ...images.map(({ data, mimeType }) => ({ type: "image", data, mimeType })),
  ];
  return { content, ...(isError && { isError }) };
}

function toNative(tool: AgentTool) {
  const annotations = {
    ...(tool.readOnly && { readOnlyHint: true }),
    ...(tool.consequential && { consequentialHint: true }),
  };
  return {
    name: tool.name,
    ...(tool.title && { title: tool.title }),
    description: tool.description,
    // A tool without input still gets a schema, as agents expect one.
    inputSchema: tool.inputSchema ?? { type: "object", properties: {} },
    ...(Object.keys(annotations).length > 0 && { annotations }),
    async execute(input: unknown) {
      try {
        return toResult(await tool.execute((input ?? {}) as Record<string, unknown>));
      } catch (error) {
        // The agent learns what went wrong and can try again, instead of getting an exception.
        return toResult(error instanceof Error ? error.message : String(error), true);
      }
    },
  };
}

/** Exposes the tools through the browser's own WebMCP, `modelContext`: nothing to install. */
export function createWebMcpBackend(scope: WebMcpScope = globalThis): AgentToolBackend {
  return {
    id: "webmcp",
    isSupported: () => typeof modelContextOf(scope)?.registerTool === "function",
    register(tool): Disposable {
      const modelContext = modelContextOf(scope);
      if (!modelContext) throw new Error("WebMCP is not available.");
      const controller = new AbortController();
      const result = modelContext.registerTool(toNative(tool), { signal: controller.signal });
      // Newer versions answer with a promise, which rejects for a name already taken.
      if (result instanceof Promise) {
        result.catch((error) => console.warn(`WebMCP refused the tool "${tool.name}".`, error));
      }
      return {
        dispose() {
          controller.abort();
          try {
            modelContext.unregisterTool?.(tool.name);
          } catch {
            // Already gone, which the signal did in the versions that have one.
          }
        },
      };
    },
  };
}
