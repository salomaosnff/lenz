import {
  CELL_PROPS,
  TABLE_PROPS,
  captionStyle,
  cellStyle,
  tableStyle,
  type Style,
  type TableOptions,
} from "./table";

/**
 * Editing a table that is already on the page. Nothing is rebuilt: a new row or column is an empty
 * copy of a neighbor (so it keeps its classes and style), and the cells that stay are never touched.
 * `style`, where given, is the look of the builder: the cells that change kind get it, so a header
 * made from a plain row looks like one.
 */

/** The table an element belongs to: a cell, a row, or the table itself. */
export const closestTable = (el: Element | null | undefined): HTMLTableElement | null =>
  (el?.closest("table") as HTMLTableElement | null) ?? null;

export interface CellPosition {
  /** Index among all the rows of the table (header first, footer last). */
  row: number;
  column: number;
}

/** The row and column of the cell of `table` that `el` is in (or is); `null` for the table itself. */
export function positionOf(table: HTMLTableElement, el: Element): CellPosition | null {
  const cell = el.closest("td,th") as HTMLTableCellElement | null;
  // A cell of a table nested inside a cell is not a cell of this one.
  if (!cell || cell.closest("table") !== table) return null;
  return { row: (cell.parentElement as HTMLTableRowElement).rowIndex, column: cell.cellIndex };
}

export interface TableInfo {
  rows: number;
  columns: number;
  headerRow: boolean;
  footerRow: boolean;
  headerColumn: boolean;
  caption: string;
  /** Merged cells (`colspan`, `rowspan`): editing rows and columns would break the grid. */
  hasSpans: boolean;
}

export function describeTable(table: HTMLTableElement): TableInfo {
  const rows = [...table.rows];
  const bodyRows = rows.filter(
    (r) => r.parentElement?.tagName !== "THEAD" && r.parentElement?.tagName !== "TFOOT",
  );
  const firstCell = bodyRows[0]?.cells[0];
  return {
    rows: rows.length,
    columns: Math.max(0, ...rows.map((r) => r.cells.length)),
    headerRow: !!table.tHead && table.tHead.rows.length > 0,
    footerRow: !!table.tFoot && table.tFoot.rows.length > 0,
    headerColumn: firstCell?.tagName === "TH",
    caption: table.caption?.textContent?.trim() ?? "",
    hasSpans: rows.some((r) => [...r.cells].some((c) => c.colSpan > 1 || c.rowSpan > 1)),
  };
}

const make = <K extends keyof HTMLElementTagNameMap>(like: Element, tag: K) =>
  like.ownerDocument.createElement(tag);

/** A cell of another kind with the same attributes and content, in the same place. */
function retag(cell: HTMLTableCellElement, tag: "th" | "td"): HTMLTableCellElement {
  if (cell.tagName.toLowerCase() === tag) return cell;
  const next = make(cell, tag);
  for (const attr of [...cell.attributes]) next.setAttribute(attr.name, attr.value);
  next.append(...cell.childNodes);
  cell.replaceWith(next);
  return next;
}

/** An empty cell like `cell`: same kind, class and style, but not its content or its id. */
function emptyLike(cell: HTMLTableCellElement): HTMLTableCellElement {
  const copy = cell.cloneNode(false) as HTMLTableCellElement;
  copy.removeAttribute("id");
  copy.removeAttribute("colspan");
  copy.removeAttribute("rowspan");
  return copy;
}

/** Sets the managed properties of the cell and leaves the rest of its style as it is. */
function restyle(el: HTMLElement, managed: readonly string[], style: Style) {
  for (const prop of managed) el.style.removeProperty(prop);
  for (const [prop, value] of Object.entries(style)) el.style.setProperty(prop, value);
  if (!el.getAttribute("style")) el.removeAttribute("style");
}

const section = (row: HTMLTableRowElement) => row.parentElement?.tagName ?? "";

/** Adds a row above or below row `at`. A header has no row above it, so there it returns `null`. */
export function insertRow(
  table: HTMLTableElement,
  at: number,
  where: "above" | "below",
): HTMLTableRowElement | null {
  const ref = table.rows[at];
  if (!ref) return null;
  const inHead = section(ref) === "THEAD";
  if (inHead && where === "above") return null;

  // Below a header comes a body row, so it copies the first body row, not the header.
  const template = inHead ? table.tBodies[0]?.rows[0] : ref;
  const row = make(ref, "tr");
  for (const attr of [...(template ?? ref).attributes]) row.setAttribute(attr.name, attr.value);
  row.removeAttribute("id");
  for (let i = 0; i < ref.cells.length; i++) {
    const base = template?.cells[i] ?? ref.cells[i]!;
    const cell = emptyLike(base);
    row.append(inHead && !template ? retag(cell, "td") : cell);
  }

  if (inHead) {
    const body = table.tBodies[0] ?? table.appendChild(make(table, "tbody"));
    body.prepend(row);
  } else if (where === "above") ref.before(row);
  else ref.after(row);
  return row;
}

