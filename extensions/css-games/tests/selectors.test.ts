import { describe, expect, test } from "vite-plus/test";
import { sameSelection, selectorLevels } from "../src/selectors";
import { splitCode } from "../src/text";

describe("selectorLevels", () => {
  test("ids are unique", () => {
    expect(new Set(selectorLevels.map((l) => l.id)).size).toBe(selectorLevels.length);
  });

  test.each(selectorLevels.map((l) => [l.id, l] as const))(
    "%s: the hint does not give the answer away",
    (_, l) => {
      expect(l.hint.trim()).not.toBe("");
      // A one-letter selector (`p`) is inside any sentence: what matters is that it is not shown as code.
      expect(l.hint).not.toContain(`\`${l.solution}\``);
      if (l.solution.length > 2) expect(l.hint).not.toContain(l.solution);
      expect(l.html.trim()).not.toBe("");
    },
  );
});

describe("sameSelection", () => {
  test("compares sets, whatever the order", () => {
    expect(sameSelection([1, 2], [2, 1])).toBe(true);
    expect(sameSelection([1], [1, 2])).toBe(false);
    expect(sameSelection([], [])).toBe(true);
  });
});

describe("splitCode", () => {
  test("marks the code spans", () => {
    expect(splitCode("a `b` c")).toEqual([
      { text: "a ", code: false },
      { text: "b", code: true },
      { text: " c", code: false },
    ]);
  });
});
