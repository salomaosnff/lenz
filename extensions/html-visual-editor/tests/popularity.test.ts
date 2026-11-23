import { describe, expect, test } from "vite-plus/test";
import catalog from "../src/html-elements.json";
import { COMMON_TAGS, compareUse } from "../src/popularity";

const order = (tags: string[], counts = {}) => [...tags].sort(compareUse(counts));

describe("the order of the elements", () => {
  test("the common ones come first, in their order, before the others", () => {
    expect(order(["abbr", "div", "zzz", "p", "a"])).toEqual(["div", "p", "a", "abbr", "zzz"]);
  });

  test("what the user inserted most comes before the common ones", () => {
    expect(order(["div", "p", "marquee", "a"], { marquee: 3, a: 1 })).toEqual([
      "marquee",
      "a",
      "div",
      "p",
    ]);
  });

  test("the ones nobody ranked keep the order they came in", () => {
    expect(order(["x-b", "x-a"])).toEqual(["x-b", "x-a"]);
  });

  test("every common tag exists in the catalog, once", () => {
    const elements = catalog.elements as Record<string, unknown>;
    expect(COMMON_TAGS.filter((tag) => !(tag in elements))).toEqual([]);
    expect(new Set(COMMON_TAGS).size).toBe(COMMON_TAGS.length);
  });
});
