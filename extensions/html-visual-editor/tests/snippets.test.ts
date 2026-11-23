import { describe, expect, test } from "vite-plus/test";
import catalog from "../src/html-elements.json";
import { snippetFor } from "../src/snippets";

const elements = Object.entries(catalog.elements as Record<string, { void?: boolean }>);

describe("the snippet of every element", () => {
  test("is HTML of that tag, except the ones that cannot go in a page", () => {
    for (const [tag, def] of elements) {
      const snippet = snippetFor(tag, def.void);
      if (!snippet.insertable) {
        expect(snippet.reason, tag).toBeTruthy();
        continue;
      }
      expect(snippet.html, tag).toContain(`<${tag}`);
      // A void element is never closed.
      if (def.void) expect(snippet.html, tag).not.toContain(`</${tag}>`);
    }
  });

  test("the parts of a bigger element come inside it", () => {
    expect(snippetFor("li").html).toMatch(/^<ul>/);
    expect(snippetFor("td").html).toMatch(/^<table>/);
    expect(snippetFor("option").html).toMatch(/^<select>/);
    expect(snippetFor("summary").html).toMatch(/^<details>/);
  });

  test("the ones of the head and of framesets are refused, with the reason", () => {
    for (const tag of ["html", "head", "body", "title", "meta", "base", "frameset"]) {
      expect(snippetFor(tag).insertable, tag).toBe(false);
    }
  });

  test("the others have text to show", () => {
    expect(snippetFor("strong").html).toBe("<strong>Texto</strong>");
    expect(snippetFor("h3").html).toBe("<h3>Título</h3>");
  });
});
