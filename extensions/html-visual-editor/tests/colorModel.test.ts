import { describe, expect, test } from "vite-plus/test";
import {
  colorFormats,
  convertColor,
  detectFormat,
  formatColor,
  parseColor,
  srgbToHsv,
  hsvToSrgb,
  toSrgbInGamut,
  type Color,
  type ColorSpace,
} from "../src/colorModel";
import { namedColors } from "../src/cssNamedColors";

const red = parseColor("#ff0000")!;
const close = (a: number[], b: number[], eps = 1e-3) =>
  a.forEach((v, i) => expect(Math.abs(v - b[i]!)).toBeLessThan(eps));

describe("parseColor", () => {
  test("hex in every length", () => {
    expect(parseColor("#f00")!.coords).toEqual([1, 0, 0]);
    expect(parseColor("#f008")!.alpha).toBeCloseTo(0.5333, 3);
    expect(parseColor("#ff000080")!.alpha).toBeCloseTo(0.502, 3);
    expect(parseColor("#ff00")).toBeTruthy();
    expect(parseColor("#ff")).toBeNull();
    expect(parseColor("#gggggg")).toBeNull();
  });
  test("every named color, transparent and case", () => {
    expect(Object.keys(namedColors)).toHaveLength(148);
    for (const name of Object.keys(namedColors))
      expect(parseColor(name.toUpperCase())).toBeTruthy();
    expect(parseColor("rebeccapurple")).toEqual(parseColor("#663399"));
    expect(parseColor("transparent")!.alpha).toBe(0);
  });
  test("rgb legacy, modern, percentages and alpha", () => {
    expect(parseColor("rgb(255, 0, 0)")).toEqual(red);
    expect(parseColor("rgba(255,0,0,.5)")!.alpha).toBe(0.5);
    expect(parseColor("rgb(255 0 0 / 50%)")!.alpha).toBe(0.5);
    expect(parseColor("rgb(100% 0% 0%)")!.coords).toEqual([1, 0, 0]);
    expect(parseColor("rgb(255 0)")).toBeNull();
  });
  test("hsl / hwb with angle units", () => {
    close(convertColor(parseColor("hsl(120 100% 50%)")!, "srgb").coords, [0, 1, 0]);
    close(convertColor(parseColor("hsl(0.5turn 100% 50%)")!, "srgb").coords, [0, 1, 1]);
    close(convertColor(parseColor("hsla(240deg, 100%, 50%, 0.3)")!, "srgb").coords, [0, 0, 1]);
    close(convertColor(parseColor("hwb(0 0% 0%)")!, "srgb").coords, [1, 0, 0]);
    close(convertColor(parseColor("hwb(0 50% 50%)")!, "srgb").coords, [0.5, 0.5, 0.5]);
  });
  test("lab, lch, oklab, oklch, color()", () => {
    close(convertColor(parseColor("lab(54.29 80.8 69.89)")!, "srgb").coords, [1, 0, 0], 2e-3);
    close(convertColor(parseColor("lch(54.29 106.84 40.85)")!, "srgb").coords, [1, 0, 0], 2e-3);
    close(convertColor(parseColor("oklab(0.628 0.2249 0.1258)")!, "srgb").coords, [1, 0, 0], 2e-3);
    close(convertColor(parseColor("oklch(62.8% 0.2577 29.23)")!, "srgb").coords, [1, 0, 0], 2e-3);
    expect(parseColor("color(display-p3 1 0 0 / 0.5)")!.alpha).toBe(0.5);
    expect(parseColor("color(xyz 0.1 0.2 0.3)")!.space).toBe("xyz-d65");
    expect(parseColor("color(nope 1 1 1)")).toBeNull();
  });
  test("dynamic syntaxes are left to the browser", () => {
    for (const text of [
      "var(--x)",
      "color-mix(in srgb, red, blue)",
      "currentcolor",
      "rgb(from red r g b)",
      "light-dark(red, blue)",
      "Canvas",
      "rgb(calc(1 + 1) 0 0)",
    ])
      expect(parseColor(text)).toBeNull();
  });
});

