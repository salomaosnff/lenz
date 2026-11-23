import { shallowRef } from "vue";
import type {
  DocumentHistory,
  Event,
  HistoryChange,
  HistoryChangeKind,
  HistoryEntry,
  HistoryTransaction,
  SetContentOptions,
} from "lenz-sdk";
import type { EditorTab } from "./store";

class Emitter<T> {
  private listeners = new Set<(value: T) => void>();
  readonly event: Event<T> = (listener) => {
    this.listeners.add(listener);
    return { dispose: () => void this.listeners.delete(listener) };
  };
  fire(value: T) {
    // A copy: a listener may unsubscribe while the others are still being called.
    for (const listener of [...this.listeners]) {
      try {
        listener(value);
      } catch (error) {
        console.error("[lenz] a history listener failed", error);
      }
    }
  }
}

/** Where the content of the file lives: the history reads it and, on undo or redo, writes it. */
export interface HistoryFile {
  read(): string;
  write(content: string): void;
}

export interface FileHistoryOptions {
  /** Most entries kept; the oldest go first. */
  limit?: number;
  /** Edits of the same label closer than this (ms) join one entry. */
  mergeWindow?: number;
  now?: () => number;
}

const DEFAULT_LABEL = "Edição";

/** Fires for the history of every file; what `HistoryApi.onDidChange` is. */
const anyChange = new Emitter<HistoryChange>();
export const onDidChangeAnyHistory = anyChange.event;

const opened = new Emitter<DocumentHistory>();
const closed = new Emitter<string>();
/** Fires when a file gets its history, which is when it is opened. */
export const onDidOpenHistory = opened.event;
/** Fires, with the path, when the history of a closed file is dropped. */
export const onDidCloseHistory = closed.event;

/**
 * The history of one file. The file keeps its content somewhere else (`HistoryFile`); this
 * only remembers the states and moves between them.
 */
export class FileHistory implements DocumentHistory {
  // Replaced, never mutated, so Vue sees every change.
  private list = shallowRef<HistoryEntry[]>([]);
  private at = shallowRef(0);
  private nextId = 0;
  private mergeNext = true;
  private lastTime = 0;
  /** Set while the history itself writes to the file, so that write is not recorded again. */
  private applying = false;
  private open: { label: string; start: string; done: boolean }[] = [];
  private readonly limit: number;
  private readonly mergeWindow: number;
  private readonly now: () => number;

  private readonly changes = new Emitter<HistoryChange>();
  private readonly records = new Emitter<HistoryChange>();
  private readonly undos = new Emitter<HistoryChange>();
  private readonly redos = new Emitter<HistoryChange>();
  readonly onDidChange = this.changes.event;
  readonly onDidRecord = this.records.event;
  readonly onDidUndo = this.undos.event;
  readonly onDidRedo = this.redos.event;

  constructor(
    readonly path: string,
    private readonly file: HistoryFile,
    options: FileHistoryOptions = {},
  ) {
    this.limit = options.limit ?? 200;
    this.mergeWindow = options.mergeWindow ?? 1000;
    this.now = options.now ?? Date.now;
    this.list.value = [this.entry("Aberto", file.read())];
  }

  get entries() {
    return this.list.value;
  }
  get index() {
    return this.at.value;
  }
  get current() {
    return this.list.value[this.at.value]!;
  }
  get canUndo() {
    return this.open.length === 0 && this.at.value > 0;
  }
  get canRedo() {
    return this.open.length === 0 && this.at.value < this.list.value.length - 1;
  }

  private entry(label: string, content: string): HistoryEntry {
    return { id: this.nextId++, label, timestamp: this.now(), content };
  }

  private fire(kind: HistoryChangeKind) {
    const change: HistoryChange = { kind, path: this.path, entry: this.current, index: this.index };
    this.changes.fire(change);
    anyChange.fire(change);
    if (kind === "record") this.records.fire(change);
    else if (kind === "undo") this.undos.fire(change);
    else if (kind === "redo") this.redos.fire(change);
  }

