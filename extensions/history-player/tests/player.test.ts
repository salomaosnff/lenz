import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { MAX_GAP, MIN_GAP, Player, delayBetween } from "../src/player";
import { Recorder } from "../src/recorder";

afterEach(() => vi.unstubAllGlobals());

/** A recording with the given gaps (ms) between frames, and a player on a clock the test drives. */
function setup(gaps: number[]) {
  let now = 0;
  const recorder = new Recorder({ now: () => now });
  recorder.add({ path: "a.html", kind: "open", label: "Aberto", content: "0" });
  gaps.forEach((gap, i) => {
    now += gap;
    recorder.add({
      path: i % 2 ? "b.html" : "a.html",
      kind: "record",
      label: `Edição ${i + 1}`,
      content: String(i + 1),
    });
  });
  const scheduled: { fn: () => void; ms: number; cancelled: boolean }[] = [];
  const schedule = (fn: () => void, ms: number) => {
    const item = { fn, ms, cancelled: false };
    scheduled.push(item);
    return item as unknown as ReturnType<typeof setTimeout>;
  };
  vi.stubGlobal("clearTimeout", (item: { cancelled: boolean } | undefined) => {
    if (item) item.cancelled = true;
  });
  const player = new Player(recorder, schedule);
  /** Runs the next timer that was not cancelled. */
  const advance = () => {
    const item = scheduled.reverse().find((s) => !s.cancelled);
    scheduled.length = 0;
    item?.fn();
    return item?.ms;
  };
  return { player, recorder, advance, scheduled };
}

describe("delayBetween", () => {
  const frames = setup([50, 600, 20_000]).recorder.frames.value;

  test("follows the recorded gap, at the speed", () => {
    expect(delayBetween(frames, 1, 1)).toBe(600);
    expect(delayBetween(frames, 1, 2)).toBe(300);
    expect(delayBetween(frames, 1, 0.5)).toBe(1200);
  });

  test("shortens a long silence and lengthens a tiny gap", () => {
    expect(delayBetween(frames, 2, 1)).toBe(MAX_GAP);
    expect(delayBetween(frames, 0, 1)).toBe(MIN_GAP);
  });

  test("nothing after the last frame", () => {
    expect(delayBetween(frames, 3, 1)).toBe(0);
  });
});

describe("Player", () => {
  test("next and previous step one frame and stop the playing", () => {
    const { player } = setup([100, 100, 100]);
    player.play();
    player.next();
    expect(player.playing.value).toBe(false);
    expect(player.index.value).toBe(1);
    player.previous();
    player.previous(); // stays at the first
    expect(player.index.value).toBe(0);
    for (let i = 0; i < 9; i++) player.next();
    expect(player.index.value).toBe(3); // stays at the last
  });

  test("play goes through the frames, then stops at the end", () => {
    const { player, advance } = setup([300, 600]);
    player.play();
    expect(player.playing.value).toBe(true);
    expect(advance()).toBe(300);
    expect(player.index.value).toBe(1);
    expect(advance()).toBe(600);
    expect(player.index.value).toBe(2);
    expect(player.playing.value).toBe(false);
  });

  test("play at the end starts over", () => {
    const { player } = setup([300]);
    player.seek(1);
    player.play();
    expect(player.index.value).toBe(0);
    expect(player.playing.value).toBe(true);
  });

  test("a new speed takes effect at once", () => {
    const { player, advance } = setup([800, 800]);
    player.play();
    player.setSpeed(4);
    expect(advance()).toBe(200);
  });

  test("pause stops the timer", () => {
    const { player, advance } = setup([300, 300]);
    player.play();
    player.pause();
    expect(advance()).toBeUndefined();
    expect(player.index.value).toBe(0);
  });

  test("shows the file that changes, or the one being watched", () => {
    const { player } = setup([100, 100, 100]);
    player.seek(2); // frame 2 is b.html; a.html was last changed at frame 1... (i=0 -> a)
    expect(player.shown.value?.path).toBe("b.html");
    player.watching.value = "a.html";
    expect(player.shown.value?.path).toBe("a.html");
    expect(player.shown.value?.frame?.content).toBe("1");
  });

  test("seek stays inside the recording; reset goes back to the start", () => {
    const { player } = setup([100, 100]);
    player.seek(99);
    expect(player.index.value).toBe(2);
    player.seek(-5);
    expect(player.index.value).toBe(0);
    player.seek(2);
    player.watching.value = "a.html";
    player.reset();
    expect(player.index.value).toBe(0);
    expect(player.watching.value).toBeNull();
  });

  test("nothing to play with an empty recording", () => {
    const { player, recorder } = setup([]);
    recorder.clear();
    player.play();
    expect(player.playing.value).toBe(false);
    expect(player.frame.value).toBeNull();
  });
});

describe("Player with the real timers", () => {
  test("plays by itself (the default scheduler works when called as a method)", async () => {
    let now = 0;
    const recorder = new Recorder({ now: () => now });
    for (let i = 0; i < 3; i++) {
      now += 10; // short gaps: MIN_GAP applies, 8x makes it fast
      recorder.add({ path: "a.html", kind: "record", label: String(i), content: String(i) });
    }
    const player = new Player(recorder); // no injected scheduler
    player.setSpeed(8);
    player.play();
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(player.index.value).toBe(2);
    expect(player.playing.value).toBe(false);
  });
});

describe("Player.use", () => {
  test("switches to another recording, from its start, and stops what was playing", () => {
    const { player } = setup([100, 100]);
    player.seek(2);
    player.watching.value = "a.html";
    player.play();
    const other = setup([50]).recorder;
    player.use(other, "Outra", true);
    expect(player.playing.value).toBe(false);
    expect(player.index.value).toBe(0);
    expect(player.watching.value).toBeNull();
    expect(player.frames).toBe(other.frames.value);
    expect(player.title.value).toBe("Outra");
    expect(player.live.value).toBe(true);
    expect(player.last.value).toBe(1);
  });
});
