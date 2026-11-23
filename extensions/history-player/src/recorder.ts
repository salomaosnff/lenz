import { shallowRef, triggerRef } from "vue";

/** What happened to a file. `open` is a file that was opened or created, `close` one that was closed. */
export type FrameKind = "open" | "close" | "record" | "merge" | "undo" | "redo" | "goto" | "clear";

/** One moment of the recording: a file, as it was right after something happened to it. */
export interface Frame {
  readonly id: number;
  /** `Date.now()` when it happened. */
  readonly time: number;
  readonly path: string;
  readonly kind: FrameKind;
  /** What was done, e.g. `Duplicar elemento`. */
  readonly label: string;
  /** The whole file at that moment. */
  readonly content: string;
}

export interface RecorderOptions {
  /** Most frames kept; the oldest go first. */
  limit?: number;
  now?: () => number;
}

/**
 * The recording: every change to every file, in the order they happened, including the files that
 * were opened or created and the ones that were closed. It is kept in memory.
 */
export class Recorder {
  /** Reactive: replaced in place and triggered, so a long recording is not copied on every key. */
  readonly frames = shallowRef<Frame[]>([]);
  private nextId = 0;
  private readonly limit: number;
  private readonly now: () => number;
  private readonly last = new Map<string, string>();

  constructor(options: RecorderOptions = {}) {
    this.limit = options.limit ?? 3000;
    this.now = options.now ?? Date.now;
  }

  /** A recorder holding frames that were saved, with the times they had. */
  static from(frames: readonly Omit<Frame, "id">[], options: RecorderOptions = {}): Recorder {
    const recorder = new Recorder({
      ...options,
      limit: Math.max(options.limit ?? 0, frames.length),
    });
    frames.forEach((frame, id) => {
      recorder.frames.value.push({ ...frame, id });
      recorder.last.set(frame.path, frame.content);
    });
    recorder.nextId = frames.length;
    return recorder;
  }

  /** Adds a frame at the end. A `close` takes the content the file had last, if none is given. */
  add(frame: { path: string; kind: FrameKind; label: string; content?: string }): Frame {
    const content = frame.content ?? this.last.get(frame.path) ?? "";
    const added: Frame = { id: this.nextId++, time: this.now(), ...frame, content };
    this.last.set(frame.path, content);
    const list = this.frames.value;
    list.push(added);
    if (list.length > this.limit) list.splice(0, list.length - this.limit);
    triggerRef(this.frames);
    return added;
  }

  clear() {
    this.frames.value.length = 0;
    this.last.clear();
    triggerRef(this.frames);
  }

  /** Paths that have a frame, in the order they first appeared. */
  paths(): string[] {
    return [...new Set(this.frames.value.map((f) => f.path))];
  }
}

/** The file `path` as it was at frame `index`: its last frame up to there, or `null` if it had none yet. */
export function frameOf(frames: readonly Frame[], index: number, path: string): Frame | null {
  for (let i = Math.min(index, frames.length - 1); i >= 0; i--) {
    if (frames[i]!.path === path) return frames[i]!;
  }
  return null;
}
