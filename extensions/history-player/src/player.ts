import { computed, ref, shallowRef } from "vue";
import { Recorder, frameOf, type Frame } from "./recorder";

export const SPEEDS = [0.25, 0.5, 1, 2, 4, 8] as const;

/** The pauses of the recording are shortened so a long silence is not a long wait. */
export const MIN_GAP = 120;
export const MAX_GAP = 1500;

/** How long to show frame `from` before going to the next one, at a speed. */
export function delayBetween(frames: readonly Frame[], from: number, speed: number): number {
  const a = frames[from];
  const b = frames[from + 1];
  if (!a || !b) return 0;
  const real = Math.min(Math.max(b.time - a.time, MIN_GAP), MAX_GAP);
  return real / speed;
}

/** The recording played like a video. State is reactive; the controls work without a window. */
export class Player {
  /** Position in the recording: the frame being shown. */
  readonly index = ref(0);
  readonly playing = ref(false);
  readonly speed = ref<number>(1);
  /** The file being watched; `null` follows the file that changes. */
  readonly watching = ref<string | null>(null);
  /** What is being played: a recording that was saved, or the one in progress (live). */
  private readonly source = shallowRef<Recorder>(new Recorder());
  readonly title = ref("");
  readonly live = ref(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    recorder: Recorder,
    // Wrapped: `setTimeout` called as a method of the player is an "Illegal invocation" in a browser.
    private readonly schedule: (fn: () => void, ms: number) => ReturnType<typeof setTimeout> = (
      fn,
      ms,
    ) => setTimeout(fn, ms),
  ) {
    this.source.value = recorder;
  }

  get recorder() {
    return this.source.value;
  }
  get frames() {
    return this.source.value.frames.value;
  }

  /** Plays another recording, from its start. */
  use(recorder: Recorder, title = "", live = false) {
    this.pause();
    this.source.value = recorder;
    this.title.value = title;
    this.live.value = live;
    this.index.value = 0;
    this.watching.value = null;
  }
  /** The frame being shown. */
  readonly frame = computed(() => this.frames[this.index.value] ?? null);
  readonly last = computed(() => Math.max(0, this.frames.length - 1));
  readonly atEnd = computed(() => this.index.value >= this.last.value);

  /** The file to show now, and the frame it is at. */
  readonly shown = computed(() => {
    const frame = this.frame.value;
    const path = this.watching.value ?? frame?.path ?? null;
    return path ? { path, frame: frameOf(this.frames, this.index.value, path) } : null;
  });

  seek(index: number) {
    this.index.value = Math.min(Math.max(0, Math.round(index)), this.last.value);
  }

  next() {
    this.pause();
    this.seek(this.index.value + 1);
  }

  previous() {
    this.pause();
    this.seek(this.index.value - 1);
  }

  setSpeed(speed: number) {
    this.speed.value = speed;
    // Reschedule at once, so a new speed does not wait for the old delay to end.
    if (this.playing.value) this.tick();
  }

  play() {
    if (!this.frames.length) return;
    if (this.atEnd.value) this.index.value = 0; // from the start, like a video that ended
    this.playing.value = true;
    this.tick();
  }

  pause() {
    this.playing.value = false;
    clearTimeout(this.timer);
  }

  toggle() {
    this.playing.value ? this.pause() : this.play();
  }

  /** Called when the recording was cleared. */
  reset() {
    this.pause();
    this.index.value = 0;
    this.watching.value = null;
  }

  private tick() {
    clearTimeout(this.timer);
    if (!this.playing.value) return;
    if (this.atEnd.value) return this.pause();
    this.timer = this.schedule(
      () => {
        this.index.value++;
        this.tick();
      },
      delayBetween(this.frames, this.index.value, this.speed.value),
    );
  }
}
