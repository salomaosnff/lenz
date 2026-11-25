import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { declareTool, implementTool, setExtensionWaiter } from "./extension-tools";
import { allTools, useBackend } from "./registry";
import type { AgentTool } from "./types";

const disposables: { dispose(): void }[] = [];
const keep = <T extends { dispose(): void }>(disposable: T) => {
  disposables.push(disposable);
  return disposable;
};
afterEach(() => {
  disposables
    .splice(0)
    .reverse()
    .forEach((d) => d.dispose());
  setExtensionWaiter(undefined);
  vi.useRealTimers();
});

const declaration = {
  name: "ext.look",
  title: "Olhar",
  description: "Looks.",
  inputSchema: { type: "object" },
  readOnly: true,
};
const find = () => allTools().find((t) => t.name === "ext.look")!;

describe("a tool an extension declares", () => {
  it("is offered to agents from the start, with what the manifest says", () => {
    const offered: AgentTool[] = [];
    keep(
      useBackend({
        id: "spy",
        isSupported: () => true,
        register: (tool) => (offered.push(tool), { dispose() {} }),
      }),
    );
    keep(declareTool("ext", declaration));
    expect(offered[0]).toMatchObject({ name: "ext.look", title: "Olhar", readOnly: true });
  });

  it("makes a call wait for the extension to start, then runs what it registered", async () => {
    let start!: () => void;
    setExtensionWaiter(() => new Promise<void>((resolve) => (start = resolve)));
    keep(declareTool("ext", declaration));
    const call = find().execute({ a: 1 });
    keep(implementTool("ext.look", (input) => ({ got: input })));
    start();
    expect(await call).toEqual({ got: { a: 1 } });
  });

  it("tells the agent when the extension never starts, or does not register it", async () => {
    vi.useFakeTimers();
    setExtensionWaiter(() => new Promise<void>(() => {}));
    keep(declareTool("ext", declaration));
    const slow = expect(find().execute({})).rejects.toThrow(/did not start in time/);
    await vi.advanceTimersByTimeAsync(15_000);
    await slow;

    setExtensionWaiter(async () => {});
    await expect(find().execute({})).rejects.toThrow(/did not register it/);
  });

  it("goes back to waiting when the implementation is taken away", async () => {
    setExtensionWaiter(async () => {});
    keep(declareTool("ext", declaration));
    const implementation = implementTool("ext.look", () => "ok");
    expect(await find().execute({})).toBe("ok");
    implementation.dispose();
    await expect(find().execute({})).rejects.toThrow(/did not register it/);
  });

  it("cannot be implemented twice, nor without a declaration, and goes away when disposed", () => {
    expect(() => implementTool("ext.look", () => 1)).toThrow(/no declared tool/);
    const declared = declareTool("ext", declaration);
    keep(implementTool("ext.look", () => 1));
    expect(() => implementTool("ext.look", () => 2)).toThrow(/already registered/);
    declared.dispose();
    expect(allTools().some((t) => t.name === "ext.look")).toBe(false);
  });

  it("cannot take the name of a tool of the app", () => {
    keep(declareTool("ext", { ...declaration, name: "ext.same" }));
    expect(() => declareTool("other", { ...declaration, name: "ext.same" })).toThrow(
      /already registered/,
    );
  });
});
