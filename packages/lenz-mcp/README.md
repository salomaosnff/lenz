# lenz-mcp

An [MCP](https://modelcontextprotocol.io) server that gives agents (Claude Code, Claude Desktop…)
the tools of a Lenz tab open in the browser.

```
MCP client ──stdio──► lenz-mcp ──WebSocket (127.0.0.1:5369)──► Lenz, in the browser
```

The project lives in the browser (its private storage), so the tools run there: `lenz-mcp` only
carries the calls. Nothing works while no tab is connected.

## Use

1. Add it to the client, for example Claude Code:

   ```sh
   claude mcp add lenz -- npx -y lenz-mcp
   ```

   Other clients take the same command (`npx -y lenz-mcp`) in their MCP server settings.

2. In Lenz, turn on **Servidor MCP** in the settings (it is off by default). The status there
   shows when the tab is connected.

Requires Node 22.18 or newer. To run it from this repository, build it (`vp run build` in this
package, or `vp run -r build` at the root) and point the client at `node packages/lenz-mcp/dist/cli.mjs`.

## Options

| Option                 | Meaning                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `--port <n>`           | Port of the WebSocket. Default `5369` (or `LENZ_MCP_PORT`).                             |
| `--allow-origin <url>` | A page origin that may connect. Repeat it, or use `LENZ_MCP_ORIGINS` (comma separated). |

The server listens on `127.0.0.1` only. Any web page can try to open a WebSocket there, so it
checks the `Origin` of every connection: pages served from this machine (`localhost`,
`127.0.0.1`) and the hosted app (`https://lenz.sallon.dev`) are accepted, any other origin has to be listed with `--allow-origin`, and a request
without an origin is refused. With several Lenz tabs open, the newest to connect answers.

A second `lenz-mcp` cannot take the port while another one is running; it keeps answering the
client, saying the port is taken.

## In the code

- `lenz-mcp/protocol`: the messages between this server and the app (no Node imports; the app
  uses it).
- `lenz-mcp`: `Bridge` (the WebSocket server) and `McpSession` (JSON-RPC of the MCP side).

## The Lenz skill

The server carries the guide to using the tools, so any client that connects gets it without installing anything:

- **`instructions`**, sent when the client starts: the few rules that matter (styles go inline on each element, where to start, how to check the result). The agent has them from the first message.
- **The prompt `lenz`** (`prompts/list` and `prompts/get`): the whole guide, with an optional `tarefa` argument that is added at the end. In Claude Code it is the command `/mcp__lenz__lenz`.

The text is in [src/skill.ts](src/skill.ts). A test checks that every tool the guide names exists in the app, so it cannot drift from the tools.
