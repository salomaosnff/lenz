import { describe, expect, test } from "vite-plus/test";
import { parseDeclarations } from "../src/css";
import { bugLevels } from "../src/bugs";
import { houseLevels } from "../src/house";
import { levels as blockLevels } from "../src/levels";

const levels = [...blockLevels, ...houseLevels, ...bugLevels];
import { clearProgress, loadProgress, saveProgress, type Store } from "../src/progress";

describe("levels", () => {
  test("ids are unique", () => {
    expect(new Set(levels.map((l) => l.id)).size).toBe(levels.length);
  });

  test.each(levels.map((l) => [l.id, l] as const))(
    "%s: the solution uses allowed properties only",
    (_, level) => {
      const { accepted, rejected } = parseDeclarations(level.solution, level.allowed);
      expect(rejected).toEqual([]);
      expect(accepted.length).toBeGreaterThan(0);
    },
  );

  test.each(levels.map((l) => [l.id, l] as const))(
    "%s: the hint does not give the answer away",
    (_, level) => {
      expect(level.hint.trim()).not.toBe("");
      const hint = level.hint.replace(/\s+/g, " ");
      for (const { property, value } of parseDeclarations(level.solution, level.allowed).accepted) {
        expect(hint).not.toContain(`${property}: ${value}`);
        expect(hint).not.toContain(`${property}:${value}`);
      }
    },
  );

  test("every bug level starts with CSS that is not the solution", () => {
    for (const l of bugLevels) {
      expect(l.start?.trim()).toBeTruthy();
      expect(l.start).not.toBe(l.solution);
    }
  });

  test("a box to target exists", () => {
    for (const l of levels)
      if (typeof l.target === "number") expect(l.target).toBeLessThan(l.items);
  });
});

describe("progress", () => {
  const memory = (): Store & { data: Map<string, string> } => {
    const data = new Map<string, string>();
    return {
      data,
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => void data.set(k, v),
      removeItem: (k) => void data.delete(k),
    };
  };

  test("saves, loads and clears", () => {
    const store = memory();
    saveProgress("k", { solved: ["a"], current: "b" }, store);
    expect(loadProgress("k", store)).toEqual({ solved: ["a"], current: "b" });
    clearProgress("k", store);
    expect(loadProgress("k", store)).toEqual({ solved: [], current: undefined });
  });

  test("survives garbage and missing storage", () => {
    const store = memory();
    store.setItem("k", "{nope");
    expect(loadProgress("k", store)).toEqual({ solved: [] });
    expect(loadProgress("k", undefined)).toEqual({ solved: [], current: undefined });
  });
});
