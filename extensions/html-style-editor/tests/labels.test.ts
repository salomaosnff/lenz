import { describe, expect, test } from "vite-plus/test";
import { hasOptionLabel, optionLabel } from "../src/labels";
import { layoutSections } from "../src/layout";
import { styleGroups, type StyleField } from "../src/model";

const flatten = (fields: StyleField[]): StyleField[] =>
  fields.flatMap((f) => [f, ...flatten(f.children ?? [])]);

const kinds = ["flex", "grid", "block"] as const;
const selects = [
  ...styleGroups.flatMap((g) => flatten(g.fields)),
  ...kinds.flatMap((kind) =>
    kinds.flatMap((parent) =>
      layoutSections({ kind, parent, position: "absolute" }).flatMap((s) => flatten(s.fields)),
    ),
  ),
].filter((f) => f.options);

describe("optionLabel", () => {
  test("puts the CSS value after a human name", () => {
    expect(optionLabel("display", "grid")).toBe("Grade (grid)");
    expect(optionLabel("font-weight", "700")).toBe("Negrito (700)");
    expect(optionLabel("display", "")).toBe("—");
  });

  test("every option of every select has a name", () => {
    const missing = selects.flatMap((f) =>
      f.options!.filter((o) => !hasOptionLabel(f.prop, o)).map((o) => `${f.prop}: ${o}`),
    );
    expect(missing).toEqual([]);
  });
});
