import { ref, type Ref } from "vue";
import { splitToolOutput, type Disposable } from "lenz-sdk";
import {
  bridgeUrl,
  parseCallMessage,
  type AppMessage,
  type BridgeTool,
  type CallMessage,
} from "lenz-mcp/protocol";
import type { McpStatus } from "./mcp-settings";
import type { AgentTool, AgentToolBackend } from "./types";
import { resultText } from "./webmcp";

export interface McpBridgeOptions {
  /** Where `lenz-mcp` listens. */
  url?: string;
  /** Reactive, for the settings to show. */
  status?: Ref<McpStatus>;
  /** Wait (ms) before trying again, doubling up to `max` while nobody answers. */
  retry?: { min: number; max: number };
  /** Tests replace it. */
  WebSocket?: typeof WebSocket;
}

export interface McpBridge {
  /** Gets every tool registered while it is in use. */
  readonly backend: AgentToolBackend;
  readonly status: Ref<McpStatus>;
  /** Connects to `lenz-mcp`, and keeps trying until `stop`. */
  start(): void;
  stop(): void;
}

const describe = (tool: AgentTool): BridgeTool => ({
  name: tool.name,
  ...(tool.title && { title: tool.title }),
  description: tool.description,
  inputSchema: { ...(tool.inputSchema ?? { type: "object", properties: {} }) },
  ...(tool.readOnly && { readOnly: true }),
  ...(tool.consequential && { consequential: true }),
});

/**
 * Reaches the tools to an MCP client through `lenz-mcp`: the app opens a WebSocket to it on this
 * machine, says which tools it has, and runs the calls it is sent. Nothing is exposed while it is
 * not started, and the program is the one that listens: the browser only connects out.
 */
export function createMcpBridge(options: McpBridgeOptions = {}): McpBridge {
  const url = options.url ?? bridgeUrl();
  const status = options.status ?? ref<McpStatus>("off");
  const retry = options.retry ?? { min: 2_000, max: 30_000 };
  const tools = new Map<string, AgentTool>();
  let socket: WebSocket | undefined;
  let running = false;
  let delay = retry.min;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let announceTimer: ReturnType<typeof setTimeout> | undefined;

  const Socket = () => options.WebSocket ?? WebSocket;
  const list = () => [...tools.values()].map(describe);

  function send(message: AppMessage, to = socket) {
    if (to && to.readyState === Socket().OPEN) to.send(JSON.stringify(message));
  }

  /** The tools come one by one when this starts to be used: one message tells them all. */
  function announce() {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => send({ type: "tools", tools: list() }), 0);
  }

  async function run(call: CallMessage, to: WebSocket) {
    const tool = tools.get(call.name);
    if (!tool) {
      return send(
        { type: "result", id: call.id, text: `Unknown tool: ${call.name}`, isError: true },
        to,
      );
    }
    try {
      const { value, images } = splitToolOutput(await tool.execute(call.arguments));
      send(
        {
          type: "result",
          id: call.id,
          text: resultText(value),
          ...(images.length > 0 && { images: [...images] }),
        },
        to,
      );
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      send({ type: "result", id: call.id, text, isError: true }, to);
    }
  }

  function connect() {
    clearTimeout(retryTimer);
    status.value = "connecting";
    const current = new (Socket())(url);
    socket = current;
    current.onopen = () => {
      delay = retry.min;
      status.value = "connected";
      // The hello already says what an announcement still waiting would.
      clearTimeout(announceTimer);
      send({ type: "hello", tools: list() }, current);
    };
    current.onmessage = (event) => {
      const call = parseCallMessage(event.data);
      if (call) void run(call, current);
    };
    // An error is always followed by `close`, which is where the next try is scheduled.
    current.onerror = () => {};
    current.onclose = () => {
      if (socket !== current) return; // replaced, or stopped
      socket = undefined;
      if (!running) return;
      status.value = "connecting";
      retryTimer = setTimeout(connect, delay);
      delay = Math.min(delay * 2, retry.max);
    };
  }

  return {
    status,
    backend: {
      id: "mcp-bridge",
      isSupported: () => typeof Socket() === "function",
      register(tool): Disposable {
        tools.set(tool.name, tool);
        announce();
        return {
          dispose() {
            if (tools.get(tool.name) !== tool) return;
            tools.delete(tool.name);
            announce();
          },
        };
      },
    },
    start() {
      if (running) return;
      running = true;
      delay = retry.min;
      connect();
    },
    stop() {
      running = false;
      clearTimeout(retryTimer);
      clearTimeout(announceTimer);
      const closing = socket;
      socket = undefined;
      closing?.close();
      status.value = "off";
    },
  };
}
