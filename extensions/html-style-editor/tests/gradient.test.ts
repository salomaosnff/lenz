import { describe, expect, test } from "vite-plus/test";
import {
  defaultGradient,
  formatGradient,
  gradientPresets,
  matchGradientPreset,
  nearestColor,
  parseGradient,
  reverseStops,
  sortStops,
} from "../src/gradient";

describe("parseGradient", () => {
  test("linear with an angle and positioned stops", () => {
    const g = parseGradient("linear-gradient(45deg, red 0%, blue 100%)")!;
    expect(g.type).toBe("linear");
    expect(g.angle).toBe(45);
    expect(g.stops).toEqual([
      { color: "red", position: 0 },
      { color: "blue", position: 100 },
    ]);
  });

  test("stops without position are spread evenly", () => {
    const g = parseGradient("linear-gradient(red, yellow, blue, green)")!;
    expect(g.angle).toBe(180);
    expect(g.stops.map((s) => s.position)).toEqual([0, 33.33, 66.67, 100]);
  });

  test("two positions make two stops", () => {
    const g = parseGradient("linear-gradient(red 0% 50%, blue 50% 100%)")!;
    expect(g.stops).toHaveLength(4);
  });

  test("keeps color functions whole", () => {
    const g = parseGradient("linear-gradient(90deg, rgb(0, 0, 0) 0%, hsl(0 0% 100% / 0.5) 100%)")!;
    expect(g.stops.map((s) => s.color)).toEqual(["rgb(0, 0, 0)", "hsl(0 0% 100% / 0.5)"]);
  });

  test("directions and other angle units", () => {
    expect(parseGradient("linear-gradient(to right, red, blue)")!.angle).toBe(90);
    expect(parseGradient("linear-gradient(to right top, red, blue)")!.angle).toBe(45);
    expect(parseGradient("linear-gradient(0.25turn, red, blue)")!.angle).toBe(90);
  });

  test("radial shape, size and position", () => {
    const g = parseGradient("radial-gradient(circle closest-side at 20% 80%, red, blue)")!;
    expect(g).toMatchObject({
      type: "radial",
      shape: "circle",
      size: "closest-side",
      x: 20,
      y: 80,
    });
    const keywords = parseGradient("radial-gradient(at top left, red, blue)")!;
    expect([keywords.x, keywords.y]).toEqual([0, 0]);
  });

  test("conic start and center", () => {
    const g = parseGradient("conic-gradient(from 90deg at 25% 75%, red, blue)")!;
    expect(g).toMatchObject({ type: "conic", angle: 90, x: 25, y: 75 });
  });

  test("repeating", () => {
    expect(parseGradient("repeating-linear-gradient(red, blue 10%)")!.repeating).toBe(true);
  });

  test("gives up on what it cannot edit", () => {
    expect(parseGradient("url(a.png)")).toBeNull();
    expect(parseGradient("linear-gradient(red, blue), url(a.png)")).toBeNull();
    expect(parseGradient("linear-gradient(in oklch, red, blue)")).toBeNull();
    expect(parseGradient("linear-gradient(red 10px, blue 50px)")).toBeNull();
    expect(parseGradient("linear-gradient(red, 30%, blue)")).toBeNull();
    expect(parseGradient("linear-gradient(red)")).toBeNull();
    expect(parseGradient("")).toBeNull();
  });
});

describe("formatGradient", () => {
  test("writes every type", () => {
    expect(formatGradient(defaultGradient("linear"))).toBe(
      "linear-gradient(90deg, #8b5cf6 0%, #06b6d4 100%)",
    );
    expect(formatGradient(defaultGradient("radial"))).toBe(
      "radial-gradient(ellipse farthest-corner at 50% 50%, #8b5cf6 0%, #06b6d4 100%)",
    );
    expect(formatGradient(defaultGradient("conic"))).toBe(
      "conic-gradient(from 0deg at 50% 50%, #8b5cf6 0%, #06b6d4 100%)",
    );
    expect(formatGradient({ ...defaultGradient(), repeating: true })).toMatch(
      /^repeating-linear-gradient/,
    );
  });

  test("every preset reads back to the same gradient", () => {
    for (const preset of gradientPresets) {
      const g = parseGradient(preset.value);
      expect(g, preset.label).not.toBeNull();
      expect(parseGradient(formatGradient(g!)), preset.label).toEqual(g);
    }
  });
});

describe("stops", () => {
  const stops = [
    { color: "a", position: 80 },
    { color: "b", position: 10 },
    { color: "c", position: 40 },
  ];

  test("sorting says where a stop went", () => {
    const result = sortStops(stops, stops[0]);
    expect(result.stops.map((s) => s.color)).toEqual(["b", "c", "a"]);
    expect(result.index).toBe(2);
  });

  test("reversing mirrors the positions", () => {
    expect(reverseStops(sortStops(stops).stops).map((s) => [s.color, s.position])).toEqual([
      ["a", 20],
      ["c", 60],
      ["b", 90],
    ]);
  });

  test("a new stop starts from the closest color", () => {
    expect(nearestColor(stops, 45)).toBe("c");
    expect(nearestColor(stops, 0)).toBe("b");
  });
});

describe("matchGradientPreset", () => {
  test("finds a preset however it is written", () => {
    expect(matchGradientPreset("linear-gradient(135deg,#f97316,#ec4899)")).toBe("Pôr do sol");
    expect(matchGradientPreset(gradientPresets[0]!.value)).toBe(gradientPresets[0]!.label);
  });

  test("nothing once the gradient is edited", () => {
    expect(matchGradientPreset("linear-gradient(136deg, #f97316 0%, #ec4899 100%)")).toBe("");
    expect(matchGradientPreset("")).toBe("");
  });
});

test("gradients match through the browser serialization", () => {
  const stored = "linear-gradient(135deg, rgb(249, 115, 22) 0%, rgb(236, 72, 153) 100%)";
  const hex = (value: string) =>
    value.replace(/#f97316/g, "rgb(249, 115, 22)").replace(/#ec4899/g, "rgb(236, 72, 153)");
  expect(matchGradientPreset(stored)).toBe("");
  expect(matchGradientPreset(stored, hex)).toBe("Pôr do sol");
});
