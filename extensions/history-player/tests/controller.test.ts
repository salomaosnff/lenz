import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import type { DocumentHistory, HistoryChange } from "lenz-sdk";
import { Controller, type HistorySource } from "../src/controller";
import { InvalidRecordingError } from "../src/recording";
import { MemoryStore } from "../src/storage";

/** A history of files the test controls: what the host would tell the extension. */
function fakeHistory(initial: Record<string, string> = {}) {
  const open = new Map(Object.entries(initial));
  const listeners = {
    open: new Set<(h: DocumentHistory) => void>(),
    change: new Set<(c: HistoryChange) => void>(),
    close: new Set<(p: string) => void>(),
  };
  const on =
    <T>(set: Set<(v: T) => void>) =>
    (fn: (v: T) => void) => {
      set.add(fn);
      return { dispose: () => void set.delete(fn) };
    };
  const asHistory = (path: string): DocumentHistory =>
    ({
      path,
      current: { id: 0, label: "x", timestamp: 0, content: open.get(path)! },
    }) as DocumentHistory;
  const source: HistorySource = {
    list: () => [...open.keys()].map(asHistory),
    onDidOpen: on(listeners.open),
    onDidChange: on(listeners.change),
    onDidClose: on(listeners.close),
  };
  return {
    source,
    listeners,
    openFile(path: string, content: string) {
      open.set(path, content);
      listeners.open.forEach((l) => l(asHistory(path)));
    },
    edit(path: string, content: string, label = "Editar", kind: HistoryChange["kind"] = "record") {
      open.set(path, content);
      const entry = { id: 1, label, timestamp: 0, content };
      listeners.change.forEach((l) => l({ kind, path, entry, index: 1 }));
    },
    closeFile(path: string) {
      open.delete(path);
      listeners.close.forEach((l) => l(path));
    },
  };
}

let clock = 0;
const setup = (
  files: Record<string, string> = { "a.html": "<p>1</p>" },
  store = new MemoryStore(),
) => {
  const history = fakeHistory(files);
  const controller = new Controller(store, history.source, {
    now: () => clock,
    autosaveDelay: 100,
    nameFor: (t) => `Gravação ${t}`,
  });
  return { controller, history, store };
};

