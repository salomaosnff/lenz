/**
 * Which way the children of an element are laid out, so a drop (and the line that shows where it
 * will land) goes along it: a column of blocks takes a horizontal line between them, a flex row
 * takes a vertical one. Pure geometry: the editor gives it the numbers.
 */
export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Flow {
  /** `y`: one below the other. `x`: side by side. */
  axis: "x" | "y";
  /** The first child is at the end (`row-reverse`, `column-reverse`). */
  reverse: boolean;
}

export const BLOCK_FLOW: Flow = { axis: "y", reverse: false };

/** The computed style that tells how a container lays its children out. */
export interface LayoutStyle {
  display: string;
  flexDirection: string;
  gridTemplateColumns: string;
  gridAutoFlow: string;
}

/** How many tracks a computed `grid-template-columns` lists (`none` is no explicit track). */
function trackCount(columns: string) {
  if (!columns || columns === "none") return 0;
  // `repeat()`/`minmax()` come resolved, but a name list in brackets may hold spaces.
  return columns
    .replace(/\[[^\]]*\]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * The flow of a container from its CSS. A flex container says it itself (`flex-direction`); a grid
 * goes along x when it has more than one column (or fills by column) and along y when it has one;
 * any other (block, inline content) is read from where its first two children are: side by side
 * means `x`.
 */
export function flowOf(style: LayoutStyle, firstTwo?: [Box, Box]): Flow {
  const { display, flexDirection, gridTemplateColumns, gridAutoFlow } = style;
  if (display.includes("flex")) {
    return {
      axis: flexDirection.startsWith("column") ? "y" : "x",
      reverse: flexDirection.endsWith("reverse"),
    };
  }
  if (display.includes("grid")) {
    const sideBySide = trackCount(gridTemplateColumns) > 1 || gridAutoFlow.startsWith("column");
    return sideBySide ? { axis: "x", reverse: false } : BLOCK_FLOW;
  }
  if (firstTwo) {
    const [a, b] = firstTwo;
    const sameRow = b.top < a.top + a.height && a.top < b.top + b.height;
    if (sameRow && b.left >= a.left + a.width - 1) return { axis: "x", reverse: false };
  }
  return BLOCK_FLOW;
}

/**
 * The box nearest to the point (the one under it, if any): where a drop among many boxes goes,
 * also when they sit in rows and columns (a grid, a wrapping flex). Returns its index, or -1.
 */
export function nearest(boxes: readonly Box[], x: number, y: number) {
  let best = -1;
  let bestDistance = Infinity;
  boxes.forEach((box, index) => {
    const dx = Math.max(box.left - x, 0, x - (box.left + box.width));
    const dy = Math.max(box.top - y, 0, y - (box.top + box.height));
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}

const along = (flow: Flow, box: Box, x: number, y: number) =>
  flow.axis === "x"
    ? { pos: x, start: box.left, size: box.width }
    : { pos: y, start: box.top, size: box.height };

/** Whether a drop at the pointer goes before the box in the DOM: the pointer is in its first half. */
export function isBefore(flow: Flow, box: Box, x: number, y: number) {
  const { pos, start, size } = along(flow, box, x, y);
  const firstHalf = pos < start + size / 2;
  return flow.reverse ? !firstHalf : firstHalf;
}

/** Near an edge of a container: the drop goes next to it, not inside. `null` in the middle. */
export function edgeSide(
  flow: Flow,
  box: Box,
  x: number,
  y: number,
  fraction = 0.25,
): "before" | "after" | null {
  const { pos, start, size } = along(flow, box, x, y);
  const first = pos < start + size * fraction;
  const last = pos > start + size * (1 - fraction);
  if (!first && !last) return null;
  return first !== flow.reverse ? "before" : "after";
}

/** The line to draw before or after a box (in the DOM): across the flow, at the right edge. */
export function lineAt(flow: Flow, box: Box, side: "before" | "after"): Box {
  const atStart = flow.reverse ? side === "after" : side === "before";
  if (flow.axis === "y") {
    return {
      left: box.left,
      top: atStart ? box.top - 1 : box.top + box.height - 1,
      width: box.width,
      height: 2,
    };
  }
  return {
    left: atStart ? box.left - 1 : box.left + box.width - 1,
    top: box.top,
    width: 2,
    height: box.height,
  };
}
