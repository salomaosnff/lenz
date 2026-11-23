import { describe, expect, test } from "vite-plus/test";
import {
  LIMITS,
  cellStyle,
  defaultOptions,
  escapeHtml,
  normalize,
  renderTable,
  tableStyle,
} from "../src/table";

const options = (over: Partial<ReturnType<typeof defaultOptions>> = {}) => ({
  ...defaultOptions(),
  ...over,
});
const count = (html: string, pattern: RegExp) => (html.match(pattern) ?? []).length;

describe("renderTable", () => {
  test("rows and columns, with the header as the first row", () => {
    const html = renderTable(options({ rows: 4, columns: 3 }));
    expect(count(html, /<tr>/g)).toBe(4);
    expect(count(html, /<th /g)).toBe(3); // only the header row has th
    expect(count(html, /<td /g)).toBe(9);
    expect(html).toMatch(/<thead><tr><th scope="col"[^>]*>Coluna 1<\/th>/);
    expect(html).not.toContain("<tfoot");
  });

  test("without a header, every cell is a td", () => {
    const html = renderTable(options({ headerRow: false, rows: 2, columns: 2 }));
    expect(html).not.toContain("<thead");
    expect(count(html, /<th /g)).toBe(0);
    expect(count(html, /<td /g)).toBe(4);
  });

  test("a header column makes the first cell of each row a th with scope row", () => {
    const html = renderTable(options({ headerColumn: true, rows: 3, columns: 2 }));
    expect(count(html, /<th scope="row"/g)).toBe(2); // the two body rows
    expect(count(html, /<th scope="col"/g)).toBe(2);
  });

  test("a footer is the last row, in tfoot", () => {
    const html = renderTable(options({ footerRow: true, rows: 4, columns: 2 }));
    expect(html).toMatch(/<tfoot><tr>.*<\/tr><\/tfoot><\/table>$/);
    expect(count(html, /<tr>/g)).toBe(4);
    expect(count(html.slice(html.indexOf("<tbody>"), html.indexOf("</tbody>")), /<tr>/g)).toBe(2);
  });

  test("a caption is the first child, and is escaped", () => {
    const html = renderTable(options({ caption: 'Vendas <2024> & "metas"' }));
    expect(html).toMatch(
      /<table[^>]*><caption[^>]*>Vendas &lt;2024&gt; &amp; &quot;metas&quot;<\/caption><thead>/,
    );
    expect(html).not.toContain("<2024>");
  });

  test("no markup gets in from the options", () => {
    const html = renderTable(options({ caption: "<script>alert(1)</script>" }));
    expect(html).not.toContain("<script");
  });

  test("borders", () => {
    expect(renderTable(options({ borders: "grid" }))).toContain("border:1px solid #d4d4d8");
    const rows = renderTable(options({ borders: "rows" }));
    expect(rows).toContain("border-bottom:1px solid #d4d4d8");
    expect(rows).not.toContain(";border:1px");
    const none = renderTable(options({ borders: "none" }));
    expect(none).not.toMatch(/border:1px|border-bottom:1px/);
  });

  test("stripes shade every other body row, not the header", () => {
    const html = renderTable(options({ striped: true, rows: 5, columns: 1 }));
    const shaded = count(html, /<td [^>]*background:#fafafa/g);
    expect(shaded).toBe(2); // body rows 2 and 4 of 4
    expect(html).toMatch(/<th [^>]*background:#f4f4f5/);
  });

  test("width and padding", () => {
    expect(renderTable(options({ fullWidth: true }))).toContain("width:100%");
    expect(renderTable(options({ fullWidth: false }))).toContain("width:auto");
    expect(renderTable(options({ compact: true }))).toContain("padding:4px 8px");
    expect(renderTable(options({ compact: false }))).toContain("padding:8px 12px");
  });

  test("is one well-formed table", () => {
    const html = renderTable(
      options({ rows: 6, columns: 5, headerColumn: true, footerRow: true, caption: "x" }),
    );
    for (const tag of ["table", "thead", "tbody", "tfoot", "caption", "tr"]) {
      expect(count(html, new RegExp(`<${tag}[ >]`, "g"))).toBe(
        count(html, new RegExp(`</${tag}>`, "g")),
      );
    }
  });
});

describe("normalize", () => {
  test("keeps the size inside what the builder makes", () => {
    expect(normalize(options({ rows: 0, columns: 99 }))).toMatchObject({
      rows: LIMITS.rows.min,
      columns: LIMITS.columns.max,
    });
    expect(normalize(options({ rows: 500, columns: -3 }))).toMatchObject({
      rows: LIMITS.rows.max,
      columns: LIMITS.columns.min,
    });
    expect(normalize(options({ rows: 2.6, columns: Number.NaN }))).toMatchObject({
      rows: 3,
      columns: LIMITS.columns.min,
    });
  });

  test("a footer needs a row of its own", () => {
    expect(normalize(options({ rows: 1, footerRow: true })).footerRow).toBe(false);
    expect(normalize(options({ rows: 2, headerRow: true, footerRow: true })).footerRow).toBe(false); // header + footer, no body
    expect(normalize(options({ rows: 3, headerRow: true, footerRow: true })).footerRow).toBe(true);
    expect(normalize(options({ rows: 2, headerRow: false, footerRow: true })).footerRow).toBe(true);
  });

  test("trims the caption", () => {
    expect(normalize(options({ caption: "  título  " })).caption).toBe("título");
  });
});

describe("styles", () => {
  test("the table style follows the width", () => {
    expect(tableStyle(options({ fullWidth: true }))).toEqual({
      "border-collapse": "collapse",
      width: "100%",
    });
  });

  test("a th is always shaded and bold; a td only when striped", () => {
    expect(cellStyle("th", options(), { bodyRow: null })).toMatchObject({
      background: "#f4f4f5",
      "font-weight": "600",
    });
    expect(cellStyle("td", options(), { bodyRow: 1 }).background).toBeUndefined();
    expect(cellStyle("td", options({ striped: true }), { bodyRow: 1 }).background).toBe("#fafafa");
    expect(cellStyle("td", options({ striped: true }), { bodyRow: 0 }).background).toBeUndefined();
  });

  test("escaping", () => {
    expect(escapeHtml(`<a href="x">&</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
  });
});
