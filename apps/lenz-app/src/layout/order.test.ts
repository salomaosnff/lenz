import { describe, expect, it } from "vite-plus/test";
import { orderContainers, withMoved } from "./order";

const c = (id: string, order?: number) => ({ id, order });
const ids = (list: { id: string }[]) => list.map((x) => x.id);

describe("orderContainers, by default", () => {
  it("goes by `order`, lower first", () => {
    expect(ids(orderContainers([c("b", 50), c("a", 0), c("c", 100)], []))).toEqual(["a", "b", "c"]);
  });

  it("without a number a panel goes after the ones numbered below 100", () => {
    expect(ids(orderContainers([c("plain"), c("explorer", 0), c("extensions", 50)], []))).toEqual([
      "explorer",
      "extensions",
      "plain",
    ]);
  });

  it("a panel numbered below the others goes above them, whatever came first", () => {
    // The app registers Extensions first and the extension adds its panel later.
    const list = [c("explorer", 0), c("extensions", 50), c("editor-html", 10), c("recordings")];
    expect(ids(orderContainers(list, []))).toEqual([
      "explorer",
      "editor-html",
      "extensions",
      "recordings",
    ]);
  });

  it("equal numbers keep the order they were registered in", () => {
    expect(ids(orderContainers([c("x"), c("y"), c("z")], []))).toEqual(["x", "y", "z"]);
  });

  it("does not change the list it is given", () => {
    const list = [c("b", 2), c("a", 1)];
    orderContainers(list, []);
    expect(ids(list)).toEqual(["b", "a"]);
  });
});

describe("orderContainers, after the user moved a panel", () => {
  const list = [c("explorer", 0), c("editor", 10), c("extensions", 50), c("recordings")];

  it("what they chose wins over the numbers", () => {
    expect(ids(orderContainers(list, ["recordings", "extensions", "editor", "explorer"]))).toEqual([
      "recordings",
      "extensions",
      "editor",
      "explorer",
    ]);
  });

  it("a panel they never saw goes where the default puts it", () => {
    const saved = ["explorer", "extensions", "editor"]; // `recordings` was not there
    expect(ids(orderContainers(list, saved))).toEqual([
      "explorer",
      "extensions",
      "editor",
      "recordings",
    ]);
    const later = [...list, c("new-one", 20)]; // between editor (10) and extensions (50) by default
    expect(ids(orderContainers(later, ["explorer", "extensions", "editor", "recordings"]))).toEqual(
      ["explorer", "new-one", "extensions", "editor", "recordings"],
    );
  });

  it("a new panel with nothing before it goes first", () => {
    expect(ids(orderContainers([c("first", -5), ...list], ["explorer", "editor"]))[0]).toBe(
      "first",
    );
  });

  it("forgets panels that are gone, and repeated ids", () => {
    expect(ids(orderContainers(list, ["gone", "editor", "editor", "explorer"]))).toEqual([
      "editor",
      "explorer",
      "extensions",
      "recordings",
    ]);
  });
});

describe("withMoved", () => {
  it("the moved ones take each other's places and the rest stay", () => {
    expect(withMoved(["a", "b", "c", "d", "e"], ["d", "b", "a"])).toEqual([
      "d",
      "b",
      "c",
      "a",
      "e",
    ]);
  });

  it("nothing moved, nothing changes", () => {
    expect(withMoved(["a", "b"], [])).toEqual(["a", "b"]);
  });
});
