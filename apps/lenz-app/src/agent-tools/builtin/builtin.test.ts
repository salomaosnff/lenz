import { describe, expect, it, vi } from "vite-plus/test";
import { createPinia, setActivePinia } from "pinia";

const mocks = vi.hoisted(() => ({ warn: vi.fn(async () => undefined) }));

vi.mock("../../prompts", () => ({ prompts: { showInputBox: vi.fn(), showQuickPick: vi.fn() } }));
vi.mock("../../notifications", () => ({
  notifications: {
    showErrorMessage: vi.fn(async () => undefined),
    showWarningMessage: mocks.warn,
    showInformationMessage: vi.fn(async () => undefined),
  },
}));

import { historyOf } from "../../editor/history";
import { useEditorStore } from "../../editor/store";
import { HandleFileSystem } from "../../fs/handle";
import { emptyDirectory } from "../../fs/testing";
import { exists, readTextFile, writeTextFile } from "../../fs/types";
import { useWorkspaceStore } from "../../fs/workspace";
import type { AgentTool } from "../types";
import { appTools } from "./app";
import { commandTools } from "./commands";
import { dialogTools } from "./dialogs";
import { editorTools } from "./editor";
import { extensionTools } from "./extensions";
import { fileTools } from "./files";
import { keybindingTools } from "./keybindings";
import { layoutTools } from "./layout";

const all = [
  ...appTools,
  ...commandTools,
  ...editorTools,
  ...fileTools,
  ...layoutTools,
  ...extensionTools,
  ...keybindingTools,
  ...dialogTools,
];

class MemoryFileSystem extends HandleFileSystem {
  readonly kind = "memory";
}

// Async, like the backend that calls them: a tool may throw before it returns anything.
const run = async (name: string, input: Record<string, unknown> = {}) =>
  all.find((t) => t.name === name)!.execute(input);

async function setup() {
  setActivePinia(createPinia());
  const fs = new MemoryFileSystem(emptyDirectory());
  await writeTextFile(fs, "index.html", "<h1>home</h1>");
  await writeTextFile(fs, "pages/about.html", "<h1>about</h1>\nteam");
  await writeTextFile(fs, "pages/deep/team.html", "<h1>team</h1>");
  useWorkspaceStore().fs = fs;
  return { fs, editor: useEditorStore(), workspace: useWorkspaceStore() };
}

describe("the tools of the app", () => {
  it("have a unique snake_case name, a description and a valid schema", () => {
    const names = all.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
    for (const tool of all as AgentTool[]) {
      expect(tool.name).toMatch(/^[a-z][a-z0-9_]*$/);
      expect(tool.description.length).toBeGreaterThan(20);
      if (!tool.inputSchema) continue;
      const {
        type,
        properties = {},
        required = [],
      } = tool.inputSchema as {
        type: string;
        properties?: Record<string, unknown>;
        required?: string[];
      };
      expect(type).toBe("object");
      for (const key of required) expect(Object.keys(properties)).toContain(key);
    }
  });

  it("do not claim to be read-only and consequential at once", () => {
    for (const tool of all) expect(tool.readOnly && tool.consequential).toBeFalsy();
  });
});

