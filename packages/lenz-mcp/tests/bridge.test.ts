import { afterEach, describe, expect, it } from "vite-plus/test";
import WebSocket from "ws";
import { Bridge, isAllowedOrigin, rawToString } from "../src/bridge";
import { DEFAULT_PORT, parseAppMessage, parseCallMessage, type BridgeTool } from "../src/protocol";

const tool = (name: string): BridgeTool => ({
  name,
  description: name,
  inputSchema: { type: "object" },
});

const bridges: Bridge[] = [];
const sockets: WebSocket[] = [];
afterEach(async () => {
  sockets.splice(0).forEach((s) => s.terminate());
  await Promise.all(bridges.splice(0).map((b) => b.close()));
});

async function start(options = {}) {
  const bridge = new Bridge({ port: 0, callTimeout: 300, ...options });
  bridges.push(bridge);
  return { bridge, port: await bridge.listen() };
}

/** What the app does: connect from a page, say hello, answer calls with `answer`. */
async function connect(
  port: number,
  tools: BridgeTool[] = [tool("open_file")],
  answer: (name: string, args: Record<string, unknown>) => string = (name) => `ran ${name}`,
  origin = "http://localhost:5173",
) {
  const socket = new WebSocket(`ws://127.0.0.1:${port}`, { origin });
  sockets.push(socket);
  await new Promise((resolve, reject) => {
    socket.once("open", resolve);
    socket.once("error", reject);
    socket.once("unexpected-response", (_req, res) => reject(new Error(`HTTP ${res.statusCode}`)));
  });
  socket.on("message", (data) => {
    const call = parseCallMessage(rawToString(data));
    if (call) {
      socket.send(
        JSON.stringify({ type: "result", id: call.id, text: answer(call.name, call.arguments) }),
      );
    }
  });
  socket.send(JSON.stringify({ type: "hello", tools }));
  return socket;
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

describe("origins", () => {
  it("lets in pages on this machine and the ones listed, and nothing else", () => {
    expect(isAllowedOrigin("http://localhost:5173")).toBe(true);
    expect(isAllowedOrigin("https://127.0.0.1:8080")).toBe(true);
    expect(isAllowedOrigin("http://[::1]:3000")).toBe(true);
    expect(isAllowedOrigin("https://evil.example")).toBe(false);
    expect(isAllowedOrigin("https://localhost.evil.example")).toBe(false);
    expect(isAllowedOrigin(undefined)).toBe(false);
    expect(isAllowedOrigin("null")).toBe(false);
    expect(isAllowedOrigin("file:///x")).toBe(false);
    expect(isAllowedOrigin("https://lenz.example", ["https://lenz.example"])).toBe(true);
    expect(isAllowedOrigin("https://lenz.example:444", ["https://lenz.example"])).toBe(false);
  });

  it("refuses a connection from another origin", async () => {
    const { port } = await start();
    await expect(connect(port, [], undefined, "https://evil.example")).rejects.toThrow("403");
  });

  it("takes an origin it was told about", async () => {
    const { port } = await start({ allowedOrigins: ["https://lenz.example"] });
    await expect(
      connect(port, [tool("a")], undefined, "https://lenz.example"),
    ).resolves.toBeDefined();
  });

  it("uses the port it was given by default", () => {
    expect(DEFAULT_PORT).toBe(5369);
  });
});

describe("tools and calls", () => {
  it("offers what the app said, and nothing before it", async () => {
    const { bridge, port } = await start();
    expect(bridge.connected).toBe(false);
    expect(bridge.tools()).toEqual([]);
    await connect(port, [tool("a"), tool("b")]);
    await settle();
    expect(bridge.connected).toBe(true);
    expect(bridge.tools().map((t) => t.name)).toEqual(["a", "b"]);
  });

  it("follows the app when its tools change", async () => {
    const { bridge, port } = await start();
    let changes = 0;
    bridge.onChange = () => changes++;
    const socket = await connect(port, [tool("a")]);
    socket.send(JSON.stringify({ type: "tools", tools: [tool("a"), tool("c")] }));
    await settle();
    expect(bridge.tools().map((t) => t.name)).toEqual(["a", "c"]);
    expect(changes).toBe(2);
  });

  it("sends a call to the app and gives back its answer", async () => {
    const { bridge, port } = await start();
    await connect(port, [tool("open_file")], (name, args) => `${name}:${JSON.stringify(args)}`);
    await settle();
    expect(await bridge.call("open_file", { path: "a.html" })).toEqual({
      text: 'open_file:{"path":"a.html"}',
    });
  });

  it("passes the images of an answer on, and leaves out what is not an image", async () => {
    const { bridge, port } = await start();
    const socket = await connect(port);
    socket.removeAllListeners("message");
    socket.on("message", (data) => {
      const call = parseCallMessage(rawToString(data))!;
      socket.send(
        JSON.stringify({
          type: "result",
          id: call.id,
          text: "shots",
          images: [
            { data: "AAA", mimeType: "image/png" },
            { data: "BBB", mimeType: "text/html" },
            { data: 1, mimeType: "image/png" },
            "nope",
          ],
        }),
      );
    });
    await settle();
    expect(await bridge.call("open_file", {})).toEqual({
      text: "shots",
      images: [{ data: "AAA", mimeType: "image/png" }],
    });
  });

  it("says so when the app is not there", async () => {
    const { bridge } = await start();
    const result = await bridge.call("open_file", {});
    expect(result.isError).toBe(true);
    expect(result.text).toContain("não está conectado");
  });

  it("gives up on an app that does not answer", async () => {
    const { bridge, port } = await start();
    const socket = await connect(port);
    socket.removeAllListeners("message"); // never answers
    await settle();
    const result = await bridge.call("open_file", {});
    expect(result).toMatchObject({ isError: true });
    expect(result.text).toContain("a tempo");
  });

  it("fails a call whose app went away, and forgets its tools", async () => {
    const { bridge, port } = await start({ callTimeout: 5000 });
    const socket = await connect(port);
    socket.removeAllListeners("message");
    await settle();
    const call = bridge.call("open_file", {});
    await settle();
    socket.close();
    expect((await call).text).toContain("fechada");
    await settle();
    expect(bridge.connected).toBe(false);
    expect(bridge.tools()).toEqual([]);
  });

  it("asks the newest tab, and falls back to the older one when it closes", async () => {
    const { bridge, port } = await start();
    await connect(port, [tool("a")], () => "old");
    await settle();
    const newer = await connect(port, [tool("a")], () => "new");
    await settle();
    expect((await bridge.call("a", {})).text).toBe("new");
    newer.close();
    await settle();
    expect((await bridge.call("a", {})).text).toBe("old");
  });

  it("ignores an answer from a connection that was not asked, and junk", async () => {
    // The newest tab (`asked`) is the one that gets the call; the older one cannot answer for it.
    const { bridge, port } = await start();
    const first = await connect(port, [tool("a")], () => "first");
    await settle();
    const asked = await connect(port, [tool("a")]);
    asked.removeAllListeners("message"); // never answers
    first.removeAllListeners("message");
    await settle();
    const call = bridge.call("a", {});
    asked.send("not json");
    first.send(JSON.stringify({ type: "result", id: 1, text: "stolen" }));
    const result = await call;
    expect(result.isError).toBe(true); // timed out: the asked connection never answered
    expect(result.text).not.toBe("stolen");
  });
});

describe("messages", () => {
  it("reads only what has the right shape", () => {
    expect(parseAppMessage('{"type":"hello","tools":[{"name":"a","description":"d"}]}')).toEqual({
      type: "hello",
      tools: [{ name: "a", description: "d", inputSchema: { type: "object" } }],
    });
    expect(parseAppMessage('{"type":"hello","tools":[{"name":1}]}')).toBeUndefined();
    expect(parseAppMessage('{"type":"result","id":"x"}')).toBeUndefined();
    expect(parseAppMessage("[]")).toBeUndefined();
    expect(parseCallMessage('{"type":"call","id":1,"name":"a"}')).toEqual({
      type: "call",
      id: 1,
      name: "a",
      arguments: {},
    });
    expect(parseCallMessage('{"type":"call","name":"a"}')).toBeUndefined();
  });
});