beforeEach(() => {
  clock = 1000;
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe("recording", () => {
  test("starts from the files that are open, and follows every change", async () => {
    const { controller, history } = setup({ "a.html": "one", "b.html": "bee" });
    const { recorder } = controller.start();
    clock = 2000;
    history.edit("a.html", "two", "Editar");
    clock = 3000;
    history.openFile("c.html", "new"); // created while recording
    history.edit("a.html", "three", "Desfazer", "undo");
    history.closeFile("b.html");
    expect(recorder.frames.value.map((f) => [f.path, f.kind, f.content])).toEqual([
      ["a.html", "open", "one"],
      ["b.html", "open", "bee"],
      ["a.html", "record", "two"],
      ["c.html", "open", "new"],
      ["a.html", "undo", "three"],
      ["b.html", "close", "bee"], // a closed file keeps its last content
    ]);
  });

  test("nothing is recorded before it starts, or after it stops", async () => {
    const { controller, history } = setup();
    history.edit("a.html", "before");
    const { recorder } = controller.start();
    await controller.stop();
    history.edit("a.html", "after");
    // The first frame is the file as it was when recording began; the edit after the stop is not there.
    expect(recorder.frames.value.map((f) => f.content)).toEqual(["before"]);
  });

  test("starting twice keeps the same recording", () => {
    const { controller } = setup();
    expect(controller.start()).toBe(controller.start());
  });

  test("stopping saves it, names it and closes it", async () => {
    const { controller, history, store } = setup();
    controller.start();
    clock = 5000;
    history.edit("a.html", "two");
    clock = 9000;
    const meta = await controller.stop();
    expect(controller.active.value).toBeNull();
    expect(meta).toMatchObject({
      name: "Gravação 1000",
      startedAt: 1000,
      endedAt: 9000,
      frameCount: 2,
      files: ["a.html"],
    });
    expect(controller.recordings.value).toHaveLength(1);
    expect((await store.load(meta!.id))!.map((f) => f.content)).toEqual(["<p>1</p>", "two"]);
    expect(await controller.stop()).toBeNull();
  });

  test("is saved while it runs, shortly after the last change", async () => {
    const { controller, history, store } = setup();
    const { meta } = controller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(await store.list()).toHaveLength(1); // in the list at once
    history.edit("a.html", "two");
    history.edit("a.html", "three");
    await vi.advanceTimersByTimeAsync(50);
    expect((await store.load(meta.id))!.length).toBe(1); // not yet
    await vi.advanceTimersByTimeAsync(100);
    expect((await store.load(meta.id))!.map((f) => f.content)).toEqual([
      "<p>1</p>",
      "two",
      "three",
    ]);
    expect((await store.list())[0]!.endedAt).toBeUndefined(); // still going
  });

  test("a recording that was still going when the page closed is closed on the next start", async () => {
    const store = new MemoryStore();
    const first = setup({ "a.html": "one" }, store);
    first.controller.start();
    first.history.edit("a.html", "two");
    clock = 4000;
    first.history.edit("a.html", "three");
    await vi.advanceTimersByTimeAsync(200); // saved, never stopped: the page went away
    const second = setup({}, store);
    await second.controller.init();
    expect(second.controller.recordings.value[0]).toMatchObject({ endedAt: 4000, frameCount: 3 });
  });
});

describe("the saved recordings", () => {
  async function twoRecordings() {
    const ctx = setup();
    ctx.controller.start();
    ctx.history.edit("a.html", "x");
    await ctx.controller.stop();
    clock = 20_000;
    ctx.controller.start();
    await ctx.controller.stop();
    return ctx;
  }

  test("are listed newest first", async () => {
    const { controller } = await twoRecordings();
    expect(controller.recordings.value.map((m) => m.startedAt)).toEqual([20_000, 1000]);
  });

  test("rename keeps the frames and changes only the name", async () => {
    const { controller } = await twoRecordings();
    const old = controller.recordings.value[1]!;
    await controller.rename(old.id, "Minha gravação");
    expect(controller.recordings.value.find((m) => m.id === old.id)?.name).toBe("Minha gravação");
    expect((await controller.open(old.id))?.recorder.frames.value.length).toBeGreaterThan(0);
  });

  test("open gives the frames, with the times they had", async () => {
    const { controller } = await twoRecordings();
    const old = controller.recordings.value[1]!;
    const opened = await controller.open(old.id);
    expect(opened!.recorder.frames.value.map((f) => [f.time, f.content])).toEqual([
      [1000, "<p>1</p>"],
      [1000, "x"],
    ]);
    expect(await controller.open("nope")).toBeUndefined();
  });

  test("the one in progress is opened live", async () => {
    const { controller, history } = setup();
    const active = controller.start();
    const opened = await controller.open(active.meta.id);
    history.edit("a.html", "two");
    expect(opened!.recorder).toBe(active.recorder);
    expect(opened!.recorder.frames.value).toHaveLength(2);
  });

  test("are deleted, except the one in progress", async () => {
    const { controller } = await twoRecordings();
    const [newest, oldest] = controller.recordings.value;
    await controller.remove(oldest!.id);
    expect(controller.recordings.value.map((m) => m.id)).toEqual([newest!.id]);
    const active = controller.start();
    await controller.remove(active.meta.id);
    expect(controller.active.value).not.toBeNull();
  });

  test("are kept between sessions", async () => {
    const { controller, store } = await twoRecordings();
    const next = setup({}, store);
    await next.controller.init();
    expect(next.controller.recordings.value.map((m) => m.id)).toEqual(
      controller.recordings.value.map((m) => m.id),
    );
  });
});

describe("file", () => {
  test("a downloaded recording can be loaded again, as a new one", async () => {
    const { controller, history } = setup();
    controller.start();
    clock = 4000;
    history.edit("a.html", "two", "Duplicar");
    const original = (await controller.stop())!;
    const file = await controller.exportFile(original.id);
    expect(file!.name).toBe("gravacao-1000.lenzrec.json");

    const loaded = await controller.importFile(file!.text);
    expect(loaded.id).not.toBe(original.id);
    expect(loaded).toMatchObject({ name: original.name, frameCount: 2, files: ["a.html"] });
    expect(controller.recordings.value).toHaveLength(2);
    const frames = (await controller.open(loaded.id))!.recorder.frames.value;
    expect(frames.map((f) => [f.time, f.label, f.content])).toEqual([
      [1000, "Aberto", "<p>1</p>"],
      [4000, "Duplicar", "two"],
    ]);
  });

  test("a file that is not a recording is refused and nothing is added", async () => {
    const { controller } = setup();
    await expect(controller.importFile('{"format":"x"}')).rejects.toBeInstanceOf(
      InvalidRecordingError,
    );
    await expect(controller.importFile("not json")).rejects.toThrow(/JSON/);
    expect(controller.recordings.value).toHaveLength(0);
  });

  test("exporting what does not exist gives nothing", async () => {
    expect(await setup().controller.exportFile("nope")).toBeUndefined();
  });
});
