import { describe, expect, test } from "vite-plus/test";
import {
  BLOCK_FLOW,
  edgeSide,
  flowOf,
  isBefore,
  lineAt,
  nearest,
  type LayoutStyle,
} from "../src/layoutFlow";

const style = (over: Partial<LayoutStyle> = {}): LayoutStyle => ({
  display: "block",
  flexDirection: "row",
  gridTemplateColumns: "none",
  gridAutoFlow: "row",
  ...over,
});
const flex = (flexDirection: string, display = "flex") => flowOf(style({ display, flexDirection }));

const box = { left: 100, top: 50, width: 200, height: 40 };
const row = flex("row");
const column = flowOf(style());

describe("the flow of a container", () => {
  test("a flex row goes along x, a column along y, and reverse is noticed", () => {
    expect(row).toEqual({ axis: "x", reverse: false });
    expect(flex("column")).toEqual({ axis: "y", reverse: false });
    expect(flex("row-reverse", "inline-flex")).toEqual({ axis: "x", reverse: true });
    expect(flex("column-reverse")).toEqual({ axis: "y", reverse: true });
  });

  test("other containers are read from where the first two children are", () => {
    const a = { left: 0, top: 0, width: 50, height: 20 };
    expect(flowOf(style(), [a, { left: 60, top: 0, width: 50, height: 20 }]).axis).toBe("x");
    expect(flowOf(style(), [a, { left: 0, top: 30, width: 50, height: 20 }])).toEqual(BLOCK_FLOW);
    expect(flowOf(style())).toEqual(BLOCK_FLOW);
  });

  test("a grid goes along x with more than one column, and along y with one", () => {
    const grid = (over: Partial<LayoutStyle>) => flowOf(style({ display: "grid", ...over }));
    expect(grid({ gridTemplateColumns: "100px 100px 100px" }).axis).toBe("x");
    expect(grid({ gridTemplateColumns: "[a] 100px [b] 100px" }).axis).toBe("x");
    expect(grid({ gridTemplateColumns: "300px" })).toEqual(BLOCK_FLOW);
    expect(grid({ gridTemplateColumns: "none" })).toEqual(BLOCK_FLOW);
    expect(grid({ gridAutoFlow: "column dense" }).axis).toBe("x");
    expect(grid({ display: "inline-grid", gridTemplateColumns: "1px 1px" }).axis).toBe("x");
  });

  test("the box nearest the point is found, also among rows and columns", () => {
    const cells = [
      { left: 0, top: 0, width: 100, height: 50 },
      { left: 110, top: 0, width: 100, height: 50 },
      { left: 0, top: 60, width: 100, height: 50 },
      { left: 110, top: 60, width: 100, height: 50 },
    ];
    expect(nearest(cells, 150, 20)).toBe(1); // inside the second
    expect(nearest(cells, 150, 100)).toBe(3); // in the second row, not the first
    expect(nearest(cells, 105, 55)).toBe(0); // in the gap: the first of the ties
    expect(nearest([], 0, 0)).toBe(-1);
  });
});

describe("where a drop goes", () => {
  test("in a row it is decided by the horizontal position, in a column by the vertical one", () => {
    expect(isBefore(row, box, 120, 999)).toBe(true); // left half
    expect(isBefore(row, box, 280, 0)).toBe(false); // right half
    expect(isBefore(BLOCK_FLOW, box, 999, 60)).toBe(true); // upper half
    expect(isBefore(BLOCK_FLOW, box, 0, 80)).toBe(false); // lower half
  });

  test("a reversed flow has before and after the other way round", () => {
    const reversed = flex("row-reverse");
    expect(isBefore(reversed, box, 120, 0)).toBe(false); // left half is the end
    expect(isBefore(reversed, box, 280, 0)).toBe(true);
  });

  test("the edges of a container put the drop next to it, the middle inside", () => {
    expect(edgeSide(BLOCK_FLOW, box, 150, 52)).toBe("before");
    expect(edgeSide(BLOCK_FLOW, box, 150, 88)).toBe("after");
    expect(edgeSide(BLOCK_FLOW, box, 150, 70)).toBeNull();
    expect(edgeSide(row, box, 105, 70)).toBe("before");
    expect(edgeSide(flex("row-reverse"), box, 105, 70)).toBe("after");
  });
});

describe("the line that shows it", () => {
  test("is horizontal between blocks and vertical between side-by-side elements", () => {
    expect(lineAt(BLOCK_FLOW, box, "before")).toEqual({
      left: 100,
      top: 49,
      width: 200,
      height: 2,
    });
    expect(lineAt(BLOCK_FLOW, box, "after")).toEqual({ left: 100, top: 89, width: 200, height: 2 });
    expect(lineAt(column, box, "after").height).toBe(2);
    expect(lineAt(row, box, "before")).toEqual({ left: 99, top: 50, width: 2, height: 40 });
    expect(lineAt(row, box, "after")).toEqual({ left: 299, top: 50, width: 2, height: 40 });
  });

  test('in a reversed row "before" is at the right edge', () => {
    expect(lineAt(flex("row-reverse"), box, "before")).toEqual({
      left: 299,
      top: 50,
      width: 2,
      height: 40,
    });
  });
});
