import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { createPinia, setActivePinia } from "pinia";

// An extension is a folder with a package.json and a module. Both come from these two maps, so no
// network or native import is needed.
const manifests = new Map<string, unknown>();
const modules = new Map<string, unknown>();
vi.stubGlobal("location", { href: "http://localhost/" });
vi.stubGlobal("fetch", async (url: string) => {
  const manifest = manifests.get(new URL(url).pathname);
  return {
    ok: manifest !== undefined,
    status: manifest === undefined ? 404 : 200,
    json: async () => manifest,
  };
});
vi.stubGlobal(
  "Function",
  class {
    constructor() {
      return (url: string) => Promise.resolve({ default: modules.get(new URL(url).pathname) });
    }
  },
);

const { loadExtension, unloadExtension } = await import("./loader");
const { availableCommands, executeCommand, registerCommand } = await import("../commands");
const { keybindingsFor } = await import("../keybindings");

/** Puts an extension in the folder `/<name>/`; `main` defaults to `index.js`. */
function install(name: string, extension: unknown, manifest: Record<string, unknown> = {}) {
  manifests.set(`/${name}/package.json`, { name, version: "1.0.0", main: "index.js", ...manifest });
  modules.set(`/${name}/${manifest.main ?? "index.js"}`, extension);
}
const load = (name: string) => loadExtension(name, `/${name}/`);

afterEach(() => {
  manifests.clear();
  modules.clear();
});

describe("the manifest", () => {
  it("says which file is the extension", async () => {
    const activate = vi.fn();
    install("own-main", { activate }, { main: "dist/extension.js" });
    await load("own-main");
    expect(activate).toHaveBeenCalledTimes(1);
    await unloadExtension("own-main");
  });

  it("a folder without a package.json, or with a broken one, does not load", async () => {
    await expect(load("missing")).rejects.toThrow(/Could not read .*package\.json \(404\)/);
    manifests.set("/broken/package.json", { name: "broken", version: "1" }); // no main
    await expect(load("broken")).rejects.toThrow(/"main"/);
  });

  it("a package.json for another extension is refused", async () => {
    install("real-name", { activate() {} });
    manifests.set("/imposter/package.json", { name: "real-name", version: "1", main: "index.js" });
    await expect(load("imposter")).rejects.toThrow(/named "real-name"/);
    await unloadExtension("real-name");
  });

  it("a main that climbs out of the folder is refused", async () => {
    install("escape", { activate() {} }, { main: "../other/index.js" });
    await expect(load("escape")).rejects.toThrow(/"main" must be a path inside/);
  });
});

describe("what a manifest contributes", () => {
  it("commands and shortcuts exist before the extension runs, and leave with it", async () => {
    let listedBeforeActivation = false;
    let shortcutBeforeActivation: string[] = [];
    install(
      "contrib",
      {
        activate() {
          listedBeforeActivation = availableCommands().some((c) => c.id === "contrib.hello");
          shortcutBeforeActivation = keybindingsFor("contrib.hello");
          registerCommand({ id: "contrib.hello", run: () => "hello" });
        },
      },
      {
        contributes: {
          commands: [{ command: "contrib.hello", title: "Olá", category: "Contrib" }],
          keybindings: [{ key: "Ctrl+Shift+9", command: "contrib.hello" }],
        },
      },
    );
    await load("contrib");
    expect(listedBeforeActivation).toBe(true);
    expect(shortcutBeforeActivation).toEqual(["Ctrl+Shift+9"]);
    expect(availableCommands().find((c) => c.id === "contrib.hello")).toMatchObject({
      title: "Olá",
      category: "Contrib",
    });
    expect(await executeCommand("contrib.hello")).toBe("hello");

    await unloadExtension("contrib");
    expect(availableCommands().some((c) => c.id === "contrib.hello")).toBe(false);
    expect(keybindingsFor("contrib.hello")).toEqual([]);
  });

  it("running a declared command waits for the extension to finish starting", async () => {
    install(
      "slow",
      {
        async activate() {
          await new Promise((r) => setTimeout(r, 20));
          registerCommand({ id: "slow.go", run: () => "late" });
        },
      },
      { contributes: { commands: [{ command: "slow.go", title: "Devagar" }] } },
    );
    const loading = load("slow");
    await new Promise((r) => setTimeout(r, 5)); // declared, not activated yet
    expect(availableCommands().some((c) => c.id === "slow.go")).toBe(true);
    expect(await executeCommand("slow.go")).toBe("late");
    await loading;
    await unloadExtension("slow");
  });

  it("panels and views are put in the layout, and taken away", async () => {
    setActivePinia(createPinia());
    const { useLayoutStore } = await import("../layout/store");
    const layout = useLayoutStore();
    install(
      "panel",
      { activate() {} },
      {
        contributes: {
          viewsContainers: { activitybar: [{ id: "panel", title: "Painel", icon: "lucide:box" }] },
          views: { panel: [{ id: "panel.list", name: "Lista", when: "x", collapsed: true }] },
        },
      },
    );
    await load("panel");
    const container = layout.containers.find((c) => c.id === "panel");
    expect(container).toMatchObject({ title: "Painel", icon: "lucide:box" });
    expect(container!.views).toEqual([
      { id: "panel.list", title: "Lista", when: "x", collapsed: true },
    ]);
    await unloadExtension("panel");
    expect(layout.containers.some((c) => c.id === "panel")).toBe(false);
  });

  it("an extension that fails to start does not leave its contributions behind", async () => {
    install(
      "fails",
      {
        activate() {
          throw new Error("boom");
        },
      },
      { contributes: { commands: [{ command: "fails.go", title: "Vai" }] } },
    );
    await expect(load("fails")).rejects.toThrow("boom");
    expect(availableCommands().some((c) => c.id === "fails.go")).toBe(false);
  });

  it("a contribution that cannot be registered stops the extension and undoes the rest", async () => {
    install(
      "dupe-a",
      { activate() {} },
      { contributes: { commands: [{ command: "dupe.go", title: "A" }] } },
    );
    await load("dupe-a");
    install(
      "dupe-b",
      { activate() {} },
      {
        contributes: {
          commands: [
            { command: "dupe-b.first", title: "B1" },
            { command: "dupe.go", title: "B2" },
          ],
        },
      },
    );
    await expect(load("dupe-b")).rejects.toThrow(/already registered/);
    expect(availableCommands().some((c) => c.id === "dupe-b.first")).toBe(false);
    await unloadExtension("dupe-a");
  });
});

