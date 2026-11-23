import { describe, expect, it, vi } from "vite-plus/test";
import { FileHistory } from "./history";

/** A file in memory, and a history over it, with a clock the test moves. */
function setup(initial = "a", options = {}) {
  const file = { content: initial };
  const clock = { now: 1000 };
  const history = new FileHistory(
    "x.html",
    { read: () => file.content, write: (content) => (file.content = content) },
    { now: () => clock.now, ...options },
  );
  /** What an editor does: changes the file, then tells the history. */
  const edit = (content: string, label?: string, merge?: boolean) => {
    file.content = content;
    history.record(content, { label, merge });
  };
  return { file, history, edit, clock };
}

describe("recording", () => {
  it("starts with the file as it was opened", () => {
    const { history } = setup("a");
    expect(history.entries.map((e) => [e.label, e.content])).toEqual([["Aberto", "a"]]);
    expect(history.index).toBe(0);
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
  });

  it("records each change as an entry, with its label", () => {
    const { history, edit, clock } = setup();
    edit("b", "Duplicar", false);
    clock.now += 5000;
    edit("c", "Excluir", false);
    expect(history.entries.map((e) => [e.label, e.content])).toEqual([
      ["Aberto", "a"],
      ["Duplicar", "b"],
      ["Excluir", "c"],
    ]);
    expect(history.index).toBe(2);
    expect(history.current.content).toBe("c");
  });

  it("ignores a change that leaves the content as it was", () => {
    const { history, edit } = setup();
    edit("a");
    expect(history.entries).toHaveLength(1);
  });

  it("joins quick edits of the same label into one entry", () => {
    const { history, edit, clock } = setup();
    edit("b", "Digitar");
    clock.now += 200;
    edit("bc", "Digitar");
    clock.now += 200;
    edit("bcd", "Digitar");
    expect(history.entries.map((e) => e.content)).toEqual(["a", "bcd"]);
  });

  it("does not join edits that are far apart, differently named, or not mergeable", () => {
    const { history, edit, clock } = setup();
    edit("b", "Digitar");
    clock.now += 5000;
    edit("bc", "Digitar");
    clock.now += 100;
    edit("bcd", "Outro");
    clock.now += 100;
    edit("bcde", "Outro", false);
    expect(history.entries.map((e) => e.content)).toEqual(["a", "b", "bc", "bcd", "bcde"]);
  });

  it("never changes the entry the file was opened with", () => {
    const { history, edit } = setup();
    edit("b", "Aberto"); // same label as the first entry, right away
    expect(history.entries.map((e) => e.content)).toEqual(["a", "b"]);
  });

  it("a checkpoint makes the next edit a new entry", () => {
    const { history, edit, clock } = setup();
    edit("b", "Digitar");
    clock.now += 100;
    history.checkpoint();
    edit("bc", "Digitar");
    expect(history.entries.map((e) => e.content)).toEqual(["a", "b", "bc"]);
  });

  it("keeps only the latest entries up to the limit", () => {
    const { history, edit } = setup("0", { limit: 3 });
    for (let i = 1; i <= 5; i++) edit(String(i), "x", false);
    expect(history.entries.map((e) => e.content)).toEqual(["3", "4", "5"]);
    expect(history.index).toBe(2);
  });
});

describe("undo and redo", () => {
  it("goes back and forth, writing the file", () => {
    const { history, file, edit } = setup();
    edit("b", "um", false);
    edit("c", "dois", false);
    expect(history.undo()).toBe(true);
    expect(file.content).toBe("b");
    expect(history.canUndo && history.canRedo).toBe(true);
    expect(history.undo()).toBe(true);
    expect(file.content).toBe("a");
    expect(history.undo()).toBe(false);
    expect(history.redo()).toBe(true);
    expect(history.redo()).toBe(true);
    expect(file.content).toBe("c");
    expect(history.redo()).toBe(false);
  });

  it("does not record its own writes as edits", () => {
    const { history, file, edit } = setup();
    edit("b", "um", false);
    history.undo();
    // The file owner reports every change of the file, including the one the history made.
    history.record(file.content);
    expect(history.entries).toHaveLength(2);
  });

  it("an edit after an undo drops what was undone", () => {
    const { history, edit } = setup();
    edit("b", "um", false);
    edit("c", "dois", false);
    history.undo();
    edit("x", "novo", false);
    expect(history.entries.map((e) => e.content)).toEqual(["a", "b", "x"]);
    expect(history.canRedo).toBe(false);
  });

  it("an edit right after an undo is a new entry, not a merge", () => {
    const { history, edit, clock } = setup();
    edit("b", "Digitar");
    history.undo();
    clock.now += 10;
    edit("z", "Digitar");
    expect(history.entries.map((e) => e.content)).toEqual(["a", "z"]);
  });

  it("goTo jumps to any entry", () => {
    const { history, file, edit } = setup();
    edit("b", "um", false);
    edit("c", "dois", false);
    edit("d", "três", false);
    expect(history.goTo(1)).toBe(true);
    expect(file.content).toBe("b");
    expect(history.index).toBe(1);
    expect(history.goTo(9)).toBe(false);
    expect(history.goTo(1)).toBe(false);
  });
});

