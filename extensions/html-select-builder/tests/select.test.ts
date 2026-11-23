import { describe, expect, test } from "vite-plus/test";
import {
  defaultOptions,
  escapeHtml,
  group,
  normalize,
  option,
  parseLines,
  renderSelect,
  selectStyle,
  slug,
  toLines,
  withValues,
} from "../src/select";

const options = (over: Partial<ReturnType<typeof defaultOptions>> = {}) => ({
  ...defaultOptions(),
  ...over,
});
const count = (html: string, pattern: RegExp) => (html.match(pattern) ?? []).length;

describe("renderSelect", () => {
  test("a select with its options, the values, and a label that points at it", () => {
    const html = renderSelect(options({ placeholder: "" }));
    expect(html).toMatch(
      /^<div><label for="opcao"[^>]*>Escolha uma opção<\/label><select id="opcao" name="opcao"/,
    );
    expect(count(html, /<option/g)).toBe(3);
    expect(html).toContain('<option value="opcao-2">Opção 2</option>');
  });

  test("without a label it is the select alone", () => {
    const html = renderSelect(options({ label: "", placeholder: "" }));
    expect(html.startsWith("<select ")).toBe(true);
    expect(html).not.toContain("<label");
    expect(html).not.toContain("<div");
  });

  test("a placeholder is a first option that cannot be chosen, selected while nothing is", () => {
    const html = renderSelect(options());
    expect(html).toContain('<option value="" disabled selected>Selecione…</option>');
    const chosen = renderSelect(
      options({ items: [option("A", "a", { selected: true }), option("B", "b")] }),
    );
    expect(chosen).toContain('<option value="" disabled>Selecione…</option>');
    expect(chosen).toContain('<option value="a" selected>A</option>');
  });

  test("no placeholder for a multiple select", () => {
    expect(renderSelect(options({ multiple: true }))).not.toContain("Selecione");
  });

  test("only one option is selected in a single choice, all of them in a multiple one", () => {
    const items = [option("A", "a", { selected: true }), option("B", "b", { selected: true })];
    expect(count(renderSelect(options({ items, placeholder: "" })), /selected/g)).toBe(1);
    expect(count(renderSelect(options({ items, multiple: true })), / selected/g)).toBe(2);
  });

  test("groups hold the options that follow them", () => {
    const items = [
      option("Solta"),
      group("Frutas"),
      option("Maçã", "maca"),
      option("Pera", "pera"),
      group("Legumes"),
      option("Cenoura"),
    ];
    const html = renderSelect(options({ items, label: "", placeholder: "" }));
    expect(html).toContain(
      '<option>Solta</option><optgroup label="Frutas"><option value="maca">Maçã</option><option value="pera">Pera</option></optgroup><optgroup label="Legumes"><option>Cenoura</option></optgroup>',
    );
    expect(count(html, /<optgroup/g)).toBe(count(html, /<\/optgroup>/g));
  });

  test("the flags", () => {
    const html = renderSelect(
      options({ multiple: true, size: 4, required: true, disabled: true, placeholder: "" }),
    );
    expect(html).toMatch(
      /<select [^>]*\bmultiple\b[^>]*size="4"[^>]*\brequired\b[^>]*\bdisabled\b/,
    );
    expect(renderSelect(options({ size: 1 }))).not.toContain("size=");
  });

  test("everything that came from the user is escaped", () => {
    const html = renderSelect(
      options({
        label: "<b>x</b>",
        name: 'a"b',
        placeholder: "<i>",
        items: [option("<script>alert(1)</script>", '"><img src=x>'), group('"g"')],
      }),
    );
    expect(html).not.toMatch(/<script|<img|<b>|<i>/);
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain('name="a&quot;b"');
  });

  test("the style", () => {
    expect(renderSelect(options({ styled: true }))).toContain("border-radius:6px");
    const plain = renderSelect(options({ styled: false, label: "" }));
    expect(plain).not.toContain("style=");
    expect(renderSelect(options({ styled: false, fullWidth: true, label: "" }))).toContain(
      'style="width:100%;box-sizing:border-box"',
    );
    expect(selectStyle({ styled: true, fullWidth: true })).toMatchObject({
      padding: "6px 8px",
      width: "100%",
    });
  });

  test("is well formed", () => {
    const html = renderSelect(
      options({ items: [group("G"), option("A"), group("H"), option("B")] }),
    );
    for (const tag of ["div", "label", "select", "optgroup", "option"]) {
      expect(count(html, new RegExp(`<${tag}[ >]`, "g"))).toBe(
        count(html, new RegExp(`</${tag}>`, "g")),
      );
    }
  });
});

describe("normalize", () => {
  test("a label gets an id to point at, from the name", () => {
    expect(normalize(options({ id: "", name: "País de origem" })).id).toBe("pais-de-origem");
    expect(normalize(options({ id: "", name: "", label: "x" })).id).toBe("campo");
    expect(normalize(options({ id: "", label: "" })).id).toBe("");
    expect(normalize(options({ id: " meu-id " })).id).toBe("meu-id");
  });

  test("the size", () => {
    expect(normalize(options({ size: 1 })).size).toBe(0);
    expect(normalize(options({ size: 5 })).size).toBe(5);
    expect(normalize(options({ size: -3 })).size).toBe(0);
    expect(normalize(options({ multiple: true, size: 1 })).size).toBe(1);
    expect(normalize(options({ size: Number.NaN })).size).toBe(0);
  });
});

describe("values", () => {
  test("slug", () => {
    expect(slug("São Paulo — SP")).toBe("sao-paulo-sp");
    expect(slug("  ")).toBe("");
  });

  test("fills in only the values that are missing", () => {
    const items = withValues([option("Maçã"), option("Pera", "p"), group("Frutas")]);
    expect(items.map((i) => (i.kind === "option" ? i.value : "-"))).toEqual(["maca", "p", "-"]);
  });
});

describe("lines", () => {
  const text = [
    "## Frutas",
    "Maçã | maca",
    "*Pera | pera",
    "! Uva",
    "*! Kiwi | kiwi",
    "",
    "## Legumes",
    "Cenoura",
  ].join("\n");

  test("reads groups, labels, values and marks", () => {
    expect(parseLines(text)).toEqual([
      group("Frutas"),
      option("Maçã", "maca"),
      option("Pera", "pera", { selected: true }),
      option("Uva", "", { disabled: true }),
      option("Kiwi", "kiwi", { selected: true, disabled: true }),
      group("Legumes"),
      option("Cenoura"),
    ]);
  });

  test("written and read back, it is the same list", () => {
    const items = parseLines(text);
    expect(parseLines(toLines(items))).toEqual(items);
  });

  test("ignores blank lines, empty groups and Windows line ends", () => {
    expect(parseLines("A\r\n\r\n##\r\nB |")).toEqual([option("A"), option("B")]);
    expect(parseLines("")).toEqual([]);
  });

  test("escaping", () => {
    expect(escapeHtml('<&">')).toBe("&lt;&amp;&quot;&gt;");
  });
});
