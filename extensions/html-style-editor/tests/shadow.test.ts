import { describe, expect, test } from "vite-plus/test";
import { formatShadows, matchPreset, parseShadows, presets, summarize } from "../src/shadow";

describe("parseShadows", () => {
  test("reads lengths, color and inset in any order", () => {
    expect(parseShadows("inset 0 2px 4px 1px #000", "box")).toEqual([
      { inset: true, x: 0, y: 2, blur: 4, spread: 1, color: "#000" },
    ]);
    expect(parseShadows("red 1px 2px", "box")).toEqual([
      { inset: false, x: 1, y: 2, blur: 0, spread: 0, color: "red" },
    ]);
  });

  test("splits layers outside of color functions", () => {
    const layers = parseShadows("0 1px 2px rgb(0, 0, 0, 0.1), 0 4px 8px hsl(0 0% 0% / 0.2)", "box");
    expect(layers).toHaveLength(2);
    expect(layers![0]!.color).toBe("rgb(0, 0, 0, 0.1)");
    expect(layers![1]!.color).toBe("hsl(0 0% 0% / 0.2)");
  });

  test("empty or none has no layers", () => {
    expect(parseShadows("", "box")).toEqual([]);
    expect(parseShadows("none", "box")).toEqual([]);
  });

  test("gives up on what it cannot edit", () => {
    expect(parseShadows("0 0.5em 1em red", "box")).toBeNull();
    expect(parseShadows("0 calc(1px + 2px) red", "box")).toBeNull();
    expect(parseShadows("0", "box")).toBeNull();
    expect(parseShadows("0 0 0 0 0 red", "box")).toBeNull();
  });

  test("text shadows have no spread or inset", () => {
    expect(parseShadows("1px 1px 2px red", "text")).toHaveLength(1);
    expect(parseShadows("1px 1px 2px 3px red", "text")).toBeNull();
    expect(parseShadows("inset 1px 1px red", "text")).toBeNull();
  });

  test("currentcolor when no color is given", () => {
    expect(parseShadows("1px 1px", "text")![0]!.color).toBe("currentcolor");
  });
});

describe("formatShadows", () => {
  test("omits a spread of zero and writes zero without a unit", () => {
    const [layer] = parseShadows("0 4px 8px 0 #000", "box")!;
    expect(formatShadows([layer!], "box")).toBe("0 4px 8px #000");
  });

  test("keeps the blur when only the spread is set", () => {
    expect(formatShadows(parseShadows("0 0 0 3px blue", "box")!, "box")).toBe("0 0 0 3px blue");
  });

  test("round-trips every preset", () => {
    for (const kind of ["box", "text"] as const) {
      for (const preset of presets[kind]) {
        const layers = parseShadows(preset.value, kind);
        expect(layers, preset.label).not.toBeNull();
        expect(parseShadows(formatShadows(layers!, kind), kind)).toEqual(layers);
      }
    }
  });

  test("summarizes a layer without its color", () => {
    expect(summarize(parseShadows("inset 0 2px 4px red", "box")![0]!, "box")).toBe(
      "inset 0 2px 4px",
    );
  });
});

describe("matchPreset", () => {
  test("finds a preset however it is spaced", () => {
    expect(
      matchPreset("0 4px 6px -1px rgb(0 0 0 / 0.1),   0 2px 4px -2px rgb(0 0 0 / 0.1)", "box"),
    ).toBe("Média");
    expect(matchPreset("inset 0 2px 4px rgb(0 0 0 / 0.1)", "box")).toBe("Interna");
  });

  test("nothing once the value is edited", () => {
    expect(matchPreset("inset 0 3px 4px rgb(0 0 0 / 0.1)", "box")).toBe("");
    expect(matchPreset("", "box")).toBe("");
  });
});

test("matches through the browser serialization", () => {
  // What Chrome stores: legacy color syntax, and `inset` at the end.
  const stored = "rgba(0, 0, 0, 0.1) 0px 2px 4px inset";
  const canonical = (value: string) =>
    value
      .replace(/rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/g, "rgba($1, $2, $3, $4)")
      .replace(/^inset (.*)$/, "$1 inset")
      .replace(/(^| )0( |$)/g, "$10px$2");
  expect(matchPreset(stored, "box")).toBe("");
  expect(matchPreset(stored, "box", canonical)).toBe("Interna");
});
