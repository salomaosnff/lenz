import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { allTools, registerTool, useBackend } from "./registry";
import type { AgentTool, AgentToolBackend } from "./types";

const disposables: { dispose(): void }[] = [];
const keep = <T extends { dispose(): void }>(disposable: T) => {
  disposables.push(disposable);
  return disposable;
};

afterEach(() => {
  disposables.splice(0).forEach((d) => d.dispose());
  vi.restoreAllMocks();
});

const tool = (name: string): AgentTool => ({ name, description: name, execute: () => name });

function fakeBackend(overrides: Partial<AgentToolBackend> = {}) {
  const live = new Set<string>();
  const backend: AgentToolBackend = {
    id: "fake",
    isSupported: () => true,
    register: (t) => {
      live.add(t.name);
      return { dispose: () => void live.delete(t.name) };
    },
    ...overrides,
  };
  return { backend, live };
}

describe("agent tools", () => {
  it("reach a backend whether they were registered before it or after", () => {
    keep(registerTool(tool("before")));
    const { backend, live } = fakeBackend();
    keep(useBackend(backend));
    keep(registerTool(tool("after")));
    expect([...live]).toEqual(["before", "after"]);
  });

  it("go away from the backend when disposed, and all of them when the backend is", () => {
    const { backend, live } = fakeBackend();
    const attached = keep(useBackend(backend));
    const a = registerTool(tool("a"));
    keep(registerTool(tool("b")));
    a.dispose();
    expect([...live]).toEqual(["b"]);
    attached.dispose();
    expect(live.size).toBe(0);
    expect(allTools().map((t) => t.name)).toContain("b");
  });

  it("refuse a name that is taken", () => {
    keep(registerTool(tool("dup")));
    expect(() => registerTool(tool("dup"))).toThrow(/already registered/);
  });

  it("do not reach a backend that is not supported", () => {
    const register = vi.fn();
    keep(useBackend(fakeBackend({ isSupported: () => false, register }).backend));
    keep(registerTool(tool("a")));
    expect(register).not.toHaveBeenCalled();
  });

  it("are not stopped by a backend that fails", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { backend } = fakeBackend({
      register: () => {
        throw new Error("no");
      },
    });
    const other = fakeBackend();
    keep(useBackend(backend));
    keep(useBackend(other.backend));
    keep(registerTool(tool("a")));
    expect([...other.live]).toEqual(["a"]);
  });
});
