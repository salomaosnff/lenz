import type { Disposable } from "lenz-sdk";

/** A JSON Schema object describing what a tool takes. */
export type JsonSchema = Readonly<Record<string, unknown>>;

/**
 * Something an agent can do in the app. It knows nothing about how agents reach it: that is the
 * job of an `AgentToolBackend`.
 */
export interface AgentTool {
  /** Unique, in snake_case: it is what the agent calls. */
  name: string;
  title?: string;
  /** Said to the agent, so it must tell what the tool does and when to use it. */
  description: string;
  /** Without one, the tool takes no input. */
  inputSchema?: JsonSchema;
  /** The tool changes nothing. */
  readOnly?: boolean;
  /** The tool does something that is hard to undo, so the agent should be careful with it. */
  consequential?: boolean;
  /** May be async. What it returns is sent to the agent as is when a string, as JSON otherwise. */
  execute(input: Record<string, unknown>): unknown;
}

/**
 * One way of making the registered tools reachable by agents (WebMCP today; a bridge to an MCP
 * server or anything else tomorrow). The registry hands it every tool, now and as they come.
 */
export interface AgentToolBackend {
  readonly id: string;
  /** Whether it can work in this environment. One that cannot is never asked to register. */
  isSupported(): boolean;
  /** Dispose to take the tool away from agents. */
  register(tool: AgentTool): Disposable;
}
