import { sides, type StyleField } from "./model";

/** Which layout controls make sense depends on how an element lays out its children. */
export type LayoutKind = "flex" | "grid" | "block" | "inline" | "none";

/** From a computed `display` value. */
export function layoutKind(display: string): LayoutKind {
  if (display === "none") return "none";
  if (display.includes("flex")) return "flex";
  if (display.includes("grid")) return "grid";
  // `inline` has no box of its own to size or lay out; table-ish and list-item boxes do.
  if (display === "inline") return "inline";
  return "block";
}

/** Position on the 3x3 alignment grid; `null` when the value is not one of the nine. */
export type Cell = 0 | 1 | 2;
export interface Alignment {
  x: Cell | null;
  y: Cell | null;
}

const START = ["flex-start", "start", "normal", "left", "self-start"];
const END = ["flex-end", "end", "right", "self-end"];

function position(value: string): Cell | null {
  if (value === "center") return 1;
  if (START.includes(value)) return 0;
  if (END.includes(value)) return 2;
  return null;
}

const mirror = (cell: Cell | null): Cell | null => (cell === null ? null : ((2 - cell) as Cell));
const isReverse = (direction: string) => direction.endsWith("reverse");
export const isRow = (direction: string) => direction.startsWith("row");

export interface AlignmentValues {
  direction: string;
  justifyContent: string;
  alignItems: string;
  justifyItems: string;
}

/** Which cell of the grid the current CSS values select. */
export function readAlignment(kind: "flex" | "grid", v: AlignmentValues): Alignment {
  if (kind === "grid") return { x: position(v.justifyItems), y: position(v.alignItems) };
  const distributed = isDistributed(v.justifyContent);
  // `normal` is `stretch` for align-items, which is none of the nine cells.
  const cross = v.alignItems === "normal" ? null : position(v.alignItems);
  const main = distributed ? null : position(v.justifyContent);
  const fixedMain = isReverse(v.direction) ? mirror(main) : main;
  return isRow(v.direction) ? { x: fixedMain, y: cross } : { x: cross, y: fixedMain };
}

const FLEX_VALUES = ["flex-start", "center", "flex-end"] as const;
const GRID_VALUES = ["start", "center", "end"] as const;

/** CSS properties to set when the user picks a cell. */
export function writeAlignment(
  kind: "flex" | "grid",
  direction: string,
  x: Cell,
  y: Cell,
): Record<string, string> {
  if (kind === "grid") {
    return { "justify-items": GRID_VALUES[x], "align-items": GRID_VALUES[y] };
  }
  const row = isRow(direction);
  const main = FLEX_VALUES[(isReverse(direction) ? mirror(row ? x : y) : row ? x : y) as Cell];
  const cross = FLEX_VALUES[row ? y : x];
  return { "justify-content": main, "align-items": cross };
}

/** `space-between` and friends: the main axis position is decided by the free space. */
export const isDistributed = (justifyContent: string) => justifyContent.startsWith("space-");

// ---- Fields -------------------------------------------------------------------------------

const options = (...values: string[]) => ["", ...values];
const distribution = ["space-between", "space-around", "space-evenly"];
const lengths = ["auto", "100%", "fit-content", "min-content", "max-content"];

const display: StyleField = {
  prop: "display",
  label: "Exibição",
  options: options(
    "block",
    "inline",
    "inline-block",
    "flow-root",
    "flex",
    "inline-flex",
    "grid",
    "inline-grid",
    "contents",
    "none",
  ),
};

const gaps: StyleField[] = [
  {
    prop: "gap",
    label: "Espaço (gap)",
    suggestions: ["0", "4px", "8px", "16px", "24px"],
    children: [
      { prop: "row-gap", label: "Entre linhas" },
      { prop: "column-gap", label: "Entre colunas" },
    ],
  },
];

const flexContainer: StyleField[] = [
  {
    prop: "flex-direction",
    label: "Direção",
    options: options("row", "row-reverse", "column", "column-reverse"),
  },
  { prop: "flex-wrap", label: "Quebra", options: options("nowrap", "wrap", "wrap-reverse") },
  {
    prop: "justify-content",
    label: "Justificar (eixo principal)",
    options: options("flex-start", "center", "flex-end", ...distribution),
  },
  {
    prop: "align-items",
    label: "Alinhar itens (cruzado)",
    options: options("stretch", "flex-start", "center", "flex-end", "baseline"),
  },
  {
    prop: "align-content",
    label: "Alinhar linhas",
    options: options("stretch", "flex-start", "center", "flex-end", ...distribution),
  },
  ...gaps,
];

const gridContainer: StyleField[] = [
  {
    prop: "grid-template-columns",
    label: "Colunas",
    suggestions: ["none", "1fr 1fr", "repeat(3, 1fr)", "repeat(auto-fill, minmax(200px, 1fr))"],
  },
  {
    prop: "grid-template-rows",
    label: "Linhas",
    suggestions: ["none", "auto", "repeat(2, auto)", "auto 1fr auto"],
  },
  {
    prop: "grid-template-areas",
    label: "Áreas",
    suggestions: ["none", '"header header" "side main"'],
  },
  {
    prop: "grid-auto-flow",
    label: "Fluxo automático",
    options: options("row", "column", "dense", "row dense", "column dense"),
  },
  {
    prop: "grid-auto-columns",
    label: "Colunas implícitas",
    suggestions: ["auto", "1fr", "min-content", "max-content"],
  },
  {
    prop: "grid-auto-rows",
    label: "Linhas implícitas",
    suggestions: ["auto", "1fr", "min-content", "max-content"],
  },
  {
    prop: "justify-items",
    label: "Justificar itens",
    options: options("stretch", "start", "center", "end", "baseline"),
  },
  {
    prop: "align-items",
    label: "Alinhar itens",
    options: options("stretch", "start", "center", "end", "baseline"),
  },
  {
    prop: "justify-content",
    label: "Justificar trilhas",
    options: options("start", "center", "end", "stretch", ...distribution),
  },
  {
    prop: "align-content",
    label: "Alinhar trilhas",
    options: options("start", "center", "end", "stretch", ...distribution),
  },
  ...gaps,
];

