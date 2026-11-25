import type { BridgeTool, CallResult } from "./protocol";
import { INSTRUCTIONS, PROMPTS, getPrompt } from "./skill";

/** What the MCP side needs from whoever has the tools: the app, behind the WebSocket. */
export interface ToolHost {
  tools(): BridgeTool[];
  call(name: string, args: Record<string, unknown>): Promise<CallResult>;
}

/** Newest first. A client asking for one of these gets it; otherwise it is offered the newest. */
export const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];

const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;

type Send = (message: Record<string, unknown>) => void;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function describe(tool: BridgeTool) {
  return {
    name: tool.name,
    ...(tool.title && { title: tool.title }),
    description: tool.description,
    inputSchema: tool.inputSchema,
    annotations: {
      ...(tool.title && { title: tool.title }),
      readOnlyHint: !!tool.readOnly,
      destructiveHint: !!tool.consequential,
    },
  };
}

/**
 * One conversation with an MCP client (JSON-RPC 2.0), whatever carries the messages: it is given
 * what to send with. Only what an agent of tools needs: initialize, ping, tools/list, tools/call.
 */
export class McpSession {
  private initialized = false;

  constructor(
    private readonly host: ToolHost,
    private readonly send: Send,
    private readonly info = { name: "lenz-mcp", version: "0.0.0" },
  ) {}

  /** Tells the client its list of tools changed. Nothing before it has asked to start. */
  notifyToolsChanged() {
    if (this.initialized) {
      this.send({ jsonrpc: "2.0", method: "notifications/tools/list_changed" });
    }
  }

  /** The reply to a line that was not valid JSON. */
  rejectUnreadable() {
    this.fail(null, PARSE_ERROR, "Parse error");
  }

  async handle(message: unknown): Promise<void> {
    if (Array.isArray(message)) {
      for (const item of message) await this.handle(item);
      return;
    }
    if (!isObject(message) || message.jsonrpc !== "2.0") {
      return this.fail(
        isObject(message) ? (message.id as never) : null,
        INVALID_REQUEST,
        "Invalid Request",
      );
    }
    // An answer to something we asked: this server asks nothing.
    if (typeof message.method !== "string") return;
    const hasId = typeof message.id === "string" || typeof message.id === "number";
    const id = hasId ? (message.id as string | number) : null;
    const params = isObject(message.params) ? message.params : {};

    switch (message.method) {
      case "initialize":
        return this.initialize(id, params);
      case "notifications/initialized":
        this.initialized = true;
        return;
      case "ping":
        return this.reply(id, {});
      case "tools/list":
        return this.reply(id, { tools: this.host.tools().map(describe) });
      case "tools/call":
        return this.callTool(id, params);
      case "prompts/list":
        return this.reply(id, { prompts: PROMPTS });
      case "prompts/get":
        return this.getPrompt(id, params);
      default:
        // A notification needs no answer, even one we do not know.
        if (hasId) this.fail(id, METHOD_NOT_FOUND, `Method not found: ${message.method}`);
    }
  }

  private initialize(id: string | number | null, params: Record<string, unknown>) {
    const asked = params.protocolVersion;
    const protocolVersion =
      typeof asked === "string" && PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0];
    this.reply(id, {
      protocolVersion,
      capabilities: { tools: { listChanged: true }, prompts: {} },
      serverInfo: this.info,
      instructions: INSTRUCTIONS,
    });
  }

  private getPrompt(id: string | number | null, params: Record<string, unknown>) {
    const name = params.name;
    if (typeof name !== "string")
      return this.fail(id, INVALID_PARAMS, "A prompt name is required.");
    const prompt = getPrompt(name, isObject(params.arguments) ? params.arguments : {});
    if (!prompt) return this.fail(id, INVALID_PARAMS, `Unknown prompt: ${name}`);
    this.reply(id, prompt);
  }

  private async callTool(id: string | number | null, params: Record<string, unknown>) {
    const name = params.name;
    if (typeof name !== "string") return this.fail(id, INVALID_PARAMS, "A tool name is required.");
    // With nothing on offer the app is not there: the host explains that, which helps an agent
    // more than "unknown tool".
    const offered = this.host.tools();
    if (offered.length > 0 && !offered.some((tool) => tool.name === name)) {
      return this.fail(id, INVALID_PARAMS, `Unknown tool: ${name}`);
    }
    const args = isObject(params.arguments) ? params.arguments : {};
    try {
      const { text, images = [], isError } = await this.host.call(name, args);
      const content = [
        { type: "text", text },
        ...images.map(({ data, mimeType }) => ({ type: "image", data, mimeType })),
      ];
      this.reply(id, { content, ...(isError && { isError: true }) });
    } catch (error) {
      // A failed tool is a result the agent can read and react to, not a protocol error.
      const text = error instanceof Error ? error.message : String(error);
      this.reply(id, { content: [{ type: "text", text }], isError: true });
    }
  }

  private reply(id: string | number | null, result: unknown) {
    if (id === null) return;
    this.send({ jsonrpc: "2.0", id, result });
  }

  private fail(id: string | number | null, code: number, message: string) {
    this.send({ jsonrpc: "2.0", id, error: { code, message } });
  }
}
