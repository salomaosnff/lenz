import { describe, expect, test } from "vite-plus/test";
import { Recorder, frameOf } from "../src/recorder";

const make = (options = {}) => {
  const clock = { now: 1000 };
  const recorder = new Recorder({ now: () => clock.now, ...options });
  return { recorder, clock };
};

describe("Recorder", () => {
  test("keeps every frame, in order, with its time and content", () => {
    const { recorder, clock } = make();
    recorder.add({ path: "a.html", kind: "open", label: "Aberto", content: "<p>1</p>" });
    clock.now = 2500;
    recorder.add({ path: "b.html", kind: "open", label: "Aberto", content: "x" });
    clock.now = 3000;
    recorder.add({ path: "a.html", kind: "record", label: "Editar", content: "<p>2</p>" });
    expect(recorder.frames.value.map((f) => [f.path, f.kind, f.time, f.content])).toEqual([
      ["a.html", "open", 1000, "<p>1</p>"],
      ["b.html", "open", 2500, "x"],
      ["a.html", "record", 3000, "<p>2</p>"],
    ]);
    expect(recorder.frames.value.map((f) => f.id)).toEqual([0, 1, 2]);
  });

  test("a closed file keeps the content it had last", () => {
    const { recorder } = make();
    recorder.add({ path: "a.html", kind: "open", label: "Aberto", content: "one" });
    recorder.add({ path: "a.html", kind: "record", label: "Editar", content: "two" });
    const closed = recorder.add({ path: "a.html", kind: "close", label: "Fechado" });
    expect(closed.content).toBe("two");
  });

  test("drops the oldest frames past the limit", () => {
    const { recorder } = make({ limit: 3 });
    for (let i = 0; i < 5; i++)
      recorder.add({ path: "a", kind: "record", label: "x", content: String(i) });
    expect(recorder.frames.value.map((f) => f.content)).toEqual(["2", "3", "4"]);
  });

  test("clears, and lists the files in the order they appeared", () => {
    const { recorder } = make();
    recorder.add({ path: "b", kind: "open", label: "x", content: "" });
    recorder.add({ path: "a", kind: "open", label: "x", content: "" });
    recorder.add({ path: "b", kind: "record", label: "x", content: "1" });
    expect(recorder.paths()).toEqual(["b", "a"]);
    recorder.clear();
    expect(recorder.frames.value).toEqual([]);
    expect(recorder.paths()).toEqual([]);
  });
});

describe("frameOf", () => {
  const { recorder } = make();
  recorder.add({ path: "a", kind: "open", label: "1", content: "a1" });
  recorder.add({ path: "b", kind: "open", label: "2", content: "b1" });
  recorder.add({ path: "a", kind: "record", label: "3", content: "a2" });
  const frames = recorder.frames.value;

  test("a file as it was at a moment", () => {
    expect(frameOf(frames, 0, "a")?.content).toBe("a1");
    expect(frameOf(frames, 1, "a")?.content).toBe("a1");
    expect(frameOf(frames, 2, "a")?.content).toBe("a2");
    expect(frameOf(frames, 2, "b")?.content).toBe("b1");
  });

  test("null before the file existed", () => {
    expect(frameOf(frames, 0, "b")).toBeNull();
    expect(frameOf(frames, 2, "nope")).toBeNull();
  });
});
