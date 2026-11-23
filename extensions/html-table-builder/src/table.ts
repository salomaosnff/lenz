/** How the borders of the table are drawn. */
export type Borders = "none" | "grid" | "rows";

/** What the builder offers; the same options shape a new table and restyle an existing one. */
export interface TableOptions {
  /** Rows in all, the header and the footer included. */
  rows: number;
  columns: number;
  /** The first row holds the titles of the columns (`thead`, `th scope="col"`). */
  headerRow: boolean;
  /** The first cell of each row holds its title (`th scope="row"`). */
  headerColumn: boolean;
  /** The last row is a footer (`tfoot`). */
  footerRow: boolean;
  caption: string;
  borders: Borders;
  /** Every other body row is shaded. */
  striped: boolean;
  /** Less padding in the cells. */
  compact: boolean;
  /** The table takes the whole width. */
  fullWidth: boolean;
}

export const LIMITS = { rows: { min: 1, max: 50 }, columns: { min: 1, max: 20 } } as const;

export const defaultOptions = (): TableOptions => ({
  rows: 3,
  columns: 3,
  headerRow: true,
  headerColumn: false,
  footerRow: false,
  caption: "",
  borders: "grid",
  striped: false,
  compact: false,
  fullWidth: true,
});

const clamp = (value: number, { min, max }: { min: number; max: number }) =>
  Math.min(max, Math.max(min, Math.round(Number.isFinite(value) ? value : min)));

/** The options kept inside what the builder can make. */
export function normalize(options: TableOptions): TableOptions {
  const rows = clamp(options.rows, LIMITS.rows);
  return {
    ...options,
    rows,
    columns: clamp(options.columns, LIMITS.columns),
    // A header and a footer in a table of one row would be the same row twice.
    footerRow: options.footerRow && rows > 1 && !(options.headerRow && rows < 3),
    caption: options.caption.trim(),
  };
}

export const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const LINE = "1px solid #d4d4d8";
const HEADER_BG = "#f4f4f5";
const STRIPE_BG = "#fafafa";

/** The style properties the builder manages on a cell; everything else of the cell is left alone. */
export const CELL_PROPS = [
  "padding",
  "border",
  "border-bottom",
  "background",
  "font-weight",
  "text-align",
] as const;
/** The same for the table itself. */
export const TABLE_PROPS = ["border-collapse", "width"] as const;

export type Style = Record<string, string>;

export function tableStyle(options: TableOptions): Style {
  return { "border-collapse": "collapse", width: options.fullWidth ? "100%" : "auto" };
}

/**
 * The style of one cell. `bodyRow` is the position among the rows that are not header or footer
 * (0 is the first), which is what the stripes follow.
 */
export function cellStyle(
  kind: "th" | "td",
  options: TableOptions,
  placement: { bodyRow: number | null },
): Style {
  const style: Style = { padding: options.compact ? "4px 8px" : "8px 12px" };
  if (options.borders === "grid") style.border = LINE;
  else if (options.borders === "rows") style["border-bottom"] = LINE;
  if (kind === "th") {
    style.background = HEADER_BG;
    style["font-weight"] = "600";
    style["text-align"] = "left";
  } else if (options.striped && placement.bodyRow !== null && placement.bodyRow % 2 === 1) {
    style.background = STRIPE_BG;
  }
  return style;
}

export const captionStyle = (): Style => ({
  "caption-side": "top",
  "text-align": "left",
  padding: "8px 0",
  "font-weight": "600",
});

export const styleText = (style: Style) =>
  Object.entries(style)
    .map(([prop, value]) => `${prop}:${value}`)
    .join(";");

/**
 * The HTML of a new table. Cells have example text, so the table can be seen and its cells can be
 * clicked. Everything that came from the user is escaped.
 */
export function renderTable(input: TableOptions): string {
  const o = normalize(input);
  const hasHead = o.headerRow;
  const hasFoot = o.footerRow;
  const bodyRows = o.rows - (hasHead ? 1 : 0) - (hasFoot ? 1 : 0);

  const cell = (
    kind: "th" | "td",
    text: string,
    scope: "col" | "row" | null,
    bodyRow: number | null,
  ) =>
    `<${kind}${scope ? ` scope="${scope}"` : ""} style="${styleText(cellStyle(kind, o, { bodyRow }))}">${escapeHtml(text)}</${kind}>`;

  const row = (index: number, section: "head" | "body" | "foot", bodyRow: number | null) => {
    const cells: string[] = [];
    for (let c = 0; c < o.columns; c++) {
      if (section === "head") cells.push(cell("th", `Coluna ${c + 1}`, "col", null));
      else if (c === 0 && o.headerColumn)
        cells.push(cell("th", section === "foot" ? "Total" : `Linha ${index + 1}`, "row", bodyRow));
      else cells.push(cell("td", section === "foot" ? "" : "Célula", null, bodyRow));
    }
    return `<tr>${cells.join("")}</tr>`;
  };

  const parts: string[] = [];
  if (o.caption)
    parts.push(`<caption style="${styleText(captionStyle())}">${escapeHtml(o.caption)}</caption>`);
  if (hasHead) parts.push(`<thead>${row(0, "head", null)}</thead>`);
  const body: string[] = [];
  for (let i = 0; i < bodyRows; i++) body.push(row(i + (hasHead ? 1 : 0), "body", i));
  parts.push(`<tbody>${body.join("")}</tbody>`);
  if (hasFoot) parts.push(`<tfoot>${row(o.rows - 1, "foot", null)}</tfoot>`);
  return `<table style="${styleText(tableStyle(o))}">${parts.join("")}</table>`;
}
