import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { parseManifest } from "lenz-sdk";
import { replaceCssUrls } from "../src/agent/css-urls";
import { splitDeclarations } from "../src/agent/declarations";
import { createIdRegistry } from "../src/agent/ids";
import {
  checkAttribute,
  checkAttributeName,
  checkMedia,
  checkProperty,
  checkSelector,
  checkTag,
  checkValue,
  checkWidths,
  splitImportant,
  toKebab,
} from "../src/agent/safety";
import { implementations } from "../src/agent/tools";

describe("what an agent may put in the page", () => {
  it("accepts real tags and refuses the ones that run code", () => {
    expect(checkTag(" Section ")).toBe("section");
    expect(checkTag("my-widget")).toBe("my-widget");
    for (const bad of ["script", "SCRIPT", "base", "object", "embed"]) {
      expect(() => checkTag(bad)).toThrow(/cannot be added/);
    }
    for (const bad of ["", "1a", "a b", "a>", "a-", "-a"]) {
      expect(() => checkTag(bad)).toThrow(/not a valid tag/);
    }
  });

  it("refuses event handlers, srcdoc and addresses that run code, however they are written", () => {
    checkAttribute("href", "#about");
    checkAttribute("href", "https://example.com/a?b=javascript:1");
    checkAttribute("data-onclick", "x");
    checkAttribute("class", "card");
    expect(() => checkAttribute("onclick", "x()")).toThrow(/event handler/);
    expect(() => checkAttribute("OnError", "x()")).toThrow(/event handler/);
    expect(() => checkAttribute("srcdoc", "<p>")).toThrow(/srcdoc/);
    for (const href of [
      "javascript:alert(1)",
      " JavaScript:alert(1)",
      "java\nscript:alert(1)",
      "vb\tscript:x",
    ]) {
      expect(() => checkAttribute("href", href)).toThrow(/would run code/);
    }
    expect(() => checkAttribute("src", "javascript:1")).toThrow(/would run code/);
    expect(() => checkAttribute("bad name", "x")).toThrow(/not a valid attribute name/);
  });

  it("lets an event handler be taken away, but not given", () => {
    expect(() => checkAttributeName("onclick")).not.toThrow();
    expect(() => checkAttributeName("on click")).toThrow();
  });

  it("reads CSS properties written either way", () => {
    expect(toKebab("backgroundColor")).toBe("background-color");
    expect(toKebab("cssFloat")).toBe("float");
    expect(toKebab("--Brand-Color")).toBe("--Brand-Color");
    expect(checkProperty("borderTopLeftRadius")).toBe("border-top-left-radius");
    expect(checkProperty("-webkit-line-clamp")).toBe("-webkit-line-clamp");
    expect(() => checkProperty("color: red")).toThrow(/not a CSS property/);
    expect(() => checkProperty("")).toThrow();
  });

  it("splits !important from a value", () => {
    expect(splitImportant("red !important")).toEqual({ value: "red", priority: "important" });
    expect(splitImportant("red ! IMPORTANT ")).toEqual({ value: "red", priority: "important" });
    expect(splitImportant("1px solid red")).toEqual({ value: "1px solid red", priority: "" });
  });

  it("keeps a value to one value", () => {
    checkValue("background", 'url("data:image/png;base64,AAA") no-repeat');
    checkValue("content", '"a;b"');
    expect(() => checkValue("color", "red; background: blue")).toThrow(/single CSS value/);
    expect(() => checkValue("color", "red } body { x: y")).toThrow(/single CSS value/);
    expect(() => checkValue("width", "expression(alert(1))")).toThrow(/not allowed/);
    expect(() => checkValue("background", "url(javascript:alert(1))")).toThrow(/not allowed/);
  });

  it("keeps a selector to one rule, and a media query to one condition", () => {
    for (const ok of [
      ".card:hover",
      "nav > a",
      "a:not(.b)",
      "a, b",
      "[data-x='1;2']",
      "li::before",
      "*",
    ]) {
      expect(checkSelector(ok)).toBe(ok);
    }
    for (const bad of ["", "a{}b", "a;b", "@media x", "a<b"]) {
      expect(() => checkSelector(bad)).toThrow();
    }
    expect(checkMedia("(max-width: 600px)")).toBe("(max-width: 600px)");
    expect(checkMedia("@media (min-width: 1px)")).toBe("(min-width: 1px)");
    expect(() => checkMedia("x { y: z }")).toThrow(/not a media query/);
  });

  it("limits the widths of a screenshot", () => {
    expect(checkWidths(undefined, [1280, 375])).toEqual([1280, 375]);
    expect(checkWidths([375, 375, 768], [])).toEqual([375, 768]);
    for (const bad of [[], [50], [4000], [1.5], ["a"], [200, 300, 400, 500, 600], "375"]) {
      expect(() => checkWidths(bad, [])).toThrow();
    }
  });
});

