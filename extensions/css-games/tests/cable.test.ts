import { describe, expect, test } from "vite-plus/test";
import { COLORS, cableLevels } from "../src/cable";
import { specificity, weakestFirst } from "../src/specificity";

describe("specificity", () => {
  test.each([
    ["p", [0, 0, 1]],
    [".destaque", [0, 1, 0]],
    ["#aviso", [1, 0, 0]],
    ["p.destaque", [0, 1, 1]],
    [".cartao p", [0, 1, 1]],
    ['[type="text"]', [0, 1, 0]],
    ["li:first-child", [0, 1, 1]],
    ["li:not(.feito)", [0, 1, 1]],
    ["ul li:first-child", [0, 1, 2]],
    [".tema .destaque p", [0, 2, 1]],
    ["#app .destaque", [1, 1, 0]],
    ["p::first-line", [0, 0, 2]],
    ["div > p + span", [0, 0, 3]],
  ])("%s", (selector, expected) => {
    expect(specificity(selector)).toEqual(expected);
  });
});

describe("weakestFirst", () => {
  test("orders by weight, and a tie by position", () => {
    expect(weakestFirst(["#a", "p", ".a"])).toEqual([1, 2, 0]);
    expect(weakestFirst([".b", ".a"])).toEqual([0, 1]);
  });
});

describe("cableLevels", () => {
  test("ids are unique", () => {
    expect(new Set(cableLevels.map((l) => l.id)).size).toBe(cableLevels.length);
  });

  test.each(cableLevels.map((l) => [l.id, l] as const))("%s: hint and text", (_, l) => {
    expect(l.hint.trim()).not.toBe("");
    expect(l.explanation.trim()).not.toBe("");
    if (l.kind === "pick") {
      expect(COLORS.map((c) => c.value)).toContain(l.answer);
      expect(l.hint).not.toContain(l.answer);
    }
  });

  test("an ordering level has no tie, so its answer is certain", () => {
    for (const l of cableLevels) {
      if (l.kind !== "order") continue;
      const weights = l.selectors.map((s) => specificity(s).join());
      expect(new Set(weights).size).toBe(weights.length);
    }
  });
});
