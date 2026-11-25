import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it, vi } from "vite-plus/test";
import { McpSession, PROTOCOL_VERSIONS, type ToolHost } from "../src/mcp";
import type { BridgeTool } from "../src/protocol";

const tool = (extra: Partial<BridgeTool> = {}): BridgeTool => ({
  name: "open_file",
  description: "Opens a file.",
  inputSchema: { type: "object", properties: { path: { type: "string" } } },
  ...extra,
});

function setup(tools: BridgeTool[] = [tool()]) {
  const sent: Record<string, any>[] = [];
  const call = vi.fn<ToolHost["call"]>(async (_name, args) => ({
    text: `opened ${String(args.path)}`,
  }));
  const host: ToolHost = { tools: () => tools, call };
  const session = new McpSession(host, (message) => sent.push(message));
  const ask = async (method: string, params?: unknown, id: number | string = 1) => {
    await session.handle({ jsonrpc: "2.0", id, method, params });
    return sent.at(-1)!;
  };
  return { session, call, sent, ask, tools };
}

describe("the skill", () => {
  it("tells the client the rules as it starts, in a few lines", async () => {
    const { ask } = setup();
    const { instructions } = (await ask("initialize", {})).result;
    expect(instructions).toContain("inline");
    expect(instructions).toContain("get_app_state");
    expect(instructions).toContain("prompt `lenz`");
    expect(instructions.split("\n").length).toBeLessThan(15);
  });

  it("offers the full guide as a prompt", async () => {
    const { ask } = setup();
    const { prompts } = (await ask("prompts/list")).result;
    expect(prompts).toEqual([
      expect.objectContaining({
        name: "lenz",
        arguments: [expect.objectContaining({ name: "tarefa", required: false })],
      }),
    ]);
    const { messages } = (await ask("prompts/get", { name: "lenz" })).result;
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe("user");
    expect(messages[0].content.text).toContain("Regra de estilo (obrigatória)");
  });

  it("adds the task to the guide", async () => {
    const { ask } = setup();
    const reply = await ask("prompts/get", {
      name: "lenz",
      arguments: { tarefa: "  uma landing  " },
    });
    expect(reply.result.messages[0].content.text).toMatch(/## Tarefa\n\numa landing$/);
  });

  it("refuses a prompt that is not there, or that has no name", async () => {
    const { ask } = setup();
    expect((await ask("prompts/get", { name: "nope" })).error.message).toContain("Unknown prompt");
    expect((await ask("prompts/get", {})).error.message).toContain("name is required");
  });

  it("names, in the guide, only tools that exist", async () => {
    const { SKILL } = await import("../src/skill");
    const root = new URL("../../../", import.meta.url);
    const builtin = new URL("apps/lenz-app/src/agent-tools/builtin/", root);
    const known = new Set<string>();
    for (const file of readdirSync(builtin)) {
      if (!file.endsWith(".ts") || file.endsWith(".test.ts")) continue;
      for (const m of readFileSync(new URL(file, builtin), "utf8").matchAll(
        /^\s+name: "([a-z_]+)"/gm,
      )) {
        known.add(m[1]!);
      }
    }
    const visual = JSON.parse(
      readFileSync(new URL("extensions/html-visual-editor/package.json", root), "utf8"),
    ) as { contributes: { tools: { name: string }[] } };
    for (const tool of visual.contributes.tools) known.add(tool.name);

    const mentioned = [
      ...new Set([...SKILL.matchAll(/`([a-z]+(?:_[a-z]+)+)`/g)].map((m) => m[1]!)),
    ];
    expect(mentioned.length).toBeGreaterThan(20);
    expect(mentioned.filter((name) => !known.has(name))).toEqual([]);
  });
});

describe("initialize", () => {
  it("answers with the version the client asked for, when it is known", async () => {
    const { ask } = setup();
    const reply = await ask("initialize", { protocolVersion: "2024-11-05" });
    expect(reply.result.protocolVersion).toBe("2024-11-05");
    expect(reply.result.capabilities).toEqual({ tools: { listChanged: true }, prompts: {} });
    expect(reply.result.serverInfo.name).toBe("lenz-mcp");
  });

  it("offers the newest version to a client that asks for another", async () => {
    const { ask } = setup();
    expect(
      (await ask("initialize", { protocolVersion: "1999-01-01" })).result.protocolVersion,
    ).toBe(PROTOCOL_VERSIONS[0]);
  });

  it("answers a ping", async () => {
    expect((await setup().ask("ping")).result).toEqual({});
  });
});

describe("tools", () => {
  it("lists them, with what an agent needs to be careful", async () => {
    const { ask } = setup([
      tool(),
      tool({ name: "list_files", readOnly: true }),
      tool({ name: "delete_file", consequential: true, title: "Delete" }),
    ]);
    const { tools } = (await ask("tools/list")).result;
    expect(
      tools.map((t: any) => [t.name, t.annotations.readOnlyHint, t.annotations.destructiveHint]),
    ).toEqual([
      ["open_file", false, false],
      ["list_files", true, false],
      ["delete_file", false, true],
    ]);
    expect(tools[0].inputSchema.type).toBe("object");
  });

  it("calls one, and gives back its text", async () => {
    const { ask, call } = setup();
    const reply = await ask("tools/call", { name: "open_file", arguments: { path: "a.html" } });
    expect(call).toHaveBeenCalledWith("open_file", { path: "a.html" });
    expect(reply.result).toEqual({ content: [{ type: "text", text: "opened a.html" }] });
  });

  it("gives back the images a tool made, after its text", async () => {
    const { ask, call } = setup();
    call.mockResolvedValueOnce({
      text: "two shots",
      images: [
        { data: "AAA", mimeType: "image/png" },
        { data: "BBB", mimeType: "image/png" },
      ],
    });
    const reply = await ask("tools/call", { name: "open_file" });
    expect(reply.result).toEqual({
      content: [
        { type: "text", text: "two shots" },
        { type: "image", data: "AAA", mimeType: "image/png" },
        { type: "image", data: "BBB", mimeType: "image/png" },
      ],
    });
  });

  it("marks a failed call, whether the tool said so or threw", async () => {
    const { ask, call } = setup();
    call.mockResolvedValueOnce({ text: "no such file", isError: true });
    expect((await ask("tools/call", { name: "open_file" })).result).toEqual({
      content: [{ type: "text", text: "no such file" }],
      isError: true,
    });
    call.mockRejectedValueOnce(new Error("boom"));
    expect((await ask("tools/call", { name: "open_file" })).result.isError).toBe(true);
  });

  it("leaves a call to the host when nothing is on offer, so it can say why", async () => {
    const { ask, call } = setup([]);
    call.mockResolvedValueOnce({ text: "Lenz is not connected", isError: true });
    expect((await ask("tools/call", { name: "open_file" })).result).toEqual({
      content: [{ type: "text", text: "Lenz is not connected" }],
      isError: true,
    });
  });

  it("refuses a tool that is not on offer", async () => {
    const { ask, call } = setup();
    const reply = await ask("tools/call", { name: "nope" });
    expect(reply.error.code).toBe(-32602);
    expect(call).not.toHaveBeenCalled();
    expect((await ask("tools/call", {})).error.code).toBe(-32602);
  });
});

describe("the rest of JSON-RPC", () => {
  it("knows nothing else, and says so", async () => {
    expect((await setup().ask("resources/list")).error.code).toBe(-32601);
  });

  it("does not answer a notification, even an unknown one", async () => {
    const { session, sent } = setup();
    await session.handle({ jsonrpc: "2.0", method: "notifications/whatever" });
    await session.handle({ jsonrpc: "2.0", method: "notifications/initialized" });
    expect(sent).toEqual([]);
  });

  it("rejects what is not a request", async () => {
    const { session, sent } = setup();
    await session.handle({ hello: "world" });
    session.rejectUnreadable();
    expect(sent.map((m) => m.error.code)).toEqual([-32600, -32700]);
  });

  it("answers each message of a batch", async () => {
    const { session, sent } = setup();
    await session.handle([
      { jsonrpc: "2.0", id: 1, method: "ping" },
      { jsonrpc: "2.0", id: 2, method: "ping" },
    ]);
    expect(sent.map((m) => m.id)).toEqual([1, 2]);
  });

  it("tells the client the tools changed, but only after it started", async () => {
    const { session, sent } = setup();
    session.notifyToolsChanged();
    expect(sent).toEqual([]);
    await session.handle({ jsonrpc: "2.0", method: "notifications/initialized" });
    session.notifyToolsChanged();
    expect(sent).toEqual([{ jsonrpc: "2.0", method: "notifications/tools/list_changed" }]);
  });
});
