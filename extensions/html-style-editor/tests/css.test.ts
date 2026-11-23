import { describe, expect, test } from "vite-plus/test";
import { cssRule, declarationsOf, selectorOf } from "../src/css";

describe("selectorOf", () => {
  test("tag, id and classes", () => {
    expect(selectorOf({ tagName: "DIV", id: "hero", classList: ["a", "b"] })).toBe("div#hero.a.b");
    expect(selectorOf({ tagName: "P", id: "", classList: [] })).toBe("p");
  });

  test("escapes what a selector cannot hold", () => {
    expect(selectorOf({ tagName: "div", id: "", classList: ["md:flex"] })).toBe("div.md\\:flex");
  });
});

describe("cssRule", () => {
  test("one declaration per line", () => {
    expect(cssRule("div", [["box-shadow", "0 1px 2px red"]])).toBe(
      "div {\n  box-shadow: 0 1px 2px red;\n}",
    );
  });

  test("says so when there is no value", () => {
    expect(cssRule("div", [["box-shadow", ""]])).toBe("div {\n  /* sem valor */\n}");
  });
});

describe("declarationsOf", () => {
  test("gradient text writes the clip and the transparent fill", () => {
    expect(declarationsOf("text-gradient", "linear-gradient(red, blue)").map(([p]) => p)).toEqual([
      "background-image",
      "background-clip",
      "-webkit-background-clip",
      "-webkit-text-fill-color",
    ]);
  });

  test("any other field is one declaration", () => {
    expect(declarationsOf("box-shadow", "0 0 red")).toEqual([["box-shadow", "0 0 red"]]);
  });
});
