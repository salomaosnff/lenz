import { createServer, type Server, type ServerResponse } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer, type RawData, type WebSocket } from "ws";
import type { ToolHost } from "./mcp";
import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  parseAppMessage,
  type BridgeTool,
  type CallMessage,
  type CallResult,
} from "./protocol";

export interface BridgeOptions {
  port?: number;
  host?: string;
  /** Origins that may connect besides the pages on this machine (`http://localhost:*`). */
  allowedOrigins?: readonly string[];
  /** How long (ms) the app has to answer a call. */
  callTimeout?: number;
  /** How often (ms) a connection is checked to be alive. */
  heartbeat?: number;
  log?: (message: string) => void;
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function originOf(value: string): URL | undefined {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

/**
 * Whether a page may drive the app through this server. Any web page can open a WebSocket to
 * `127.0.0.1`, so the origin the browser reports is the gate: pages served from this machine pass,
 * and so do the origins listed. A request that names no origin is not a browser.
 */
export function isAllowedOrigin(origin: string | undefined, allowed: readonly string[] = []) {
  const url = origin ? originOf(origin) : undefined;
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) return false;
  if (LOCAL_HOSTS.has(url.hostname)) return true;
  return allowed.some((entry) => originOf(entry)?.origin === url.origin);
}

/** A text frame arrives as bytes; a message may also be split in pieces. */
export function rawToString(data: RawData): string {
  if (Array.isArray(data)) return Buffer.concat(data).toString("utf8");
  return (Buffer.isBuffer(data) ? data : Buffer.from(data)).toString("utf8");
}

interface Connection {
  socket: WebSocket;
  /** Unknown until the app says hello. */
  tools?: BridgeTool[];
  alive: boolean;
}

interface Pending {
  connection: Connection;
  resolve(result: CallResult): void;
  timer: ReturnType<typeof setTimeout>;
}

const NOT_CONNECTED =
  "O Lenz não está conectado. Abra o app no navegador e ative o servidor MCP nas configurações.";

/**
 * The WebSocket server the app connects to, on this machine only. It passes the tools the app
 * offers to the MCP side, and the calls back to the app. With several tabs open the newest to
 * connect is the one that answers.
 */
export class Bridge implements ToolHost {
  /** Called when the tools on offer may have changed. */
  onChange?: () => void;

  private readonly port: number;
  private readonly host: string;
  private readonly allowedOrigins: readonly string[];
  private readonly callTimeout: number;
  private readonly heartbeat: number;
  private readonly log: (message: string) => void;
  private server?: Server;
  private sockets?: WebSocketServer;
  private timer?: ReturnType<typeof setInterval>;
  private readonly connections: Connection[] = [];
  private readonly pending = new Map<number, Pending>();
  private nextId = 1;

  constructor(options: BridgeOptions = {}) {
    this.port = options.port ?? DEFAULT_PORT;
    this.host = options.host ?? DEFAULT_HOST;
    this.allowedOrigins = options.allowedOrigins ?? [];
    this.callTimeout = options.callTimeout ?? 60_000;
    this.heartbeat = options.heartbeat ?? 30_000;
    this.log = options.log ?? (() => {});
  }

  /** The connection that answers: the newest that has told its tools. */
  private active(): Connection | undefined {
    return this.connections.findLast((connection) => connection.tools !== undefined);
  }

  get connected() {
    return this.active() !== undefined;
  }

  tools(): BridgeTool[] {
    return this.active()?.tools ?? [];
  }

  /** Starts listening. Gives the port, which differs from the one asked for when that was 0. */
  listen(): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = createServer((_request, response: ServerResponse) => {
        response.writeHead(426, { "content-type": "text/plain" });
        response.end("This is the Lenz MCP bridge: connect with a WebSocket.\n");
      });
      const sockets = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 * 1024 });
      server.on("upgrade", (request, socket: Duplex, head) => {
        if (!isAllowedOrigin(request.headers.origin, this.allowedOrigins)) {
          this.log(`Refused a connection from ${request.headers.origin ?? "an unknown origin"}.`);
          socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
          socket.destroy();
          return;
        }
        sockets.handleUpgrade(request, socket, head, (ws) => this.accept(ws));
      });
      server.once("error", reject);
      server.listen(this.port, this.host, () => {
        server.off("error", reject);
        this.server = server;
        this.sockets = sockets;
        this.timer = setInterval(() => this.checkAlive(), this.heartbeat);
        this.timer.unref();
        const address = server.address();
        resolve(typeof address === "object" && address ? address.port : this.port);
      });
    });
  }

  async close(): Promise<void> {
    clearInterval(this.timer);
    this.connections.slice().forEach((connection) => connection.socket.terminate());
    this.sockets?.close();
    await new Promise<void>((resolve) =>
      this.server ? this.server.close(() => resolve()) : resolve(),
    );
  }

  call(name: string, args: Record<string, unknown>) {
    const connection = this.active();
    if (!connection) return Promise.resolve({ text: NOT_CONNECTED, isError: true });
    const id = this.nextId++;
    return new Promise<CallResult>((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        resolve({ text: `O Lenz não respondeu a tempo à ferramenta "${name}".`, isError: true });
      }, this.callTimeout);
      this.pending.set(id, { connection, resolve, timer });
      const message: CallMessage = { type: "call", id, name, arguments: args };
      connection.socket.send(JSON.stringify(message));
    });
  }

  private accept(socket: WebSocket) {
    const connection: Connection = { socket, alive: true };
    this.connections.push(connection);
    this.log("The app connected.");
    socket.on("pong", () => (connection.alive = true));
    socket.on("message", (data) => this.receive(connection, rawToString(data)));
    socket.on("close", () => {
      const at = this.connections.indexOf(connection);
      if (at !== -1) this.connections.splice(at, 1);
      for (const [id, pending] of this.pending) {
        if (pending.connection !== connection) continue;
        clearTimeout(pending.timer);
        this.pending.delete(id);
        pending.resolve({ text: "A conexão com o Lenz foi fechada.", isError: true });
      }
      this.log("The app disconnected.");
      this.onChange?.();
    });
    // A socket error is followed by `close`; this only keeps it from being thrown.
    socket.on("error", (error) => this.log(`Connection error: ${error.message}`));
  }

  private receive(connection: Connection, raw: string) {
    const message = parseAppMessage(raw);
    if (!message) return;
    if (message.type === "result") {
      const pending = this.pending.get(message.id);
      // Only the connection that was asked may answer.
      if (!pending || pending.connection !== connection) return;
      clearTimeout(pending.timer);
      this.pending.delete(message.id);
      const { type: _, id: __, ...result } = message;
      pending.resolve(result);
      return;
    }
    connection.tools = message.tools;
    this.onChange?.();
  }

  private checkAlive() {
    for (const connection of this.connections) {
      if (!connection.alive) {
        connection.socket.terminate();
        continue;
      }
      connection.alive = false;
      connection.socket.ping();
    }
  }
}