describe("only what the manifest declares", () => {
  it("an extension that registers something it did not declare fails to start, and leaves nothing", async () => {
    install(
      "sneaky",
      {
        activate(context: { commands: { registerCommand(c: unknown): void } }) {
          context.commands.registerCommand({ id: "sneaky.undeclared", run: () => {} });
        },
      },
      { contributes: { commands: [{ command: "sneaky.declared", title: "Declarado" }] } },
    );
    await expect(load("sneaky")).rejects.toThrow(/does not declare.*contributes\.commands/);
    expect(availableCommands().some((c) => c.id === "sneaky.declared")).toBe(false);
    expect(availableCommands().some((c) => c.id === "sneaky.undeclared")).toBe(false);
  });

  it("an extension that only registers what it declared starts", async () => {
    install(
      "honest",
      {
        activate(context: { commands: { registerCommand(c: unknown): void } }) {
          context.commands.registerCommand({ id: "honest.go", run: () => "ok" });
        },
      },
      { contributes: { commands: [{ command: "honest.go", title: "Vai" }] } },
    );
    await load("honest");
    expect(await executeCommand("honest.go")).toBe("ok");
    await unloadExtension("honest");
  });
});

describe("extension dependencies", () => {
  it("activates dependencies from the manifest first and passes their exports", async () => {
    const order: string[] = [];
    install("base", {
      activate: async () => {
        await new Promise((r) => setTimeout(r, 10));
        order.push("base");
        return { answer: 42 };
      },
    });
    let seen: unknown;
    install(
      "user",
      {
        activate: (context: { extensions: { getExports(id: string): unknown } }) => {
          order.push("user");
          seen = context.extensions.getExports("base");
        },
      },
      { extensionDependencies: ["base"] },
    );
    // The dependent starts first on purpose.
    await Promise.all([load("user"), load("base")]);
    expect(order).toEqual(["base", "user"]);
    expect(seen).toEqual({ answer: 42 });
    await unloadExtension("base");
  });

  it("refuses exports of an undeclared dependency", async () => {
    install("solo", {
      activate: (context: { extensions: { getExports(id: string): unknown } }) =>
        context.extensions.getExports("base"),
    });
    await expect(load("solo")).rejects.toThrow(/dependencies/);
  });

  it("fails the dependent when a dependency fails", async () => {
    install("broken-dep", {
      activate: () => {
        throw new Error("boom");
      },
    });
    install("child", { activate: () => {} }, { extensionDependencies: ["broken-dep"] });
    const results = await Promise.allSettled([load("broken-dep"), load("child")]);
    expect(results.map((r) => r.status)).toEqual(["rejected", "rejected"]);
    expect(String((results[1] as PromiseRejectedResult).reason)).toMatch(/failed to activate/);
  });

  it("unloads dependents before the dependency", async () => {
    const order: string[] = [];
    install("a", { activate: () => {}, deactivate: () => void order.push("a") });
    install(
      "b",
      { activate: () => {}, deactivate: () => void order.push("b") },
      { extensionDependencies: ["a"] },
    );
    await Promise.all([load("a"), load("b")]);
    await unloadExtension("a");
    expect(order).toEqual(["b", "a"]);
  });
});
