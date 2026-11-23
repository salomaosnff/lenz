import { describe, expect, test } from "vite-plus/test";
import { MAX_SEGMENTS, fold } from "../src/breadcrumb";

const path = (n: number) => Array.from({ length: n }, (_, i) => `e${i}`);

describe("folding a long path", () => {
  test("a short one is shown whole", () => {
    expect(fold(path(MAX_SEGMENTS))).toEqual({ head: path(MAX_SEGMENTS), hidden: [], tail: [] });
    expect(fold([])).toEqual({ head: [], hidden: [], tail: [] });
  });

  test("a long one keeps the first and the last ones, and the middle goes to the menu", () => {
    const { head, hidden, tail } = fold(path(9));
    expect(head).toEqual(["e0"]);
    expect(tail).toEqual(["e6", "e7", "e8"]);
    expect(hidden).toEqual(["e1", "e2", "e3", "e4", "e5"]);
  });

  test("nothing is lost or repeated, whatever the length", () => {
    for (const n of [6, 7, 20, 100]) {
      const folded = fold(path(n));
      expect([...folded.head, ...folded.hidden, ...folded.tail]).toEqual(path(n));
      expect(folded.head.length + folded.tail.length).toBe(MAX_SEGMENTS - 1);
    }
  });
});