const flexItem: StyleField[] = [
  {
    prop: "flex",
    label: "Flex",
    suggestions: ["0 1 auto", "1 1 0%", "1", "none"],
    children: [
      { prop: "flex-grow", label: "Crescer", suggestions: ["0", "1"] },
      { prop: "flex-shrink", label: "Encolher", suggestions: ["0", "1"] },
      { prop: "flex-basis", label: "Base", suggestions: ["auto", "0", "content", "100%"] },
    ],
  },
  {
    prop: "align-self",
    label: "Alinhar a si",
    options: options("auto", "stretch", "flex-start", "center", "flex-end", "baseline"),
  },
  { prop: "order", label: "Ordem", suggestions: ["0", "-1", "1"] },
];

const gridItem: StyleField[] = [
  {
    prop: "grid-column",
    label: "Coluna",
    suggestions: ["auto", "1 / 3", "span 2", "1 / -1"],
    children: [
      { prop: "grid-column-start", label: "Início" },
      { prop: "grid-column-end", label: "Fim" },
    ],
  },
  {
    prop: "grid-row",
    label: "Linha",
    suggestions: ["auto", "1 / 3", "span 2", "1 / -1"],
    children: [
      { prop: "grid-row-start", label: "Início" },
      { prop: "grid-row-end", label: "Fim" },
    ],
  },
  { prop: "grid-area", label: "Área" },
  {
    prop: "justify-self",
    label: "Justificar a si",
    options: options("auto", "stretch", "start", "center", "end", "baseline"),
  },
  {
    prop: "align-self",
    label: "Alinhar a si",
    options: options("auto", "stretch", "start", "center", "end", "baseline"),
  },
  { prop: "order", label: "Ordem", suggestions: ["0", "-1", "1"] },
];

const size: StyleField[] = [
  { prop: "width", label: "Largura", suggestions: lengths },
  { prop: "height", label: "Altura", suggestions: lengths },
  { prop: "min-width", label: "Largura mín.", suggestions: ["0", ...lengths] },
  { prop: "max-width", label: "Largura máx.", suggestions: ["none", ...lengths] },
  { prop: "min-height", label: "Altura mín.", suggestions: ["0", ...lengths] },
  { prop: "max-height", label: "Altura máx.", suggestions: ["none", ...lengths] },
  { prop: "aspect-ratio", label: "Proporção", suggestions: ["auto", "1 / 1", "16 / 9", "4 / 3"] },
  { prop: "box-sizing", label: "Box sizing", options: options("content-box", "border-box") },
  {
    prop: "overflow",
    label: "Overflow",
    options: options("visible", "hidden", "clip", "scroll", "auto"),
    children: [
      {
        prop: "overflow-x",
        label: "Overflow X",
        options: options("visible", "hidden", "clip", "scroll", "auto"),
      },
      {
        prop: "overflow-y",
        label: "Overflow Y",
        options: options("visible", "hidden", "clip", "scroll", "auto"),
      },
    ],
  },
];

const positionField: StyleField = {
  prop: "position",
  label: "Posição",
  options: options("static", "relative", "absolute", "fixed", "sticky"),
};
const offsets: StyleField[] = [{ prop: "inset", label: "Deslocamento", children: sides("") }];
const zIndex: StyleField = {
  prop: "z-index",
  label: "Z-index",
  suggestions: ["auto", "0", "1", "10"],
};

export interface LayoutSection {
  id: "display" | "container" | "item" | "size" | "position";
  label?: string;
  fields: StyleField[];
}

export interface LayoutContext {
  /** How the element lays out its own children. */
  kind: LayoutKind;
  /** How the parent lays out the element. */
  parent: LayoutKind;
  /** Computed `position`. */
  position: string;
}

/**
 * The fields that apply to an element, so none is shown that would have no effect: container
 * fields for flex/grid, item fields for children of a flex/grid parent, sizes for boxes that
 * have one (not `inline` or `none`), and offsets for positioned elements.
 */
export function layoutSections({ kind, parent, position: where }: LayoutContext): LayoutSection[] {
  const sections: LayoutSection[] = [{ id: "display", fields: [display] }];
  if (kind === "flex") sections.push({ id: "container", label: "Flex", fields: flexContainer });
  if (kind === "grid") sections.push({ id: "container", label: "Grid", fields: gridContainer });
  if (kind === "none") return sections;

  if (parent === "flex") sections.push({ id: "item", label: "Item do flex", fields: flexItem });
  if (parent === "grid") sections.push({ id: "item", label: "Item do grid", fields: gridItem });
  if (kind !== "inline") sections.push({ id: "size", label: "Tamanho", fields: size });

  const positioned = where !== "static";
  const stacks = positioned || parent === "flex" || parent === "grid";
  sections.push({
    id: "position",
    label: "Posição",
    fields: [positionField, ...(positioned ? offsets : []), ...(stacks ? [zIndex] : [])],
  });
  return sections;
}
