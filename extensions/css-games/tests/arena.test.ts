import { describe, expect, test } from "vite-plus/test";
import { MATCH_GOAL, arenaLevels } from "../src/arena";
import {
  FORBIDDEN_CSS,
  HEIGHT,
  WIDTH,
  codeSize,
  compareImages,
  rewriteSelector,
  shownPercent,
} from "../src/pixels";

const image = (r: number, g: number, b: number, pixels = 4) =>
  Uint8ClampedArray.from({ length: pixels * 4 }, (_, i) => [r, g, b, 255][i % 4]!);

describe("compareImages", () => {
  test("identical images are 100% equal", () => {
    expect(compareImages(image(10, 20, 30), image(10, 20, 30)).percent).toBe(100);
  });

  test("tolerates a small difference and rejects a large one", () => {
    expect(compareImages(image(10, 20, 30), image(15, 25, 35)).percent).toBe(100);
    expect(compareImages(image(10, 20, 30), image(100, 20, 30)).percent).toBe(0);
  });

  test("counts the share of pixels that match", () => {
    const mine = image(0, 0, 0, 4);
    const target = image(0, 0, 0, 4);
    target.set([255, 255, 255, 255], 0); // one pixel in four is different
    const { percent, diff } = compareImages(mine, target);
    expect(percent).toBe(75);
    expect(Array.from(diff.slice(0, 4))).toEqual([230, 57, 70, 255]); // the wrong one is red
    expect(diff[4]).toBeGreaterThan(160); // the others are washed out
  });

  test("shows the percent rounded down", () => {
    expect(shownPercent(97.96)).toBe(97.9);
    expect(shownPercent(98)).toBe(98);
  });
});

describe("rewriteSelector", () => {
  test.each([
    ["body", "#cena"],
    ["html", "#cena"],
    [":root", "#cena"],
    ["body > div", "#cena > div"],
    ["body, div", "#cena, div"],
    ["div body", "div #cena"],
    [".body", ".body"],
    ["#html", "#html"],
    ["bodyguard", "bodyguard"],
    ["div:nth-child(2)", "div:nth-child(2)"],
  ])("%s", (selector, expected) => expect(rewriteSelector(selector)).toBe(expected));
});

describe("FORBIDDEN_CSS", () => {
  test.each([
    "background: url(x)",
    "background:URL (x)",
    "@import 'x'",
    "u\\72l(x)",
    "image-set(x)",
  ])("%s", (css) => expect(css).toMatch(FORBIDDEN_CSS));
  test("lets plain CSS through", () => {
    expect("background: linear-gradient(red, blue); content: 'a'").not.toMatch(FORBIDDEN_CSS);
  });
});

describe("arenaLevels", () => {
  test("the scene is 400×300", () => {
    expect([WIDTH, HEIGHT]).toEqual([400, 300]);
    expect(MATCH_GOAL).toBeGreaterThan(90);
  });

  test("ids are unique", () => {
    expect(new Set(arenaLevels.map((l) => l.id)).size).toBe(arenaLevels.length);
  });

  test.each(arenaLevels.map((l) => [l.id, l] as const))("%s", (_, l) => {
    expect(l.hint.trim()).not.toBe("");
    expect(l.colors.length).toBeGreaterThan(0);
    // The target is drawn with the same rules as the player: no images, no scripts.
    expect(l.css).not.toMatch(FORBIDDEN_CSS);
    expect(l.html).not.toMatch(/<(script|img|svg|iframe)/i);
    expect(codeSize(l.html, l.css)).toBeGreaterThan(0);
  });

  test("every colour of the list is used by the solution", () => {
    for (const l of arenaLevels) {
      for (const color of l.colors) {
        const short = /^#(.)\1(.)\2(.)\3$/i.exec(color);
        const alt = short ? `#${short[1]}${short[2]}${short[3]}` : color;
        expect(l.css.toLowerCase()).toMatch(new RegExp(`${color}|${alt}`.replace(/#/g, "#"), "i"));
      }
    }
  });
});