  /** The file changed to `content`: remember it. Called by the document, not by extensions. */
  record(content: string, options: SetContentOptions = {}) {
    if (this.applying) return;
    // Inside a transaction nothing is recorded: the whole group is one entry, at the end.
    if (this.open.length) return;
    this.push(content, options.label ?? DEFAULT_LABEL, options.merge !== false);
  }

  private push(content: string, label: string, mergeable: boolean) {
    if (content === this.current.content) return;
    const now = this.now();
    const last = this.list.value.length - 1;
    const canMerge =
      mergeable &&
      this.mergeNext &&
      this.at.value === last &&
      last > 0 && // the entry the file was opened with is never changed
      this.current.label === label &&
      now - this.lastTime < this.mergeWindow;
    this.lastTime = now;
    this.mergeNext = true;

    if (canMerge) {
      const merged: HistoryEntry = { ...this.current, content, timestamp: now };
      this.list.value = [...this.list.value.slice(0, last), merged];
      return this.fire("merge");
    }

    // Editing after an undo drops what was undone.
    let list = [...this.list.value.slice(0, this.at.value + 1), this.entry(label, content)];
    if (list.length > this.limit) list = list.slice(list.length - this.limit);
    this.list.value = list;
    this.at.value = list.length - 1;
    this.fire("record");
  }

  private move(index: number, kind: HistoryChangeKind): boolean {
    if (this.open.length || index < 0 || index >= this.list.value.length) return false;
    if (index === this.at.value) return false;
    this.at.value = index;
    this.mergeNext = false;
    this.applying = true;
    try {
      this.file.write(this.current.content);
    } finally {
      this.applying = false;
    }
    this.fire(kind);
    return true;
  }

  undo() {
    return this.move(this.at.value - 1, "undo");
  }
  redo() {
    return this.move(this.at.value + 1, "redo");
  }
  goTo(index: number) {
    return this.move(index, "goto");
  }

  checkpoint() {
    this.mergeNext = false;
  }

  clear() {
    this.open = [];
    this.list.value = [this.entry("Aberto", this.current.content)];
    this.at.value = 0;
    this.mergeNext = true;
    this.fire("clear");
  }

  beginTransaction(label: string): HistoryTransaction {
    // The file as it is now, which inside another transaction is ahead of the last entry.
    const frame = { label, start: this.file.read(), done: false };
    this.open.push(frame);
    const close = (restore: boolean) => {
      if (frame.done) return;
      frame.done = true;
      // Closing an outer one closes the ones still open inside it.
      const position = this.open.indexOf(frame);
      this.open.splice(position);
      if (restore) this.writeFile(frame.start);
      else if (!this.open.length) this.push(this.file.read(), frame.label, false);
    };
    return { commit: () => close(false), rollback: () => close(true) };
  }

  transaction<T>(label: string, fn: () => T): T {
    const transaction = this.beginTransaction(label);
    let result: T;
    try {
      result = fn();
    } catch (error) {
      transaction.rollback();
      throw error;
    }
    if (result && typeof (result as { then?: unknown }).then === "function") {
      return (result as unknown as Promise<unknown>).then(
        (value) => (transaction.commit(), value),
        (error) => {
          transaction.rollback();
          throw error;
        },
      ) as T;
    }
    transaction.commit();
    return result;
  }

  private writeFile(content: string) {
    this.applying = true;
    try {
      this.file.write(content);
    } finally {
      this.applying = false;
    }
  }
}

// ---- One history per open file -------------------------------------------------------------

const histories = new Map<string, FileHistory>();

/** The history of an open tab; created, from the tab's content as it is now, on first use. */
export function historyOf(tab: EditorTab): FileHistory {
  let history = histories.get(tab.id);
  if (!history) {
    history = new FileHistory(tab.id, {
      read: () => tab.content,
      write: (content) => (tab.content = content),
    });
    histories.set(tab.id, history);
    opened.fire(history);
  }
  return history;
}

/** The history of a file, if it has one. */
export const existingHistory = (path: string) => histories.get(path);

/** Drops the history of a file that was closed. */
export function forgetHistory(path: string) {
  if (histories.delete(path)) closed.fire(path);
}
