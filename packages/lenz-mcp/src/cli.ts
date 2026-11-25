#!/usr/bin/env node
import { createInterface } from "node:readline";
import { Bridge } from "./bridge";
import { McpSession, type ToolHost } from "./mcp";
import { DEFAULT_HOST, DEFAULT_PORT } from "./protocol";

/** The hosted Lenz app: allowed without a flag, besides the pages on this machine. */
const DEFAULT_ORIGINS = ["https://lenz.sallon.dev"];

const HELP = `lenz-mcp: gives MCP clients (Claude Code, Claude Desktop...) the tools of a Lenz tab.

Usage: lenz-mcp [--port ${DEFAULT_PORT}] [--allow-origin https://your.lenz.app]...

  The client starts it and talks to it through stdin and stdout. Lenz, in the browser, connects
  to it by WebSocket at ws://${DEFAULT_HOST}:<port>, once the MCP server is turned on in its settings.

  --port <n>             Port of the WebSocket (default ${DEFAULT_PORT}, or LENZ_MCP_PORT).
  --allow-origin <url>   A page origin that may connect, besides the ones on this machine and
                         ${DEFAULT_ORIGINS.join(", ")} (repeat it, or set LENZ_MCP_ORIGINS
                         separated by commas).
  --help                 This text.
`;

/** Everything for people goes to stderr: stdout belongs to the protocol. */
const log = (message: string) => process.stderr.write(`[lenz-mcp] ${message}\n`);

function readArguments(argv: string[]) {
  const origins = [
    ...DEFAULT_ORIGINS,
    ...(process.env.LENZ_MCP_ORIGINS ?? "").split(",").filter(Boolean),
  ];
  let port = Number(process.env.LENZ_MCP_PORT ?? DEFAULT_PORT);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") return { help: true as const };
    if (arg === "--port") port = Number(argv[++i]);
    else if (arg === "--allow-origin" && argv[i + 1]) origins.push(argv[++i]!);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("Invalid port.");
  return { help: false as const, port, origins };
}

async function main() {
  const options = readArguments(process.argv.slice(2));
  if (options.help) return process.stdout.write(HELP);

  const bridge = new Bridge({ port: options.port, allowedOrigins: options.origins, log });
  let listenError: string | undefined;
  // Whether it listens or not, the MCP side must answer: it says why there is nothing to offer.
  const host: ToolHost = {
    tools: () => bridge.tools(),
    call: (name, args) =>
      listenError ? Promise.resolve({ text: listenError, isError: true }) : bridge.call(name, args),
  };
  const session = new McpSession(host, (message) =>
    process.stdout.write(`${JSON.stringify(message)}\n`),
  );
  bridge.onChange = () => session.notifyToolsChanged();

  try {
    const port = await bridge.listen();
    log(`Waiting for Lenz at ws://${DEFAULT_HOST}:${port}`);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    listenError =
      code === "EADDRINUSE"
        ? `A porta ${options.port} já está em uso, provavelmente por outro lenz-mcp. Feche-o ou use --port.`
        : `Não foi possível abrir a porta ${options.port}: ${(error as Error).message}`;
    log(listenError);
  }

  const lines = createInterface({ input: process.stdin });
  lines.on("line", (line) => {
    if (!line.trim()) return;
    let message: unknown;
    try {
      message = JSON.parse(line);
    } catch {
      return session.rejectUnreadable();
    }
    void session.handle(message);
  });
  lines.on("close", () => {
    void bridge.close().then(() => process.exit(0));
  });
}

main().catch((error) => {
  log(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
