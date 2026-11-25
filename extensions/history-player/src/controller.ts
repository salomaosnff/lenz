import { ref, shallowRef } from "vue";
import type { HistoryApi } from "lenz-sdk";
import { Recorder } from "./recorder";
import { fileNameOf, parseFile, toFile, type RecordingMeta, type SavedFrame } from "./recording";
import type { RecordingStore } from "./storage";

/** The part of the history API that recording needs. */
export type HistorySource = Pick<HistoryApi, "list" | "onDidOpen" | "onDidChange">;

export interface ControllerOptions {
  /** Wait (ms) after a frame before the recording in progress is saved again. */
  autosaveDelay?: number;
  now?: () => number;
  /** Names a new recording. */
  nameFor?: (startedAt: number) => string;
}

const defaultName = (startedAt: number) =>
  `Gravação ${new Date(startedAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })}`;

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

/** The one being recorded: its list entry and the frames so far. */
export interface ActiveRecording {
  meta: RecordingMeta;
  recorder: Recorder;
}

/**
 * Starts and stops recordings, keeps them in a store, and hands them back to be played, downloaded
 * or deleted. The recording in progress is saved as it grows, so a reload does not lose it.
 */
export class Controller {
  /** Every saved recording, newest first. Reactive. */
  readonly recordings = ref<RecordingMeta[]>([]);
  /** The recording in progress, or `null`. Reactive. */
  readonly active = shallowRef<ActiveRecording | null>(null);
  private listening: { dispose(): void }[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;
  private pendingSave: Promise<void> = Promise.resolve();
  private readonly autosaveDelay: number;
  private readonly now: () => number;
  private readonly nameFor: (startedAt: number) => string;

  constructor(
    private readonly store: RecordingStore,
    private readonly history: HistorySource,
    options: ControllerOptions = {},
  ) {
    this.autosaveDelay = options.autosaveDelay ?? 1500;
    this.now = options.now ?? Date.now;
    this.nameFor = options.nameFor ?? defaultName;
  }

  /** Reads the list. A recording that was still going when the page closed is closed now. */
  async init() {
    const metas = await this.store.list();
    for (const meta of metas) {
      if (meta.endedAt !== undefined) continue;
      const frames = (await this.store.load(meta.id)) ?? [];
      meta.endedAt = frames.at(-1)?.time ?? meta.startedAt;
      meta.frameCount = frames.length;
      await this.store.save(meta, frames);
    }
    this.recordings.value = this.sorted(metas);
  }

  private sorted(metas: RecordingMeta[]) {
    return [...metas].sort((a, b) => b.startedAt - a.startedAt);
  }

  private async refresh() {
    this.recordings.value = this.sorted(await this.store.list());
  }

  /** Starts a recording: the files that are open now are its first frames. */
  start(): ActiveRecording {
    if (this.active.value) return this.active.value;
    const startedAt = this.now();
    const recorder = new Recorder({ now: this.now, limit: 50_000 });
    const meta: RecordingMeta = {
      id: newId(),
      name: this.nameFor(startedAt),
      startedAt,
      frameCount: 0,
      files: [],
    };
    const capture = (frame: Parameters<Recorder["add"]>[0]) => {
      recorder.add(frame);
      this.scheduleSave();
    };
    for (const file of this.history.list()) {
      recorder.add({
        path: file.path,
        kind: "open",
        label: "Aberto",
        content: file.current.content,
      });
    }
    this.listening = [
      // A file opened (or created) while recording begins its own record.
      this.history.onDidOpen((file) =>
        capture({ path: file.path, kind: "open", label: "Aberto", content: file.current.content }),
      ),
      // Only what writes to a file: an edit, an undo, a redo, a jump. Clearing the history leaves
      // the file as it is, and closing a file does not write to it, so neither is recorded.
      this.history.onDidChange((change) => {
        if (change.kind === "clear") return;
        capture({
          path: change.path,
          kind: change.kind,
          label: change.entry.label,
          content: change.entry.content,
        });
      }),
    ];
    this.active.value = { meta, recorder };
    this.scheduleSave(0); // appears in the list at once
    return this.active.value;
  }

  /** Stops the recording in progress and saves it. Returns it, or `null` if none was going. */
  async stop(): Promise<RecordingMeta | null> {
    const active = this.active.value;
    if (!active) return null;
    this.listening.forEach((d) => d.dispose());
    this.listening = [];
    clearTimeout(this.timer);
    this.active.value = null;
    active.meta.endedAt = this.now();
    await this.write(active);
    await this.refresh();
    return active.meta;
  }

  private scheduleSave(delay = this.autosaveDelay) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      const active = this.active.value;
      if (active) void this.write(active).then(() => this.refresh());
    }, delay);
  }

  /** Writes the recording; one write at a time, so a late one cannot overwrite a newer one. */
  private write(active: ActiveRecording): Promise<void> {
    const frames = active.recorder.frames.value;
    active.meta.frameCount = frames.length;
    active.meta.files = active.recorder.paths();
    const saved: SavedFrame[] = frames.map(({ time, path, kind, label, content }) => ({
      time,
      path,
      kind,
      label,
      content,
    }));
    const meta = { ...active.meta, files: [...active.meta.files] };
    this.pendingSave = this.pendingSave
      .then(() => this.store.save(meta, saved))
      .catch((error) => {
        console.error("[lenz] the recording could not be saved", error);
      });
    return this.pendingSave;
  }

  /** The recorder of a recording, to be played. The one in progress is played live. */
  async open(id: string): Promise<{ meta: RecordingMeta; recorder: Recorder } | undefined> {
    const active = this.active.value;
    if (active?.meta.id === id) return active;
    const meta = this.recordings.value.find((m) => m.id === id);
    const frames = meta && (await this.store.load(id));
    return meta && frames ? { meta, recorder: Recorder.from(frames) } : undefined;
  }

  /** Gives a saved recording another name. The one in progress is renamed when it is stopped. */
  async rename(id: string, name: string) {
    const active = this.active.value;
    if (active?.meta.id === id) {
      active.meta.name = name;
      return;
    }
    const meta = this.recordings.value.find((m) => m.id === id);
    const frames = meta && (await this.store.load(id));
    if (!meta || !frames) return;
    await this.store.save({ ...meta, name }, frames);
    await this.refresh();
  }

  async remove(id: string) {
    if (this.active.value?.meta.id === id) return; // stop it first
    await this.store.remove(id);
    await this.refresh();
  }

  /** The text of the file to download, and the name to give it. */
  async exportFile(id: string): Promise<{ name: string; text: string } | undefined> {
    const opened = await this.open(id);
    if (!opened) return undefined;
    const frames = opened.recorder.frames.value;
    return {
      name: fileNameOf(opened.meta.name),
      text: JSON.stringify(toFile(opened.meta, frames)),
    };
  }

  /** Adds the recording of a downloaded file. Throws `InvalidRecordingError` if it is not one. */
  async importFile(text: string): Promise<RecordingMeta> {
    const file = parseFile(text);
    const recorder = Recorder.from(file.frames);
    const meta: RecordingMeta = {
      id: newId(),
      name: file.name,
      startedAt: file.startedAt,
      endedAt: file.endedAt,
      frameCount: file.frames.length,
      files: recorder.paths(),
    };
    await this.store.save(meta, file.frames);
    await this.refresh();
    return meta;
  }
}
