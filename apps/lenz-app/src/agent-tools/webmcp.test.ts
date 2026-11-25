import { describe, expect, it, vi } from "vite-plus/test";
import { toolOutput } from "lenz-sdk";
import { createWebMcpBackend } from "./webmcp";
import type { AgentTool } from "./types";

type Native = { name: string; execute(input: unknown): Promise<unknown>; [key: string]: unknown };

const tool = (overrides: Partial<AgentTool> = {}): AgentTool => ({
  name: "greet",
  description: "Greets.",
  execute: () => "hello",
  ...overrides,
});

describe("the WebMCP backend", () => {
  it("is supported only where the browser has WebMCP, on the document or the navigator", () => {
    expect(createWebMcpBackend({}).isSupported()).toBe(false);
    expect(
      createWebMcpBackend({ document: { modelContext: { registerTool() {} } } }).isSupported(),
    ).toBe(true);
    expect(
      createWebMcpBackend({ navigator: { modelContext: { registerTool() {} } } }).isSupported(),
    ).toBe(true);
  });

  it("hands the browser the tool, with a schema even when it has none, and hints for what it is", () => {
    const registerTool = vi.fn();
    const backend = createWebMcpBackend({ document: { modelContext: { registerTool } } });
    backend.register(tool({ readOnly: true, consequential: true }));
    expect(registerTool.mock.calls[0]![0]).toMatchObject({
      name: "greet",
      description: "Greets.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true, consequentialHint: true },
    });
  });

  it("answers an agent with text, whatever the tool returns", async () => {
    const registerTool = vi.fn();
    const backend = createWebMcpBackend({ document: { modelContext: { registerTool } } });
    backend.register(tool({ execute: (input) => ({ got: input }) }));
    const native = registerTool.mock.calls[0]![0] as Native;
    expect(await native.execute({ a: 1 })).toEqual({
      content: [{ type: "text", text: '{"got":{"a":1}}' }],
    });
  });

  it("answers an agent with the images the tool made, after the text", async () => {
    const registerTool = vi.fn();
    const backend = createWebMcpBackend({ document: { modelContext: { registerTool } } });
    backend.register(
      tool({ execute: () => toolOutput("two", [{ data: "AAA", mimeType: "image/png" }]) }),
    );
    const native = registerTool.mock.calls[0]![0] as Native;
    expect(await native.execute({})).toEqual({
      content: [
        { type: "text", text: "two" },
        { type: "image", data: "AAA", mimeType: "image/png" },
      ],
    });
  });

  it("answers an agent with the error, as an error, when the tool throws", async () => {
    const registerTool = vi.fn();
    const backend = createWebMcpBackend({ document: { modelContext: { registerTool } } });
    backend.register(
      tool({
        execute: () => {
          throw new Error("Nope");
        },
      }),
    );
    const native = registerTool.mock.calls[0]![0] as Native;
    expect(await native.execute({})).toEqual({
      content: [{ type: "text", text: "Nope" }],
      isError: true,
    });
  });

  it("unregisters through the signal, and by name where the browser has no signal", () => {
    const unregisterTool = vi.fn();
    const registerTool = vi.fn();
    const backend = createWebMcpBackend({
      navigator: { modelContext: { registerTool, unregisterTool } },
    });
    const registration = backend.register(tool());
    const { signal } = registerTool.mock.calls[0]![1] as { signal: AbortSignal };
    expect(signal.aborted).toBe(false);
    registration.dispose();
    expect(signal.aborted).toBe(true);
    expect(unregisterTool).toHaveBeenCalledWith("greet");
  });

  it("survives a browser that refuses the tool", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const backend = createWebMcpBackend({
      document: { modelContext: { registerTool: () => Promise.reject(new Error("taken")) } },
    });
    backend.register(tool());
    await Promise.resolve();
    await Promise.resolve();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
