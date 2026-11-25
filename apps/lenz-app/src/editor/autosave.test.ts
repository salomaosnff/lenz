import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";

vi.mock("../prompts", () => ({ prompts: { showInputBox: vi.fn() } }));
vi.mock("../notifications", () => ({
  notifications: {
    showErrorMessage: vi.fn(async () => undefined),
    showWarningMessage: vi.fn(async () => undefined),
    showInformationMessage: vi.fn(async () => undefined),
  },
}));

import { HandleFileSystem } from "../fs/handle";
import { emptyDirectory } from "../fs/testing";
import { exists, readTextFile, writeTextFile } from "../fs/types";
import { useWorkspaceStore } from "../fs/workspace";
import { AUTOSAVE_DELAY, autosaveEnabled, installAutosave } from "./autosave";
import { useEditorStore } from "./store";

class MemoryFileSystem extends HandleFileSystem {
  readonly kind = "memory";
}

let stop: { dispose(): void } | undefined;

async function setup() {
  setActivePinia(createPinia());
  const fs = new MemoryFileSystem(emptyDirectory());
  await writeTextFile(fs, "index.html", "one");
  const workspace = useWorkspaceStore();
  workspace.fs = fs;
  const editor = useEditorStore();
  stop = installAutosave();
  await workspace.openFile("index.html");
  /** What an editor does on a key: the content of the tab changes. */
  const type = async (content: string, id = "index.html") => {
    editor.tabs.find((t) => t.id === id)!.content = content;
    await nextTick();
  };
  /** Lets the time pass, and the writes finish. */
  const wait = async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms);
  };
  return { fs, editor, workspace, type, wait };
}

beforeEach(() => {
  vi.useFakeTimers();
  autosaveEnabled.value = true;
});
afterEach(() => {
  stop?.dispose();
  stop = undefined;
  vi.useRealTimers();
});

describe("autosave", () => {
  it("saves a file a moment after its last change, not before", async () => {
    const { fs, editor, type, wait } = await setup();
    await type("two");
    await wait(AUTOSAVE_DELAY - 1);
    expect(await readTextFile(fs, "index.html")).toBe("one");
    expect(editor.isDirty(editor.tabs[0]!)).toBe(true);
    await wait(1);
    expect(await readTextFile(fs, "index.html")).toBe("two");
    expect(editor.isDirty(editor.tabs[0]!)).toBe(false);
  });

  it("waits again while the user keeps changing it", async () => {
    const { fs, type, wait } = await setup();
    await type("a");
    await wait(600);
    await type("ab");
    await wait(600);
    expect(await readTextFile(fs, "index.html")).toBe("one"); // 1200 ms since the first change
    await type("abc");
    await wait(AUTOSAVE_DELAY);
    expect(await readTextFile(fs, "index.html")).toBe("abc");
  });

  it("keeps what was typed while it was being written, for the next save", async () => {
    const { fs, editor, type, wait } = await setup();
    await type("first");
    await wait(AUTOSAVE_DELAY);
    await type("first and more");
    expect(editor.isDirty(editor.tabs[0]!)).toBe(true);
    await wait(AUTOSAVE_DELAY);
    expect(await readTextFile(fs, "index.html")).toBe("first and more");
  });

  it("does nothing while it is turned off, and catches up when it is turned on", async () => {
    const { fs, type, wait } = await setup();
    autosaveEnabled.value = false;
    await type("two");
    await wait(AUTOSAVE_DELAY * 3);
    expect(await readTextFile(fs, "index.html")).toBe("one");
    autosaveEnabled.value = true;
    await nextTick();
    await wait(AUTOSAVE_DELAY);
    expect(await readTextFile(fs, "index.html")).toBe("two");
  });

  it("leaves alone a file that is not from the project", async () => {
    const { fs, editor, wait } = await setup();
    editor.open("loose.html", "x");
    editor.tabs.find((t) => t.id === "loose.html")!.content = "y";
    await nextTick();
    await wait(AUTOSAVE_DELAY * 2);
    expect(await exists(fs, "loose.html")).toBe(false);
    expect(editor.isDirty(editor.tabs.find((t) => t.id === "loose.html")!)).toBe(true);
  });

  it("saves at once when the window loses the user's attention", async () => {
    const { fs, type, wait } = await setup();
    const listeners = new Map<string, () => void>();
    const target = {
      addEventListener: (type: string, fn: () => void) => listeners.set(type, fn),
      removeEventListener: () => {},
    };
    vi.stubGlobal("window", target);
    vi.stubGlobal("document", { ...target, visibilityState: "visible" });
    stop?.dispose();
    stop = installAutosave();
    await type("two");
    listeners.get("blur")!();
    await wait(0);
    expect(await readTextFile(fs, "index.html")).toBe("two");
    // Stopped while the stand-in page is still there, as it listened to it.
    stop?.dispose();
    stop = undefined;
    vi.unstubAllGlobals();
  });

  it("gives up after a failed write, and tries again with the next change", async () => {
    const { fs, editor, type, wait } = await setup();
    const write = vi.spyOn(fs, "writeFile").mockRejectedValueOnce(new Error("disk full"));
    await type("two");
    await wait(AUTOSAVE_DELAY * 5);
    expect(write).toHaveBeenCalledTimes(1); // not in a loop
    expect(editor.isDirty(editor.tabs[0]!)).toBe(true);
    await type("three");
    await wait(AUTOSAVE_DELAY);
    expect(await readTextFile(fs, "index.html")).toBe("three");
  });

  it("forgets a file that was closed before its turn", async () => {
    const { fs, editor, type, wait } = await setup();
    await type("two");
    editor.close("index.html");
    await wait(AUTOSAVE_DELAY * 2);
    expect(await readTextFile(fs, "index.html")).toBe("one");
  });
});
