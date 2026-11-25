import { watch } from "vue";
import type { Disposable } from "lenz-sdk";
import { registerBuiltinTools } from "./builtin";
import { createMcpBridge } from "./mcp-bridge";
import { mcpEnabled, mcpStatus } from "./mcp-settings";
import { useBackend } from "./registry";
import { createWebMcpBackend } from "./webmcp";

export { allTools, registerTool, useBackend } from "./registry";
export { createWebMcpBackend } from "./webmcp";
export { createMcpBridge } from "./mcp-bridge";
export { mcpEnabled, mcpStatus } from "./mcp-settings";
export { declareTool, implementTool } from "./extension-tools";
export type { AgentTool, AgentToolBackend, JsonSchema } from "./types";

/**
 * Where the app decides how agents reach its tools: to change that, change this list. Each one is
 * used only if the environment supports it.
 */
const backends = () => [createWebMcpBackend()];

/**
 * Reaches the tools to `lenz-mcp` while the user has the MCP server turned on in the settings,
 * and stops as soon as they turn it off.
 */
function useMcpBridge(): Disposable {
  const bridge = createMcpBridge({ status: mcpStatus });
  let attached: Disposable | undefined;
  const turn = (on: boolean) => {
    attached?.dispose();
    attached = undefined;
    bridge.stop();
    if (!on) return;
    attached = useBackend(bridge.backend);
    bridge.start();
  };
  const stopWatching = watch(mcpEnabled, turn, { immediate: true });
  return {
    dispose() {
      stopWatching();
      turn(false);
    },
  };
}

/** Registers the app's tools and exposes them to agents. Dispose to undo it. */
export function installAgentTools(): Disposable {
  const installed = [...backends().map(useBackend), useMcpBridge(), registerBuiltinTools()];
  return { dispose: () => installed.forEach((d) => d.dispose()) };
}
