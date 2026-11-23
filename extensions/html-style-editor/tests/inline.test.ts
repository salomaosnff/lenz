import { describe, expect, test } from "vite-plus/test";
import { ownValue } from "../src/inline";

const style = (cssText: string, values: Record<string, string>) => ({
  cssText,
  getPropertyValue: (prop: string) => values[prop] ?? "",
});

describe("ownValue", () => {
  test("the initial values a shorthand fills in are not the user's", () => {
    const el = style("background: rgb(244, 244, 245);", {
      "background-size": "initial",
      "background-image": "initial",
      "background-color": "rgb(244, 244, 245)",
    });
    expect(ownValue(el, "background-size")).toBe("");
    expect(ownValue(el, "background-image")).toBe("");
    expect(ownValue(el, "background-color")).toBe("rgb(244, 244, 245)");
  });

  test("an initial that is written out is kept", () => {
    const el = style("background-size: initial;", { "background-size": "initial" });
    expect(ownValue(el, "background-size")).toBe("initial");
  });

  test("other values are untouched", () => {
    const el = style("padding: 16px; background-size: cover;", { "background-size": "cover" });
    expect(ownValue(el, "background-size")).toBe("cover");
    expect(ownValue(el, "margin")).toBe("");
  });
});