describe("transactions", () => {
  it("groups many edits into one entry", () => {
    const { history, edit, file } = setup();
    history.transaction("Reorganizar", () => {
      edit("b", "um", false);
      edit("c", "dois", false);
      edit("d", "três", false);
    });
    expect(history.entries.map((e) => [e.label, e.content])).toEqual([
      ["Aberto", "a"],
      ["Reorganizar", "d"],
    ]);
    history.undo();
    expect(file.content).toBe("a");
  });

  it("records nothing when the content ends up as it began", () => {
    const { history, edit } = setup();
    history.transaction("Nada", () => {
      edit("b", "x", false);
      edit("a", "y", false);
    });
    expect(history.entries).toHaveLength(1);
  });

  it("a nested transaction that fails goes back to where it began, not to the last entry", () => {
    const { history, edit, file } = setup();
    history.transaction("Fora", () => {
      edit("b", "x", false);
      expect(() =>
        history.transaction("Dentro", () => {
          edit("c", "y", false);
          throw new Error("inner");
        }),
      ).toThrow("inner");
      expect(file.content).toBe("b"); // the outer edit stays
    });
    expect(history.entries.map((e) => e.content)).toEqual(["a", "b"]);
  });

  it("puts the file back when the function throws, and rethrows", () => {
    const { history, edit, file } = setup();
    expect(() =>
      history.transaction("Falha", () => {
        edit("b", "x", false);
        throw new Error("boom");
      }),
    ).toThrow("boom");
    expect(file.content).toBe("a");
    expect(history.entries).toHaveLength(1);
  });

  it("waits for a promise, and rolls back when it rejects", async () => {
    const { history, edit, file } = setup();
    const done = history.transaction("Async", async () => {
      edit("b", "x", false);
      await Promise.resolve();
      edit("c", "y", false);
      return 42;
    });
    expect(history.canUndo).toBe(false); // still open
    expect(await done).toBe(42);
    expect(history.entries.map((e) => e.content)).toEqual(["a", "c"]);

    await expect(
      history.transaction("Async falha", async () => {
        edit("z", "x", false);
        await Promise.resolve();
        throw new Error("nope");
      }),
    ).rejects.toThrow("nope");
    expect(file.content).toBe("c");
    expect(history.entries).toHaveLength(2);
  });

  it("manual begin, commit and rollback", () => {
    const { history, edit, file } = setup();
    const first = history.beginTransaction("Manual");
    edit("b", "x", false);
    first.commit();
    first.commit(); // closing twice does nothing
    expect(history.entries.map((e) => e.content)).toEqual(["a", "b"]);

    const second = history.beginTransaction("Desistir");
    edit("c", "x", false);
    second.rollback();
    expect(file.content).toBe("b");
    expect(history.entries).toHaveLength(2);
  });

  it("nested transactions: only the outermost records", () => {
    const { history, edit } = setup();
    history.transaction("Fora", () => {
      edit("b", "x", false);
      history.transaction("Dentro", () => edit("c", "y", false));
      edit("d", "z", false);
    });
    expect(history.entries.map((e) => [e.label, e.content])).toEqual([
      ["Aberto", "a"],
      ["Fora", "d"],
    ]);
  });

  it("undo and redo wait until the transaction ends", () => {
    const { history, edit } = setup();
    edit("b", "um", false);
    const open = history.beginTransaction("Aberta");
    expect(history.canUndo).toBe(false);
    expect(history.undo()).toBe(false);
    open.rollback();
    expect(history.canUndo).toBe(true);
  });
});

describe("events", () => {
  it("tells what happened, with the entry and its position", () => {
    const { history, edit, clock } = setup();
    const changes = vi.fn();
    const records = vi.fn();
    const undos = vi.fn();
    const redos = vi.fn();
    history.onDidChange(changes);
    history.onDidRecord(records);
    history.onDidUndo(undos);
    history.onDidRedo(redos);

    edit("b", "Digitar");
    clock.now += 100;
    edit("bc", "Digitar"); // a merge
    history.undo();
    history.redo();
    history.goTo(0);
    history.clear();

    expect(changes.mock.calls.map(([c]) => c.kind)).toEqual([
      "record",
      "merge",
      "undo",
      "redo",
      "goto",
      "clear",
    ]);
    expect(records).toHaveBeenCalledTimes(1); // not for the merge
    expect(undos).toHaveBeenCalledTimes(1);
    expect(redos).toHaveBeenCalledTimes(1);
    expect(changes.mock.calls[0]![0]).toMatchObject({ kind: "record", path: "x.html", index: 1 });
    expect(changes.mock.calls[0]![0].entry.content).toBe("b");
  });

  it("a listener can stop listening, and one that throws does not stop the others", () => {
    const { history, edit } = setup();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const calls: string[] = [];
    history.onDidChange(() => {
      throw new Error("bad listener");
    });
    const stop = history.onDidChange(() => calls.push("a"));
    history.onDidChange(() => calls.push("b"));
    edit("b", "x", false);
    stop.dispose();
    edit("c", "y", false);
    expect(calls).toEqual(["a", "b", "b"]);
    error.mockRestore();
  });

  it("clear keeps the file as it is, as the only entry", () => {
    const { history, edit } = setup();
    edit("b", "um", false);
    history.clear();
    expect(history.entries.map((e) => [e.label, e.content])).toEqual([["Aberto", "b"]]);
    expect(history.canUndo).toBe(false);
  });
});
