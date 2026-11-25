// The messages between `lenz-mcp` and the Lenz app in the browser, over a WebSocket. This file
// has no Node imports: the app uses it too.

export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 5369;

export const bridgeUrl = (port = DEFAULT_PORT, host = DEFAULT_HOST) => `ws://${host}:${port}`;

/** A tool of the app, as agents see it. What it does stays in the app. */
export interface BridgeTool {
  name: string;
  title?: string;
  description: string;
  /** A JSON Schema object. */
  inputSchema: Record<string, unknown>;
  readOnly?: boolean;
  consequential?: boolean;
}

/** An image in the result of a tool: base64, without the `data:` prefix. */
export interface ResultImage {
  data: string;
  /** `image/png`, `image/jpeg`... */
  mimeType: string;
}

/** What a tool call comes to: text for the agent, and images if the tool made any. */
export interface CallResult {
  text: string;
  images?: ResultImage[];
  isError?: boolean;
}

/** What the app says. `hello` opens the conversation; `tools` follows whenever its tools change. */
export type AppMessage =
  | { type: "hello"; tools: BridgeTool[] }
  | { type: "tools"; tools: BridgeTool[] }
  | ({ type: "result"; id: number } & CallResult);

/** What the server asks of the app. */
export interface CallMessage {
  type: "call";
  id: number;
  name: string;
  arguments: Record<string, unknown>;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function toTools(value: unknown): BridgeTool[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const tools: BridgeTool[] = [];
  for (const item of value) {
    if (!isObject(item) || typeof item.name !== "string" || typeof item.description !== "string") {
      return undefined;
    }
    tools.push({
      name: item.name,
      ...(typeof item.title === "string" && { title: item.title }),
      description: item.description,
      inputSchema: isObject(item.inputSchema) ? item.inputSchema : { type: "object" },
      ...(item.readOnly === true && { readOnly: true }),
      ...(item.consequential === true && { consequential: true }),
    });
  }
  return tools;
}

/** The images that are well formed; anything else the app sent in their place is left out. */
function toImages(value: unknown): ResultImage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) =>
    isObject(item) &&
    typeof item.data === "string" &&
    typeof item.mimeType === "string" &&
    item.mimeType.startsWith("image/")
      ? [{ data: item.data, mimeType: item.mimeType }]
      : [],
  );
}

function parse(raw: unknown): Record<string, unknown> | undefined {
  if (typeof raw !== "string") return undefined;
  try {
    const value: unknown = JSON.parse(raw);
    return isObject(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Reads a message from the app; `undefined` for anything that is not one. */
export function parseAppMessage(raw: unknown): AppMessage | undefined {
  const message = parse(raw);
  if (!message) return undefined;
  if (message.type === "hello" || message.type === "tools") {
    const tools = toTools(message.tools);
    return tools && { type: message.type, tools };
  }
  if (message.type === "result" && typeof message.id === "number") {
    const images = toImages(message.images);
    return {
      type: "result",
      id: message.id,
      text: typeof message.text === "string" ? message.text : "",
      ...(images.length > 0 && { images }),
      ...(message.isError === true && { isError: true }),
    };
  }
  return undefined;
}

/** Reads a call from the server; `undefined` for anything that is not one. */
export function parseCallMessage(raw: unknown): CallMessage | undefined {
  const message = parse(raw);
  if (!message || message.type !== "call") return undefined;
  if (typeof message.id !== "number" || typeof message.name !== "string") return undefined;
  return {
    type: "call",
    id: message.id,
    name: message.name,
    arguments: isObject(message.arguments) ? message.arguments : {},
  };
}