describe("conversion", () => {
  test("known values of sRGB red", () => {
    close(convertColor(red, "oklch").coords, [0.628, 0.2577, 29.23], 1e-2);
    close(convertColor(red, "lab").coords, [54.29, 80.8, 69.89], 2e-2);
    close(convertColor(red, "display-p3").coords, [0.9175, 0.2003, 0.1386], 2e-3);
    close(convertColor(red, "hsl").coords, [0, 100, 50]);
    close(convertColor(red, "xyz-d65").coords, [0.4124, 0.2126, 0.0193], 1e-3);
    close(convertColor(red, "xyz-d50").coords, [0.4361, 0.2225, 0.0139], 1e-3);
  });
  test("white is white in every space", () => {
    const white = parseColor("white")!;
    close(convertColor(white, "oklab").coords, [1, 0, 0], 1e-4);
    close(convertColor(white, "lab").coords, [100, 0, 0], 1e-2);
    close(convertColor(white, "xyz-d50").coords, [0.9643, 1, 0.8251], 1e-3);
    for (const space of [
      "display-p3",
      "a98-rgb",
      "prophoto-rgb",
      "rec2020",
      "srgb-linear",
    ] as ColorSpace[])
      close(convertColor(white, space).coords, [1, 1, 1], 1e-4);
  });
  test("round trip through every space", () => {
    const spaces = colorFormats
      .map((f) => f.id)
      .filter((id) => id !== "name" && id !== "hex") as ColorSpace[];
    for (const hex of ["#336699", "#ff8800", "#102030", "#ffffff", "#000000", "#808080"]) {
      const start = parseColor(hex)!;
      for (const space of spaces) {
        const back = convertColor(convertColor(start, space), "srgb");
        close(back.coords, start.coords, 1e-6);
      }
    }
  });
});

describe("formatColor", () => {
  test("legacy formats", () => {
    expect(formatColor(red, "hex")).toBe("#ff0000");
    expect(formatColor(red, "rgb")).toBe("rgb(255 0 0)");
    expect(formatColor(red, "hsl")).toBe("hsl(0 100% 50%)");
    expect(formatColor(red, "hwb")).toBe("hwb(0 0% 0%)");
    expect(formatColor(red, "name")).toBe("red");
    expect(formatColor(parseColor("#12345680")!, "rgb")).toBe("rgb(18 52 86 / 0.502)");
    expect(formatColor(parseColor("#12345680")!, "hex")).toBe("#12345680");
  });
  test("modern formats", () => {
    expect(formatColor(red, "oklch")).toMatch(/^oklch\(0\.628 0\.2577 29\.\d+\)$/);
    expect(formatColor(red, "lab")).toMatch(/^lab\(54\.29 80\.\d+ 69\.\d+\)$/);
    expect(formatColor(red, "display-p3")).toMatch(
      /^color\(display-p3 0\.91\d+ 0\.20\d+ 0\.13\d+\)$/,
    );
  });
  test("output parses back to the same color", () => {
    const start = parseColor("#3a7bd5cc")!;
    for (const { id } of colorFormats) {
      if (id === "name") continue;
      const text = formatColor(start, id);
      const back = parseColor(text);
      expect(back, text).toBeTruthy();
      close(
        convertColor(back!, "srgb").coords,
        start.coords,
        id === "hex" || id === "rgb" ? 0.003 : 0.002,
      );
      expect(Math.abs(back!.alpha - start.alpha)).toBeLessThan(0.003);
    }
  });
  test("out-of-gamut colors are mapped for legacy formats", () => {
    const p3 = parseColor("color(display-p3 0 1 0)")!;
    const mapped = toSrgbInGamut(p3);
    mapped.coords.forEach((v) => expect(v >= 0 && v <= 1).toBe(true));
    expect(formatColor(p3, "hex")).toMatch(/^#[0-9a-f]{6}$/);
    // the wide-gamut format keeps the original value
    expect(formatColor(p3, "display-p3")).toBe("color(display-p3 0 1 0)");
  });
  test("detectFormat", () => {
    expect(detectFormat("#fff")).toBe("hex");
    expect(detectFormat("rgba(1,2,3,1)")).toBe("rgb");
    expect(detectFormat("oklch(1 0 0)")).toBe("oklch");
    expect(detectFormat("color(display-p3 1 0 0)")).toBe("display-p3");
    expect(detectFormat("color(xyz 1 0 0)")).toBe("xyz-d65");
    expect(detectFormat("tomato")).toBe("name");
    expect(detectFormat("var(--x)")).toBe("hex");
  });
});

test("hsv helpers round trip and keep the hue of greys", () => {
  const rgb = parseColor("#336699")!.coords;
  close(hsvToSrgb(srgbToHsv(rgb)), rgb, 1e-9);
  expect(srgbToHsv([0.5, 0.5, 0.5], 200).h).toBe(200);
});
