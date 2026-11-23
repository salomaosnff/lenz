import { describe, expect, it } from "vite-plus/test";
import { evaluateWhen } from "./when";

const run = (expression: string | undefined, keys: Record<string, string | boolean> = {}) =>
  evaluateWhen(expression, (key) => keys[key]);

describe("evaluateWhen", () => {
  it("is true when empty", () => {
    expect(run(undefined)).toBe(true);
    expect(run("  ")).toBe(true);
  });

  it("compares keys with strings", () => {
    const keys = { activeEditor: "html-visual-editor" };
    expect(run("activeEditor == 'html-visual-editor'", keys)).toBe(true);
    expect(run('activeEditor != "html-visual-editor"', keys)).toBe(false);
    expect(run("activeEditor == 'other'", keys)).toBe(false);
    expect(run("activeEditor == 'x'")).toBe(false);
  });

  it("treats bare keys as truthy", () => {
    expect(run("flag", { flag: true })).toBe(true);
    expect(run("flag", { flag: "false" })).toBe(false);
    expect(run("flag")).toBe(false);
    expect(run("!flag")).toBe(true);
  });

  it("combines with &&, || and parentheses", () => {
    const keys = { a: true, b: false, c: true };
    expect(run("a && b", keys)).toBe(false);
    expect(run("a || b", keys)).toBe(true);
    expect(run("a && (b || c)", keys)).toBe(true);
    expect(run("!(a && c)", keys)).toBe(false);
    expect(run("b || a && c", keys)).toBe(true);
  });

  it("is false for an invalid expression", () => {
    expect(run("a &&")).toBe(false);
    expect(run("a == 'x")).toBe(false);
  });
});
