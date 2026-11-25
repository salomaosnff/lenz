import { describe, expect, test } from "vite-plus/test";
import lucide from "@iconify-json/lucide/icons.json";
import {
  LIMITS,
  createLibrary,
  renderSvg,
  safeColor,
  searchNames,
  type Icon,
  type IconSet,
} from "../src/icons";

const small: IconSet = {
  width: 24,
  height: 24,
  icons: {
    home: { body: '<path stroke-width="2" d="M0 0"/>' },
    "arrow-up": { body: '<path stroke-width="2" d="M1 1"/>' },
    "circle-arrow-up": { body: "<path/>" },
    "arrow-up-right": { body: "<path/>" },
    wide: { body: "<path/>", width: 48, height: 24 },
  },
  aliases: {
    house: { parent: "home" },
    "home-flipped": { parent: "home", hFlip: true },
    orphan: { parent: "nope" },
  },
};
const library = createLibrary(small);
const icon = (name: string): Icon => library.get(name)!;

describe("createLibrary", () => {
  test("lists the icons and the plain aliases, sorted", () => {
    expect(library.names).toEqual([
      "arrow-up",
      "arrow-up-right",
      "circle-arrow-up",
      "home",
      "house",
      "wide",
    ]);
  });

  test("an alias is the icon it points to", () => {
    expect(icon("house").body).toBe(icon("home").body);
    expect(icon("house").name).toBe("house");
  });

  test("leaves out aliases that flip or turn the icon, and the ones without a parent", () => {
    expect(library.get("home-flipped")).toBeUndefined();
    expect(library.get("orphan")).toBeUndefined();
  });

  test("an icon can have a size of its own", () => {
    expect([icon("wide").width, icon("wide").height]).toEqual([48, 24]);
    expect([icon("home").width, icon("home").height]).toEqual([24, 24]);
  });
});

describe("searchNames", () => {
  test("without a text it gives everything", () => {
    expect(searchNames(library.names, "  ")).toEqual([...library.names]);
  });

  test("puts the exact name first, then the ones that start with the text", () => {
    expect(searchNames(library.names, "home")).toEqual(["home"]);
    expect(searchNames(library.names, "arrow-up")).toEqual([
      "arrow-up",
      "arrow-up-right",
      "circle-arrow-up",
    ]);
  });

  test("a word that starts a part comes before one that is only inside it", () => {
    expect(searchNames(["xhome", "my-home", "home-2"], "home")).toEqual([
      "home-2",
      "my-home",
      "xhome",
    ]);
  });

  test("several words must all match, in any order, with a space or a hyphen", () => {
    expect(searchNames(library.names, "up arrow")).toEqual([
      "arrow-up",
      "arrow-up-right",
      "circle-arrow-up",
    ]);
    expect(searchNames(library.names, "circle up")).toEqual(["circle-arrow-up"]);
  });

  test("ignores case and finds nothing for a name that is not there", () => {
    expect(searchNames(library.names, "HOME")).toEqual(["home"]);
    expect(searchNames(library.names, "zebra")).toEqual([]);
  });
});

describe("renderSvg", () => {
  const base = { size: 24, strokeWidth: 2 };

  test("makes an inline SVG to size, hidden from screen readers by default", () => {
    const svg = renderSvg(icon("home"), base);
    expect(svg).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path stroke-width="2" d="M0 0"/></svg>',
    );
  });

  test("scales by the width and keeps the shape of a wider icon", () => {
    expect(renderSvg(icon("wide"), { ...base, size: 48 })).toContain('width="48" height="24"');
    expect(renderSvg(icon("wide"), { ...base, size: 96 })).toContain('width="96" height="48"');
  });

  test("changes the width of the line", () => {
    expect(renderSvg(icon("home"), { ...base, strokeWidth: 1.5 })).toContain('stroke-width="1.5"');
    expect(renderSvg(icon("home"), { ...base, strokeWidth: 1.5 })).not.toContain(
      'stroke-width="2"',
    );
  });

  test("keeps the limits of the size and of the line", () => {
    expect(renderSvg(icon("home"), { size: 9999, strokeWidth: 99 })).toContain(
      `width="${LIMITS.maxSize}"`,
    );
    expect(renderSvg(icon("home"), { size: 1, strokeWidth: 0 })).toContain(
      `width="${LIMITS.minSize}"`,
    );
    expect(renderSvg(icon("home"), { size: Number.NaN, strokeWidth: Number.NaN })).toContain(
      `width="${LIMITS.minSize}"`,
    );
  });

  test("a colour goes in the style, and the icon takes it through currentColor", () => {
    expect(renderSvg(icon("home"), { ...base, color: "#e63946" })).toContain(
      'style="color: #e63946"',
    );
    expect(renderSvg(icon("home"), base)).not.toContain("style=");
  });

  test("a label makes the icon something to read, and is escaped", () => {
    const svg = renderSvg(icon("home"), { ...base, label: 'Início "home" <b>' });
    expect(svg).toContain('role="img" aria-label="Início &quot;home&quot; &lt;b&gt;"');
    expect(svg).not.toContain("aria-hidden");
    expect(renderSvg(icon("home"), { ...base, label: "  " })).toContain('aria-hidden="true"');
  });
});

describe("safeColor", () => {
  test.each([
    "#fff",
    "#E63946",
    "#e6394680",
    "rgb(1, 2, 3)",
    "rgba(1 2 3 / 50%)",
    "hsl(10, 20%, 30%)",
    "tomato",
  ])("%s is accepted", (color) => expect(safeColor(color)).toBe(color));

  test.each([
    "red; background: url(x)",
    'red" onload="x',
    "url(x)",
    "var(--x)",
    "expression(1)",
    "",
    "  ",
  ])("%j is dropped", (color) => expect(safeColor(color)).toBeUndefined());
});

describe("the real set of icons", () => {
  const real = createLibrary(lucide);

  test("is big and has the usual icons", () => {
    expect(real.names.length).toBeGreaterThan(2000);
    for (const name of ["house", "heart", "star", "arrow-right", "search", "user"]) {
      expect(real.get(name), name).toBeDefined();
    }
  });

  test("every icon makes an SVG that is only shapes: no script, no event, nothing from outside", () => {
    for (const name of real.names) {
      const svg = renderSvg(real.get(name)!, { size: 24, strokeWidth: 2 });
      expect(svg, name).toMatch(/^<svg [^>]*>.*<\/svg>$/s);
      expect(svg, name).not.toMatch(
        /<script|<foreignObject|<image|<use|\son\w+=|javascript:|href=|url\(\s*["']?https?:/i,
      );
    }
  });

  test("a search finds icons by a part of the name", () => {
    expect(searchNames(real.names, "arrow").length).toBeGreaterThan(20);
    expect(searchNames(real.names, "arrow-right")[0]).toBe("arrow-right");
    expect(searchNames(real.names, "house")[0]).toBe("house");
  });
});
