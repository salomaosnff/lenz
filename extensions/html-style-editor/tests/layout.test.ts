import { describe, expect, test } from "vite-plus/test";
import {
  isDistributed,
  layoutKind,
  layoutSections,
  readAlignment,
  writeAlignment,
  type LayoutContext,
} from "../src/layout";

const values = (over: Partial<Parameters<typeof readAlignment>[1]> = {}) => ({
  direction: "row",
  justifyContent: "normal",
  alignItems: "normal",
  justifyItems: "normal",
  ...over,
});

describe("layoutKind", () => {
  test.each([
    ["flex", "flex"],
    ["inline-flex", "flex"],
    ["grid", "grid"],
    ["inline-grid", "grid"],
    ["block", "block"],
    ["inline-block", "block"],
    ["inline", "inline"],
    ["none", "none"],
  ])("%s -> %s", (display, kind) => expect(layoutKind(display)).toBe(kind));
});

describe("flex alignment", () => {
  test("row: justify is horizontal, align is vertical", () => {
    const v = values({ justifyContent: "center", alignItems: "flex-end" });
    expect(readAlignment("flex", v)).toEqual({ x: 1, y: 2 });
    expect(writeAlignment("flex", "row", 1, 2)).toEqual({
      "justify-content": "center",
      "align-items": "flex-end",
    });
  });

  test("column swaps the axes", () => {
    const v = values({ direction: "column", justifyContent: "flex-end", alignItems: "center" });
    expect(readAlignment("flex", v)).toEqual({ x: 1, y: 2 });
    expect(writeAlignment("flex", "column", 1, 2)).toEqual({
      "justify-content": "flex-end",
      "align-items": "center",
    });
  });

  test("reverse mirrors the main axis", () => {
    const v = values({ direction: "row-reverse", justifyContent: "flex-start" });
    expect(readAlignment("flex", v).x).toBe(2);
    expect(writeAlignment("flex", "row-reverse", 2, 0)["justify-content"]).toBe("flex-start");
  });

  test("stretch and distributed content select no cell on that axis", () => {
    const v = values({ justifyContent: "space-between", alignItems: "normal" });
    expect(readAlignment("flex", v)).toEqual({ x: null, y: null });
    expect(isDistributed("space-between")).toBe(true);
    expect(isDistributed("center")).toBe(false);
  });

  test("written values read back to the same cell", () => {
    for (const direction of ["row", "row-reverse", "column", "column-reverse"]) {
      for (const x of [0, 1, 2] as const) {
        for (const y of [0, 1, 2] as const) {
          const w = writeAlignment("flex", direction, x, y);
          const read = readAlignment(
            "flex",
            values({
              direction,
              justifyContent: w["justify-content"]!,
              alignItems: w["align-items"]!,
            }),
          );
          expect(read).toEqual({ x, y });
        }
      }
    }
  });
});

describe("grid alignment", () => {
  test("uses justify-items and align-items", () => {
    expect(writeAlignment("grid", "row", 2, 0)).toEqual({
      "justify-items": "end",
      "align-items": "start",
    });
    expect(readAlignment("grid", values({ justifyItems: "center", alignItems: "end" }))).toEqual({
      x: 1,
      y: 2,
    });
  });
});

const propsOf = (context: Partial<LayoutContext>) =>
  layoutSections({ kind: "block", parent: "block", position: "static", ...context }).flatMap((s) =>
    s.fields.flatMap((f) => [f.prop, ...(f.children?.map((c) => c.prop) ?? [])]),
  );

describe("layoutSections", () => {
  test("a flex container has every flex container property", () => {
    expect(propsOf({ kind: "flex" })).toEqual(
      expect.arrayContaining([
        "flex-direction",
        "flex-wrap",
        "justify-content",
        "align-items",
        "align-content",
        "gap",
        "row-gap",
        "column-gap",
      ]),
    );
  });

  test("a grid container has every grid container property", () => {
    expect(propsOf({ kind: "grid" })).toEqual(
      expect.arrayContaining([
        "grid-template-columns",
        "grid-template-rows",
        "grid-template-areas",
        "grid-auto-flow",
        "grid-auto-columns",
        "grid-auto-rows",
        "justify-items",
        "align-items",
        "justify-content",
        "align-content",
        "gap",
      ]),
    );
  });

  test("items get the properties of their parent layout", () => {
    expect(propsOf({ parent: "flex" })).toEqual(
      expect.arrayContaining(["flex-grow", "flex-shrink", "flex-basis", "align-self", "order"]),
    );
    expect(propsOf({ parent: "grid" })).toEqual(
      expect.arrayContaining([
        "grid-column",
        "grid-row",
        "grid-area",
        "justify-self",
        "align-self",
      ]),
    );
    expect(propsOf({ parent: "block" })).not.toContain("flex-grow");
    expect(propsOf({ parent: "block" })).not.toContain("grid-column");
  });

  test("hides what has no effect", () => {
    expect(propsOf({ kind: "block" })).not.toContain("justify-content");
    expect(propsOf({ kind: "block" })).not.toContain("gap");
    expect(propsOf({ kind: "inline" })).not.toContain("width");
    expect(propsOf({ kind: "none" })).toEqual(["display"]);
    expect(propsOf({})).not.toContain("top");
    expect(propsOf({ position: "absolute" })).toEqual(
      expect.arrayContaining(["top", "right", "bottom", "left", "z-index"]),
    );
  });

  test("sizes cover min, max and aspect ratio", () => {
    expect(propsOf({})).toEqual(
      expect.arrayContaining(["width", "height", "min-width", "max-height", "aspect-ratio"]),
    );
  });
});

describe("shorthands", () => {
  test("expose their longhands", () => {
    const fields = layoutSections({ kind: "flex", parent: "flex", position: "absolute" }).flatMap(
      (s) => s.fields,
    );
    const longhands = (prop: string) =>
      fields.find((f) => f.prop === prop)?.children?.map((c) => c.prop);
    expect(longhands("overflow")).toEqual(["overflow-x", "overflow-y"]);
    expect(longhands("gap")).toEqual(["row-gap", "column-gap"]);
    expect(longhands("flex")).toEqual(["flex-grow", "flex-shrink", "flex-basis"]);
    expect(longhands("inset")).toEqual(["top", "right", "bottom", "left"]);
  });
});