/** Removes row `at`, and its section if that leaves it empty. The last row stays. */
export function removeRow(table: HTMLTableElement, at: number): boolean {
  const row = table.rows[at];
  if (!row || table.rows.length <= 1) return false;
  const parent = row.parentElement as HTMLTableSectionElement;
  row.remove();
  if (parent.tagName !== "TABLE" && parent.rows.length === 0) parent.remove();
  return true;
}

/** Adds a column to the left or right of column `at`, in every row. */
export function insertColumn(
  table: HTMLTableElement,
  at: number,
  where: "left" | "right",
): boolean {
  let added = false;
  for (const row of table.rows) {
    const base = row.cells[Math.min(at, row.cells.length - 1)];
    if (!base) continue;
    let cell = emptyLike(base);
    // A title of the row is not copied: the new cell is not a second title.
    if (cell.tagName === "TH" && cell.getAttribute("scope") === "row") {
      cell = retag(cell, "td");
      cell.removeAttribute("scope");
    }
    if (where === "left") base.before(cell);
    else base.after(cell);
    added = true;
  }
  return added;
}

/** Removes column `at` from every row. The last column stays. */
export function removeColumn(table: HTMLTableElement, at: number): boolean {
  const columns = Math.max(0, ...[...table.rows].map((r) => r.cells.length));
  if (columns <= 1 || at < 0 || at >= columns) return false;
  for (const row of table.rows) row.cells[at]?.remove();
  return true;
}

const asCell = (
  cell: HTMLTableCellElement,
  tag: "th" | "td",
  scope: "col" | "row" | null,
  style?: TableOptions | null,
  bodyRow: number | null = null,
) => {
  const next = retag(cell, tag);
  if (scope) next.setAttribute("scope", scope);
  else next.removeAttribute("scope");
  if (style) restyle(next, CELL_PROPS, cellStyle(tag, style, { bodyRow }));
  return next;
};

/** Turns the first row into a header (`thead`, `th scope="col"`), or the header back into a row. */
export function setHeaderRow(table: HTMLTableElement, on: boolean, style?: TableOptions | null) {
  const has = !!table.tHead && table.tHead.rows.length > 0;
  if (on === has) return;
  if (on) {
    const first = table.rows[0];
    if (!first) return;
    const head = table.createTHead();
    head.append(first);
    for (const cell of [...first.cells]) asCell(cell, "th", "col", style);
    return;
  }
  const head = table.tHead!;
  const body = table.tBodies[0] ?? table.appendChild(make(table, "tbody"));
  const rows = [...head.rows];
  body.prepend(...rows);
  head.remove();
  for (const row of rows) for (const cell of [...row.cells]) asCell(cell, "td", null, style, 0);
}

/** Makes the last row a footer (`tfoot`), or the footer back into rows. */
export function setFooterRow(table: HTMLTableElement, on: boolean, style?: TableOptions | null) {
  const has = !!table.tFoot && table.tFoot.rows.length > 0;
  if (on === has) return;
  if (on) {
    const last = table.rows[table.rows.length - 1];
    // The header row cannot also be the footer.
    if (!last || table.rows.length < 2 || section(last) === "THEAD") return;
    table.createTFoot().append(last);
    return;
  }
  const foot = table.tFoot!;
  const body = table.tBodies[table.tBodies.length - 1] ?? table.appendChild(make(table, "tbody"));
  body.append(...foot.rows);
  foot.remove();
  if (style) applyStyle(table, style);
}

/** The first cell of each row becomes a title of the row (`th scope="row"`), or a plain cell. */
export function setHeaderColumn(table: HTMLTableElement, on: boolean, style?: TableOptions | null) {
  for (const row of table.rows) {
    if (section(row) === "THEAD") continue;
    const first = row.cells[0];
    if (first) asCell(first, on ? "th" : "td", on ? "row" : null, style);
  }
}

/** Sets the caption, or removes it when the text is empty. */
export function setCaption(table: HTMLTableElement, text: string, style?: TableOptions | null) {
  const value = text.trim();
  if (!value) return table.deleteCaption();
  const caption = table.caption ?? table.createCaption();
  caption.textContent = value;
  if (style)
    restyle(caption, ["caption-side", "text-align", "padding", "font-weight"], captionStyle());
}

/** Gives the table and its cells the look of the builder. What else is in their style stays. */
export function applyStyle(table: HTMLTableElement, options: TableOptions) {
  restyle(table, TABLE_PROPS, tableStyle(options));
  let bodyRow = 0;
  for (const row of table.rows) {
    const inBody = section(row) !== "THEAD" && section(row) !== "TFOOT";
    for (const cell of row.cells) {
      const kind = cell.tagName.toLowerCase() === "th" ? "th" : "td";
      restyle(cell, CELL_PROPS, cellStyle(kind, options, { bodyRow: inBody ? bodyRow : null }));
    }
    if (inBody) bodyRow++;
  }
  if (table.caption)
    restyle(
      table.caption,
      ["caption-side", "text-align", "padding", "font-weight"],
      captionStyle(),
    );
}