describe("editing open files", () => {
  it("writes and replaces text as an entry the user can undo", async () => {
    const { editor } = await setup();
    editor.open("a.html", "<p>one</p>");
    await run("write_tab", { content: "<p>two two</p>" });
    expect(editor.activeTab?.content).toBe("<p>two two</p>");
    expect(historyOf(editor.activeTab!).current.label).toBe("Agente");

    await expect(run("replace_in_tab", { find: "two", replace: "three" })).rejects.toThrow(
      /2 times/,
    );
    expect(editor.activeTab?.content).toBe("<p>two two</p>");
    await run("replace_in_tab", { find: "two", replace: "three", replaceAll: true });
    expect(editor.activeTab?.content).toBe("<p>three three</p>");
    await expect(run("replace_in_tab", { find: "zzz", replace: "x" })).rejects.toThrow(/not in/);

    await run("undo_tab", { steps: 2 });
    expect(editor.activeTab?.content).toBe("<p>one</p>");
    await run("redo_tab");
    expect(editor.activeTab?.content).toBe("<p>two two</p>");
  });

  it("refuses to close what has unsaved changes, unless told to discard them", async () => {
    const { editor } = await setup();
    editor.open("a.html", "x");
    await run("write_tab", { content: "y" });
    await expect(run("close_tab")).rejects.toThrow(/unsaved changes/);
    expect(editor.tabs).toHaveLength(1);
    await run("close_tab", { discardChanges: true });
    expect(editor.tabs).toHaveLength(0);
  });

  it("names the tab it could not find, and rejects what is not the right type", async () => {
    const { editor } = await setup();
    editor.open("a.html", "x");
    await expect(run("read_tab", { path: "nope.html" })).rejects.toThrow(
      /no open file "nope.html"/,
    );
    await expect(run("write_tab", { content: 3 })).rejects.toThrow(/"content" must be a string/);
    await expect(run("close_tab", { discardChanges: "yes" })).rejects.toThrow(/true or false/);
  });
});

describe("the files of the project", () => {
  it("lists, reads and searches them", async () => {
    await setup();
    const listed = (await run("list_files", { recursive: true })) as { found: { path: string }[] };
    expect(listed.found.map((f) => f.path)).toEqual(
      expect.arrayContaining(["index.html", "pages", "pages/about.html", "pages/deep/team.html"]),
    );
    expect(await run("read_file", { path: "/pages//about.html" })).toMatchObject({
      path: "pages/about.html",
    });
    const found = (await run("search_files", { query: "TEAM" })) as {
      matches: { path: string; line: number }[];
    };
    expect(found.matches).toEqual([
      { path: "pages/about.html", line: 2, text: "team" },
      { path: "pages/deep/team.html", line: 1, text: "<h1>team</h1>" },
    ]);
  });

  it("will not leave the project", async () => {
    await setup();
    await expect(run("read_file", { path: "../secret" })).rejects.toThrow(/Invalid path/);
  });

  it("writes a file and shows it in an open tab that is clean, but not over unsaved work", async () => {
    const { fs, workspace, editor } = await setup();
    await workspace.openFile("index.html");
    await run("write_file", { path: "index.html", content: "<h1>new</h1>" });
    expect(await readTextFile(fs, "index.html")).toBe("<h1>new</h1>");
    expect(editor.activeTab?.content).toBe("<h1>new</h1>");
    expect(editor.isDirty(editor.activeTab!)).toBe(false);

    await run("write_tab", { content: "typed" });
    await expect(run("write_file", { path: "index.html", content: "x" })).rejects.toThrow(
      /unsaved changes/,
    );
    expect(await readTextFile(fs, "index.html")).toBe("<h1>new</h1>");
  });

  it("deletes without asking, and closes what was open under it", async () => {
    const { fs, workspace, editor } = await setup();
    await workspace.openFile("pages/about.html");
    await run("write_tab", { content: "unsaved" });
    expect(await run("delete_path", { path: "pages" })).toEqual({
      path: "pages",
      deleted: true,
      closedTabs: ["pages/about.html"],
    });
    expect(await exists(fs, "pages")).toBe(false);
    expect(editor.tabs).toHaveLength(0);
    expect(mocks.warn).not.toHaveBeenCalled();
    await expect(run("delete_path", { path: "pages" })).rejects.toThrow();
    await expect(run("delete_path", { path: "/" })).rejects.toThrow(/root/);
  });

  it("renames, unless the file is open", async () => {
    const { fs, workspace } = await setup();
    await workspace.openFile("index.html");
    await expect(run("rename_path", { from: "index.html", to: "home.html" })).rejects.toThrow(
      /Close these first/,
    );
    await run("rename_path", { from: "pages", to: "docs" });
    expect(await exists(fs, "docs/about.html")).toBe(true);
    expect(await exists(fs, "pages")).toBe(false);
  });

  it("says why there is no project", async () => {
    setActivePinia(createPinia());
    useWorkspaceStore().error = "Sem armazenamento.";
    await expect(run("list_files")).rejects.toThrow("Sem armazenamento.");
  });
});
