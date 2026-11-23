import { describe, expect, test } from "vite-plus/test";
import { JUSTIFY, TEXT_ALIGN, nextInCycle, toggleFlex } from "../src/shortcuts";

describe("nextInCycle", () => {
  test("goes through the values and ends with none", () => {
    expect(nextInCycle(TEXT_ALIGN, "")).toBe("left");
    expect(nextInCycle(TEXT_ALIGN, "left")).toBe("center");
    expect(nextInCycle(TEXT_ALIGN, "justify")).toBe("");
  });

  test("a value outside the list starts the cycle", () => {
    expect(nextInCycle(JUSTIFY, "normal")).toBe("flex-start");
  });

  test("visits every value once before coming back", () => {
    let value = "";
    const seen: string[] = [];
    for (let i = 0; i < JUSTIFY.length; i++) seen.push((value = nextInCycle(JUSTIFY, value)));
    expect(seen).toEqual(JUSTIFY);
    expect(nextInCycle(JUSTIFY, value)).toBe("");
  });
});

describe("toggleFlex", () => {
  test("turns flex on when it is off", () => {
    expect(toggleFlex("", "block")).toBe("flex");
    expect(toggleFlex("", "grid")).toBe("flex");
  });

  test("turns off the flex written on the element by dropping it", () => {
    expect(toggleFlex("flex", "flex")).toBe("");
    expect(toggleFlex("inline-flex", "inline-flex")).toBe("");
  });

  test("overrides a flex that comes from a stylesheet", () => {
    expect(toggleFlex("", "flex")).toBe("block");
  });
});