describe("the declarations of a block of CSS", () => {
  it("are read in order, with shorthands as written", () => {
    expect(splitDeclarations("padding: 16px; color: red !important; margin: 0 auto;")).toEqual({
      padding: "16px",
      color: "red !important",
      margin: "0 auto",
    });
  });

  it("do not end at a semicolon inside a url or a string", () => {
    expect(
      splitDeclarations(
        `background: url("data:image/png;base64,AAA") no-repeat; content: "a;b"; --x: url(x;y);`,
      ),
    ).toEqual({
      background: 'url("data:image/png;base64,AAA") no-repeat',
      content: '"a;b"',
      "--x": "url(x;y)",
    });
  });

  it("are empty for nothing", () => {
    expect(splitDeclarations("")).toEqual({});
    expect(splitDeclarations(" ; ;")).toEqual({});
  });
});

describe("the ids of the elements", () => {
  it("are given once, and find the element again", () => {
    const ids = createIdRegistry<object>("e");
    const a = {};
    const b = {};
    expect(ids.idOf(a)).toBe("e1");
    expect(ids.idOf(b)).toBe("e2");
    expect(ids.idOf(a)).toBe("e1");
    expect(ids.find("e2")).toBe(b);
    expect(ids.find("e9")).toBeUndefined();
  });

  it("tell their own kind of text from a selector", () => {
    const ids = createIdRegistry<object>("e");
    expect(ids.isId("e12")).toBe(true);
    for (const text of ["e", "e1a", "div", "#e1", ".e1", "E1"]) expect(ids.isId(text)).toBe(false);
  });
});

describe("the addresses in a stylesheet", () => {
  it("are replaced by what is made of them, and the ones with nothing made stay", async () => {
    const asked: string[] = [];
    const css = await replaceCssUrls(
      `a{background:url(a.png)} b{background:url( "b.png" )} c{background:url('a.png')} d{background:url(data:x/y;base64,Z)} e{background:url(none.png)}`,
      async (url) => {
        asked.push(url);
        return url === "none.png" ? undefined : `data:${url}`;
      },
    );
    expect(css).toBe(
      `a{background:url("data:a.png")} b{background:url("data:b.png")} c{background:url('data:a.png')} d{background:url(data:x/y;base64,Z)} e{background:url(none.png)}`,
    );
    expect(asked.sort()).toEqual(["a.png", "b.png", "none.png"]); // each once; data: never
  });
});

describe("the tools of the visual editor", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  ) as {
    name: string;
    version: string;
    contributes: {
      tools: { name: string; inputSchema: { properties: object; required?: string[] } }[];
    };
  };
  const declared = manifest.contributes.tools;

  it("are the ones that are implemented: no declaration without code, and no code without declaration", () => {
    expect(declared.map((t) => t.name).sort()).toEqual(Object.keys(implementations).sort());
  });

  it("answer about the catalog of tags without a page", () => {
    const reference = implementations.get_tag_reference!({ tag: "a" }) as {
      known: boolean;
      attributes: { name: string }[];
    };
    expect(reference.known).toBe(true);
    expect(reference.attributes.map((a) => a.name)).toContain("href");
    expect(implementations.get_tag_reference!({ tag: "my-widget" })).toMatchObject({
      known: false,
    });
    expect(implementations.get_tag_reference!({ tag: "zzz" })).toEqual({
      tag: "zzz",
      known: false,
    });
    expect(implementations.list_builders!({})).toEqual({ builders: [] });
    expect(() => implementations.open_builder!({ id: "x" })).toThrow(/no builder/);
  });

  it("are declared in a way the app accepts, and each schema asks only for what it has", () => {
    const parsed = parseManifest({
      name: manifest.name,
      version: manifest.version,
      main: "index.js",
      contributes: { tools: declared },
    });
    expect(parsed.contributes?.tools).toHaveLength(declared.length);
    for (const tool of declared) {
      for (const key of tool.inputSchema.required ?? []) {
        expect(Object.keys(tool.inputSchema.properties)).toContain(key);
      }
    }
  });

  it("say what is wrong when no page is open, instead of failing obscurely", async () => {
    const input = { target: "e1", to: "e1", text: "x", attributes: {}, styles: {}, selector: "a" };
    // These do not look at the page: the catalog of tags, and the builders of other extensions.
    const withoutPage = ["get_tag_reference", "list_builders", "open_builder"];
    for (const [name, run] of Object.entries(implementations)) {
      if (withoutPage.includes(name)) continue;
      // Some throw and some reject (the screenshot is async): both come out the same here.
      await expect((async () => run(input))(), name).rejects.toThrow(/No page is open/);
    }
  });
});
