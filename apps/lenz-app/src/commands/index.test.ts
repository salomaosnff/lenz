import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { setContextKey } from "../context";
import {
  availableCommands,
  declareCommand,
  executeCommand,
  isCommandAvailable,
  registerCommand,
  setExtensionWaiter,
} from ".";

const declaration = {
  command: "ext.go",
  title: "Ir",
  category: "Ext",
  icon: "lucide:x",
  when: "mode == 'on'",
};
const disposables: { dispose(): void }[] = [];

beforeEach(() => {
  disposables.splice(0).forEach((d) => d.dispose());
  setExtensionWaiter(undefined);
  setContextKey("mode", "on");
});

describe("a command a manifest declares", () => {
  it("is listed before the extension runs, with the details of the manifest", () => {
    disposables.push(declareCommand("ext", declaration));
    expect(availableCommands().find((c) => c.id === "ext.go")).toMatchObject({
      title: "Ir",
      category: "Ext",
      icon: "lucide:x",
    });
  });

  it("follows its `when`", () => {
    disposables.push(declareCommand("ext", declaration));
    expect(isCommandAvailable("ext.go")).toBe(true);
    setContextKey("mode", "off");
    expect(isCommandAvailable("ext.go")).toBe(false);
    expect(availableCommands().some((c) => c.id === "ext.go")).toBe(false);
  });

  it("running it waits for its extension, then runs what the extension registered", async () => {
    disposables.push(declareCommand("ext", declaration));
    const run = vi.fn(() => "done");
    setExtensionWaiter(async (id) => {
      expect(id).toBe("ext");
      disposables.push(registerCommand({ id: "ext.go", run })); // the extension starts and registers it
    });
    expect(await executeCommand("ext.go", 1, 2)).toBe("done");
    expect(run).toHaveBeenCalledWith(1, 2);
  });

  it("does not wait when the extension is already running", async () => {
    disposables.push(declareCommand("ext", declaration));
    disposables.push(registerCommand({ id: "ext.go", run: () => "now" }));
    const waiter = vi.fn();
    setExtensionWaiter(waiter);
    expect(await executeCommand("ext.go")).toBe("now");
    expect(waiter).not.toHaveBeenCalled();
  });

  it("says so when the extension never registers it", async () => {
    disposables.push(declareCommand("ext", declaration));
    setExtensionWaiter(async () => {});
    await expect(executeCommand("ext.go")).rejects.toThrow(
      /declared by "ext", which did not register it/,
    );
  });

  it("registering it fills in the implementation and keeps the details of the manifest", () => {
    disposables.push(declareCommand("ext", declaration));
    disposables.push(registerCommand({ id: "ext.go", run: () => {} }));
    expect(availableCommands().find((c) => c.id === "ext.go")).toMatchObject({
      title: "Ir",
      category: "Ext",
    });
  });

  it("what the code gives explicitly wins over the manifest", () => {
    disposables.push(declareCommand("ext", declaration));
    disposables.push(registerCommand({ id: "ext.go", title: "Ir agora", run: () => {} }));
    expect(availableCommands().find((c) => c.id === "ext.go")!.title).toBe("Ir agora");
  });

  it("unregistering the implementation leaves the declaration, waiting", async () => {
    disposables.push(declareCommand("ext", declaration));
    const impl = registerCommand({ id: "ext.go", run: () => "x" });
    impl.dispose();
    expect(availableCommands().some((c) => c.id === "ext.go")).toBe(true);
    setExtensionWaiter(async () => {});
    await expect(executeCommand("ext.go")).rejects.toThrow(/did not register it/);
  });

  it("an id cannot be declared or implemented twice", () => {
    disposables.push(declareCommand("ext", declaration));
    expect(() => declareCommand("other", declaration)).toThrow(/already registered/);
    disposables.push(registerCommand({ id: "ext.go", run: () => {} }));
    expect(() => registerCommand({ id: "ext.go", run: () => {} })).toThrow(/already registered/);
  });
});

describe("a command only the code knows", () => {
  it("needs a title", () => {
    expect(() => registerCommand({ id: "plain.x", run: () => {} })).toThrow(/no title/);
    disposables.push(registerCommand({ id: "plain.y", title: "Y", run: () => 7 }));
    expect(isCommandAvailable("plain.y")).toBe(true);
  });

  it("runs, and is refused when its `when` is false", async () => {
    disposables.push(
      registerCommand({ id: "plain.z", title: "Z", when: "mode == 'on'", run: () => 7 }),
    );
    expect(await executeCommand("plain.z")).toBe(7);
    setContextKey("mode", "off");
    await expect(executeCommand("plain.z")).rejects.toThrow(/not available/);
    await expect(executeCommand("nope")).rejects.toThrow(/There is no command/);
  });
});
