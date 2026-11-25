import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { createPinia, setActivePinia } from "pinia";

const answers: { input?: string | undefined; button?: string | undefined } = {};

vi.mock("../prompts", () => ({
  prompts: {
    showInputBox: vi.fn(async (options?: { validateInput?(v: string): unknown }) => {
      // What the real box does: an invalid answer cannot be accepted.
      if (answers.input !== undefined && (await options?.validateInput?.(answers.input))) return;
      return answers.input;
    }),
  },
}));
vi.mock("../notifications", () => ({
  notifications: {
    showErrorMessage: vi.fn(async () => undefined),
    showWarningMessage: vi.fn(async () => answers.button),
    showInformationMessage: vi.fn(async () => undefined),
  },
}));

import { useEditorStore } from "../editor/store";
import { HandleFileSystem } from "./handle";
import { emptyDirectory } from "./testing";
import { exists, readTextFile, writeTextFile } from "./types";
import { useWorkspaceStore } from "./workspace";

class MemoryFileSystem extends HandleFileSystem {
  readonly kind = "memory";
}

async function setup() {
  setActivePinia(createPinia());
  const fs = new MemoryFileSystem(emptyDirectory());
  await writeTextFile(fs, "index.html", "<h1>home</h1>");
  await writeTextFile(fs, "pages/about.html", "<h1>about</h1>");
  await writeTextFile(fs, "pages/deep/team.html", "<h1>team</h1>");
  const workspace = useWorkspaceStore();
  // Same as opening a folder, without the picker.
  workspace.fs = fs;
  return { fs, workspace, editor: useEditorStore() };
}

beforeEach(() => {
  answers.input = undefined;
  answers.button = undefined;
});

describe("create", () => {
  it("creates a file, opens it, and expands where it went", async () => {
    const { fs, workspace, editor } = await setup();
    answers.input = "pages/new/page.html";
    await workspace.createFile();
    expect(await exists(fs, "pages/new/page.html")).toBe(true);
    expect(editor.activeId).toBe("pages/new/page.html");
    expect(workspace.expanded.has("pages/new")).toBe(true);
    expect(workspace.expanded.has("pages")).toBe(true);
  });

  it("does nothing when the box is cancelled, or the name is taken", async () => {
    const { fs, workspace, editor } = await setup();
    await workspace.createFile();
    answers.input = "index.html";
    await workspace.createFile();
    expect(editor.tabs).toHaveLength(0);
    expect(await readTextFile(fs, "index.html")).toBe("<h1>home</h1>");
  });

  it("creates a folder inside another", async () => {
    const { fs, workspace } = await setup();
    answers.input = "assets";
    await workspace.createFolder("pages");
    expect((await fs.stat("pages/assets")).type).toBe("directory");
    expect(workspace.expanded.has("pages/assets")).toBe(true);
  });
});

describe("rename", () => {
  it("renames a file, and reopens it under the new name", async () => {
    const { fs, workspace, editor } = await setup();
    await workspace.openFile("pages/about.html");
    answers.input = "sobre.html";
    await workspace.rename("pages/about.html");
    expect(await exists(fs, "pages/about.html")).toBe(false);
    expect(await readTextFile(fs, "pages/sobre.html")).toBe("<h1>about</h1>");
    expect(editor.tabs.map((t) => t.id)).toEqual(["pages/sobre.html"]);
    expect(editor.activeId).toBe("pages/sobre.html");
  });

  it("renames a folder, moving the tabs and the open state under it", async () => {
    const { workspace, editor } = await setup();
    await workspace.openFile("pages/deep/team.html");
    workspace.expanded.add("pages");
    workspace.expanded.add("pages/deep");
    answers.input = "paginas";
    await workspace.rename("pages");
    expect(editor.tabs.map((t) => t.id)).toEqual(["paginas/deep/team.html"]);
    expect([...workspace.expanded].sort()).toEqual(["paginas", "paginas/deep"]);
  });

  it("refuses while a file under it has unsaved changes", async () => {
    const { fs, workspace, editor } = await setup();
    await workspace.openFile("index.html");
    editor.tabs[0]!.content = "changed";
    answers.input = "inicio.html";
    await workspace.rename("index.html");
    expect(await exists(fs, "index.html")).toBe(true);
    expect(await exists(fs, "inicio.html")).toBe(false);
  });

  it("does not take a name that exists, or one with a slash", async () => {
    const { fs, workspace } = await setup();
    answers.input = "pages";
    await workspace.rename("index.html");
    answers.input = "a/b.html";
    await workspace.rename("index.html");
    expect(await exists(fs, "index.html")).toBe(true);
  });
});

describe("remove", () => {
  it("deletes only after the user confirms", async () => {
    const { fs, workspace } = await setup();
    await workspace.remove("index.html");
    expect(await exists(fs, "index.html")).toBe(true);
    answers.button = "Excluir";
    await workspace.remove("index.html");
    expect(await exists(fs, "index.html")).toBe(false);
  });

  it("deletes a folder with its files, and closes their tabs", async () => {
    const { fs, workspace, editor } = await setup();
    await workspace.openFile("pages/about.html");
    await workspace.openFile("pages/deep/team.html");
    await workspace.openFile("index.html");
    workspace.expanded.add("pages");
    answers.button = "Excluir";
    await workspace.remove("pages", "directory");
    expect(await exists(fs, "pages")).toBe(false);
    expect(editor.tabs.map((t) => t.id)).toEqual(["index.html"]);
    expect(workspace.expanded.size).toBe(0);
  });
});

describe("save", () => {
  it("writes a tab back to the file system", async () => {
    const { fs, workspace, editor } = await setup();
    await workspace.openFile("index.html");
    editor.tabs[0]!.content = "<h1>new</h1>";
    await editor.save();
    expect(await readTextFile(fs, "index.html")).toBe("<h1>new</h1>");
    expect(editor.isDirty(editor.tabs[0]!)).toBe(false);
  });

  it("leaves a tab that did not come from the file system alone", async () => {
    const { fs, editor } = await setup();
    useWorkspaceStore();
    editor.open("loose.html", "x");
    editor.tabs[0]!.content = "y";
    await editor.save();
    expect(await exists(fs, "loose.html")).toBe(false);
    expect(editor.isDirty(editor.tabs[0]!)).toBe(false);
  });
});

describe("new html files", () => {
  it("start with the basic structure, titled after the file", async () => {
    const { fs, workspace } = await setup();
    answers.input = "pages/Sobre nós.html";
    await workspace.createFile();
    const content = await readTextFile(fs, "pages/Sobre nós.html");
    expect(content).toMatch(/^<!doctype html>/);
    expect(content).toContain("<title>Sobre nós</title>");
    expect(content).toContain("<body>");
  });

  it("escapes the title, and leaves other files empty", async () => {
    const { fs, workspace } = await setup();
    answers.input = "a<b>.html";
    await workspace.createFile();
    expect(await readTextFile(fs, "a<b>.html")).toContain("<title>a&lt;b&gt;</title>");
    answers.input = "notes.txt";
    await workspace.createFile();
    expect(await readTextFile(fs, "notes.txt")).toBe("");
  });
});
