import { describe, expect, test } from "vite-plus/test";
import {
  colorHints,
  contrastRatio,
  detectFormat,
  hslToRgb,
  parseColor,
  parseComputed,
  rgbToHsl,
} from "../src/color";
import { evaluate, paletteLevels, type Resolve } from "../src/palette";

/** Stands in for the browser: hex, rgb() and hsl() are read, and a few names are known. */
const NAMES: Record<string, string> = {
  blue: "#0000ff",
  tomato: "#ff6347",
  white: "#ffffff",
  black: "#000000",
  red: "#ff0000",
  transparent: "rgba(0,0,0,0)",
};
const resolve: Resolve = (css) => parseColor(NAMES[css.toLowerCase()] ?? css);

const level = (id: string) => paletteLevels.find((l) => l.id === id)!;

describe("parsing", () => {
  test("reads what the browser computes", () => {
    expect(parseComputed("rgb(255, 165, 0)")).toEqual({ r: 255, g: 165, b: 0, a: 1 });
    expect(parseComputed("rgba(255, 0, 0, 0.5)")).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
    expect(parseComputed("rgb(255 0 0 / 50%)")?.a).toBe(0.5);
    expect(parseComputed("color(srgb 1 0 0 / 0.25)")).toEqual({ r: 255, g: 0, b: 0, a: 0.25 });
    expect(parseComputed("nope")).toBeUndefined();
  });

  test("reads hex, rgb() and hsl()", () => {
    expect(parseColor("#f60")).toEqual({ r: 255, g: 102, b: 0, a: 1 });
    expect(parseColor("#FF6600")).toEqual({ r: 255, g: 102, b: 0, a: 1 });
    expect(parseColor("hsl(120, 100%, 50%)")).toEqual({ r: 0, g: 255, b: 0, a: 1 });
    expect(parseColor("hsla(0, 100%, 50%, 0.5)")?.a).toBe(0.5);
    expect(parseColor("#12")).toBeUndefined();
  });

  test("hsl and rgb agree", () => {
    expect(hslToRgb(240, 100, 50)).toEqual({ r: 0, g: 0, b: 255 });
    const { h, s, l } = rgbToHsl({ r: 0, g: 255, b: 255 });
    expect([h, s, l]).toEqual([180, 100, 50]);
  });
});

describe("detectFormat", () => {
  test.each([
    ["red", "named"],
    ["#fff", "hex3"],
    ["#ffffff", "hex"],
    ["rgb(1, 2, 3)", "rgb"],
    ["rgba(1, 2, 3, .5)", "rgb"],
    ["hsl(1, 2%, 3%)", "hsl"],
    ["inherit", "other"],
    ["#ffff", "other"],
    ["12px", "other"],
  ])("%s", (text, format) => expect(detectFormat(text)).toBe(format));
});

describe("contrast", () => {
  test("matches the WCAG reference values", () => {
    const white = { r: 255, g: 255, b: 255, a: 1 };
    const black = { r: 0, g: 0, b: 0, a: 1 };
    expect(contrastRatio(black, white)).toBeCloseTo(21, 5);
    expect(contrastRatio(white, white)).toBe(1);
  });

  test("the middle gray lets only black through", () => {
    const gray = level("color-contrast-gray");
    expect(evaluate(gray, "black", resolve).solved).toBe(true);
    expect(evaluate(gray, "white", resolve).solved).toBe(false);
  });

  test("a faded text is read over its background", () => {
    const light = level("color-contrast-light");
    expect(evaluate(light, "rgb(0 0 0 / 10%)", resolve).solved).toBe(false);
  });
});

describe("hints", () => {
  test("say which way each channel goes", () => {
    const target = { r: 255, g: 165, b: 0, a: 1 };
    const player = { r: 255, g: 200, b: 40, a: 1 };
    expect(colorHints(player, target, "rgb", false, 4).map((h) => h.state)).toEqual([
      "ok",
      "down",
      "down",
    ]);
  });

  test("the hue takes the short way round the circle", () => {
    const near350 = { ...hslToRgb(350, 100, 50), a: 1 };
    const near10 = { ...hslToRgb(10, 100, 50), a: 1 };
    expect(colorHints(near350, near10, "hsl", false, 5)[0]?.state).toBe("up");
  });
});

describe("every level can be solved with its solution", () => {
  test.each(paletteLevels.map((l) => [l.id, l] as const))("%s", (_, l) => {
    expect(evaluate(l, l.solution, resolve).solved).toBe(true);
  });

  test("and none is solved by an empty answer", () => {
    for (const l of paletteLevels) expect(evaluate(l, "", resolve).solved).toBe(false);
  });

  test("the way to write it is checked", () => {
    expect(evaluate(level("color-hex-short"), "#ff6600", resolve).status).toBe("format");
    expect(evaluate(level("color-named"), "inherit", resolve).status).toBe("invalid");
    expect(evaluate(level("color-named"), "notacolor", resolve).status).toBe("invalid");
  });
});

describe("hints do not give the answer away", () => {
  test.each(paletteLevels.map((l) => [l.id, l] as const))("%s", (_, l) => {
    expect(l.hint.trim()).not.toBe("");
    expect(l.hint.toLowerCase()).not.toContain(l.solution.toLowerCase());
  });
});
