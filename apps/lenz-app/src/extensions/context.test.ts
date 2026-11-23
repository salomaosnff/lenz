import { afterEach, describe, expect, it } from "vite-plus/test";
import { availableCommands, declareCommand, executeCommand } from "../commands";
import { setContextKey } from "../context";
import { getEditorProvidersFor, getViewProvider } from "../providers";
import { createExtensionContext } from "./context";

const contributes = {
  commands: [{ command: "ext.go", title: "Ir", category: "Ext", icon: "lucide:x", when: "a" }],
  views: { explorer: [{ id: "ext.tree", name: "Árvore" }] },
  editors: [
    {
      id: "ext.visual",
      label: "Visual",
      icon: "lucide:eye",
      selector: ["*.zzz"],
      priority: "default" as const,
    },
  ],
};
const disposables: { dispose(): void }[] = [];
const make = () => {
  const context = createExtensionContext("ext", () => undefined, [], contributes);
  // What the loader does with the manifest, before the extension runs.
  disposables.push(declareCommand("ext", contributes.commands[0]!));
  return context;
};
afterEach(() =>
  disposables
    .splice(0)
    .reverse()
    .forEach((d) => d.dispose()),
);

describe("what an extension can register", () => {
  it("a command that is declared, with only what it does", async () => {
    const context = make();
    // A caller that is not type-checked may pass more: it is not used.
    disposables.push(
      context.commands.registerCommand({
        id: "ext.go",
        run: () => "ran",
        title: "Hacked",
        when: "true",
      } as never),
    );
    setContextKey("a", true); // the `when` the manifest gave it
    expect(availableCommands().find((c) => c.id === "ext.go")).toMatchObject({
      title: "Ir",
      category: "Ext",
      icon: "lucide:x",
      when: "a",
    });
    setContextKey("a", undefined);
  });

  it("refuses a command that is not declared, even with a title", () => {
    const context = make();
    expect(() =>
      context.commands.registerCommand({
        id: "ext.sneaky",
        run: () => {},
        title: "Sneaky",
      } as never),
    ).toThrow(/does not declare.*commands/);
    expect(availableCommands().some((c) => c.id === "ext.sneaky")).toBe(false);
  });

  it("refuses to implement a command of another extension", () => {
    disposables.push(declareCommand("other", { command: "other.go", title: "Outro" }));
    const context = make();
    expect(() => context.commands.registerCommand({ id: "other.go", run: () => {} })).toThrow(
      /"ext".*"other.go"/,
    );
  });

  it("can still run any command", async () => {
    const context = make();
    disposables.push(context.commands.registerCommand({ id: "ext.go", run: () => 7 }));
    // `when` is "a", which is not set: the command is declared but not available, and running it says so.
    await expect(context.commands.executeCommand("ext.go")).rejects.toThrow(/not available/);
    await expect(executeCommand("nope")).rejects.toThrow(/There is no command/);
  });

  it("a view provider for a declared view, and not for another", () => {
    const context = make();
    disposables.push(
      context.views.registerViewProvider({
        viewId: "ext.tree",
        resolveView: () => ({ type: "vue-component", component: {} as never }),
      }),
    );
    expect(getViewProvider("ext.tree")).toBeDefined();
    expect(() =>
      context.views.registerViewProvider({
        viewId: "explorer-files",
        resolveView: () => ({ type: "vue-component", component: {} as never }),
      }),
    ).toThrow(/does not declare.*views/);
    expect(getViewProvider("explorer-files")).toBeUndefined();
  });

  it("an editor takes its details from the manifest", () => {
    const context = make();
    disposables.push(
      context.editors.registerEditorProvider({
        id: "ext.visual",
        resolveEditor: () => ({ type: "vue-component", component: {} as never }),
        // not type-checked callers: these are not used
        ...({ label: "Mine", selector: ["*"], priority: "option" } as object),
      } as never),
    );
    expect(getEditorProvidersFor("a.zzz")).toMatchObject([
      { id: "ext.visual", label: "Visual", icon: "lucide:eye", priority: "default" },
    ]);
    expect(getEditorProvidersFor("a.html").some((p) => p.id === "ext.visual")).toBe(false);
  });

  it("refuses an editor that is not declared", () => {
    const context = make();
    expect(() =>
      context.editors.registerEditorProvider({
        id: "ext.hidden",
        resolveEditor: () => ({ type: "vue-component", component: {} as never }),
      }),
    ).toThrow(/does not declare.*editors/);
  });
});

describe("what an extension cannot do at all", () => {
  it("has no way to add a panel, a view or a shortcut at run time", () => {
    const context = make() as unknown as Record<string, Record<string, unknown> | undefined>;
    expect(context.keybindings).toBeUndefined();
    expect(context.views!.registerView).toBeUndefined();
    expect(context.views!.registerViewContainer).toBeUndefined();
    expect(Object.keys(context.views!)).toEqual(["registerViewProvider"]);
  });
});

describe("notifications", () => {
  it("carry the extension that showed them, and go with it", async () => {
    const { notices } = await import("../notifications");
    const context = make();
    const answer = context.notifications.showInformationMessage("Hi", "Ok");
    expect(notices.at(-1)).toMatchObject({ message: "Hi", source: "ext" });
    context.subscriptions.forEach((d) => d.dispose());
    await expect(answer).resolves.toBeUndefined();
    expect(notices.some((n) => n.source === "ext")).toBe(false);
  });
});
