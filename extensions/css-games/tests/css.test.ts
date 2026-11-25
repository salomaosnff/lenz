import { describe, expect, test } from "vite-plus/test";
import { parseDeclarations, sameLayout, toStyle } from "../src/css";

const allowed = ["justify-content", "gap"];

describe("parseDeclarations", () => {
  test("reads declarations, with or without a rule around them", () => {
    const plain = parseDeclarations("justify-content: center; gap: 8px", allowed);
    const wrapped = parseDeclarations(
      ".container {\n  justify-content: center;\n  gap: 8px;\n}",
      allowed,
    );
    expect(plain.accepted).toEqual([
      { property: "justify-content", value: "center" },
      { property: "gap", value: "8px" },
    ]);
    expect(wrapped).toEqual(plain);
  });

  test("ignores comments and case in the property", () => {
    const { accepted } = parseDeclarations("/* x */ Justify-Content: flex-end;", allowed);
    expect(accepted).toEqual([{ property: "justify-content", value: "flex-end" }]);
  });

  test("rejects what the level does not teach", () => {
    const { accepted, rejected } = parseDeclarations("position: fixed; gap: 4px", allowed);
    expect(accepted).toEqual([{ property: "gap", value: "4px" }]);
    expect(rejected).toEqual([{ property: "position", reason: "not-allowed" }]);
  });

  test("rejects values that load something or leave the declaration", () => {
    for (const value of ["url(http://x)", "\\41", "<b>"]) {
      const { accepted, rejected } = parseDeclarations(`gap: ${value}`, allowed);
      expect(accepted).toEqual([]);
      expect(rejected[0]?.reason).toBe("unsafe");
    }
    // Braces cannot smuggle in another rule: what follows the first one is read as declarations.
    expect(parseDeclarations("gap: 1px } body { color: red", allowed).accepted).toEqual([]);
  });

  test("rejects what is not a declaration", () => {
    const { rejected } = parseDeclarations("center; gap:; 1x: 2", allowed);
    expect(rejected.map((r) => r.reason)).toEqual(["invalid", "invalid", "invalid"]);
  });
});

describe("toStyle", () => {
  test("joins declarations", () => {
    expect(toStyle([{ property: "gap", value: "1px" }])).toBe("gap: 1px;");
    expect(toStyle([])).toBe("");
  });
});

describe("sameLayout", () => {
  const box = { x: 0, y: 0, width: 10, height: 10 };
  test("tolerates sub-pixel differences", () => {
    expect(sameLayout([box], [{ ...box, x: 0.4 }])).toBe(true);
  });
  test("tells different positions or counts apart", () => {
    expect(sameLayout([box], [{ ...box, x: 5 }])).toBe(false);
    expect(sameLayout([box], [])).toBe(false);
  });
});
