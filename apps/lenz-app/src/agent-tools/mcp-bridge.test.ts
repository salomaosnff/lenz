import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ref } from "vue";
import { toolOutput } from "lenz-sdk";
import { createMcpBridge } from "./mcp-bridge";
import type { McpStatus } from "./mcp-settings";
import type { AgentTool } from "./types";

/** Just enough of a WebSocket, with the server's side in the test's hands. */
class FakeSocket {
  static instances: FakeSocket[] = [];
  static OPEN = 1;
  readyState = 0;
  sent: Record<string, any>[] = [];
  onopen?: () => void;
  onmessage?: (event: { data: string }) => void;
  onerror?: () => void;
  onclose?: () => void;
  constructor(readonly url: string) {
    FakeSocket.instances.push(this);
  }
  get OPEN() {
    return FakeSocket.OPEN;
  }
  send(data: string) {
    this.sent.push(JSON.parse(data));
  }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
  // The test plays the server.
  accept() {
    this.readyState = FakeSocket.OPEN;
    this.onopen?.();
  }
  drop() {
    this.readyState = 3;
    this.onclose?.();
  }
  say(message: object) {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
}

const tool = (name: string, extra: Partial<AgentTool> = {}): AgentTool => ({
  name,
  description: `does ${name}`,
  execute: () => `ran ${name}`,
  ...extra,
});

function setup() {
  const status = ref<McpStatus>("off");
  const bridge = createMcpBridge({
    status,
    retry: { min: 100, max: 400 },
    WebSocket: FakeSocket as unknown as typeof WebSocket,
  });
  const socket = () => FakeSocket.instances.at(-1)!;
  return { bridge, status, socket };
}

beforeEach(() => {
  FakeSocket.instances = [];
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe("connecting", () => {
  it("does nothing until it is started, and goes to 127.0.0.1:5369", () => {
    const { bridge, status, socket } = setup();
    expect(FakeSocket.instances).toHaveLength(0);
    expect(status.value).toBe("off");
    bridge.start();
    expect(socket().url).toBe("ws://127.0.0.1:5369");
    expect(status.value).toBe("connecting");
    socket().accept();
    expect(status.value).toBe("connected");
  });

  it("says hello with the tools it has, and then tells when they change", async () => {
    const { bridge, socket } = setup();
    const first = bridge.backend.register(
      tool("a", { readOnly: true, inputSchema: { type: "object", properties: { x: {} } } }),
    );
    bridge.start();
    socket().accept();
    expect(socket().sent[0]).toEqual({
      type: "hello",
      tools: [
        {
          name: "a",
          description: "does a",
          inputSchema: { type: "object", properties: { x: {} } },
          readOnly: true,
        },
      ],
    });
    // Several tools at once are told in one message.
    bridge.backend.register(tool("b", { consequential: true }));
    bridge.backend.register(tool("c"));
    await vi.advanceTimersByTimeAsync(0);
    expect(socket().sent).toHaveLength(2);
    expect(socket().sent[1]!.tools.map((t: any) => t.name)).toEqual(["a", "b", "c"]);
    expect(socket().sent[1]!.tools[1].consequential).toBe(true);
    first.dispose();
    await vi.advanceTimersByTimeAsync(0);
    expect(socket().sent[2]!.tools.map((t: any) => t.name)).toEqual(["b", "c"]);
  });

  it("tries again, slower each time, until it gets in", async () => {
    const { bridge, status, socket } = setup();
    bridge.start();
    socket().drop();
    expect(status.value).toBe("connecting");
    await vi.advanceTimersByTimeAsync(99);
    expect(FakeSocket.instances).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(FakeSocket.instances).toHaveLength(2);
    socket().drop(); // waits 200 now
    await vi.advanceTimersByTimeAsync(199);
    expect(FakeSocket.instances).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(FakeSocket.instances).toHaveLength(3);
    socket().accept();
    expect(status.value).toBe("connected");
    socket().drop(); // got in once: back to the short wait
    await vi.advanceTimersByTimeAsync(100);
    expect(FakeSocket.instances).toHaveLength(4);
  });

  it("stops for good: closes, and does not try again", async () => {
    const { bridge, status, socket } = setup();
    bridge.start();
    socket().accept();
    bridge.stop();
    expect(status.value).toBe("off");
    await vi.advanceTimersByTimeAsync(10_000);
    expect(FakeSocket.instances).toHaveLength(1);
    bridge.start(); // and can start again
    expect(FakeSocket.instances).toHaveLength(2);
  });
});

describe("calls", () => {
  it("runs the tool it is asked to and sends back what it returned", async () => {
    const { bridge, socket } = setup();
    bridge.backend.register(tool("echo", { execute: (input) => ({ got: input.x }) }));
    bridge.start();
    socket().accept();
    socket().say({ type: "call", id: 7, name: "echo", arguments: { x: 1 } });
    await vi.advanceTimersByTimeAsync(0);
    expect(socket().sent.at(-1)).toEqual({ type: "result", id: 7, text: '{"got":1}' });
  });

  it("sends the images a tool made along with its text", async () => {
    const { bridge, socket } = setup();
    bridge.backend.register(
      tool("shot", {
        execute: () => toolOutput({ width: 375 }, [{ data: "AAA", mimeType: "image/png" }]),
      }),
    );
    bridge.start();
    socket().accept();
    socket().say({ type: "call", id: 8, name: "shot", arguments: {} });
    await vi.advanceTimersByTimeAsync(0);
    expect(socket().sent.at(-1)).toEqual({
      type: "result",
      id: 8,
      text: '{"width":375}',
      images: [{ data: "AAA", mimeType: "image/png" }],
    });
  });

  it("answers an error for a tool that throws, or that is not there", async () => {
    const { bridge, socket } = setup();
    bridge.backend.register(
      tool("boom", {
        execute: () => {
          throw new Error("it broke");
        },
      }),
    );
    bridge.start();
    socket().accept();
    socket().say({ type: "call", id: 1, name: "boom", arguments: {} });
    socket().say({ type: "call", id: 2, name: "ghost", arguments: {} });
    await vi.advanceTimersByTimeAsync(0);
    const results = socket().sent.filter((m) => m.type === "result");
    expect(results).toEqual([
      { type: "result", id: 1, text: "it broke", isError: true },
      { type: "result", id: 2, text: "Unknown tool: ghost", isError: true },
    ]);
  });

  it("ignores what is not a call", () => {
    const { bridge, socket } = setup();
    bridge.start();
    socket().accept();
    socket().onmessage?.({ data: "nonsense" });
    socket().say({ type: "hello" });
    expect(socket().sent).toHaveLength(1); // only its own hello
  });
});
