import { beforeEach, describe, expect, it } from "vite-plus/test";
import { createPinia, setActivePinia } from "pinia";
import { useLayoutStore } from "./store";

function setup() {
  localStorage.clear();
  setActivePinia(createPinia());
  const layout = useLayoutStore();
  layout.registerContainer({
    id: "panel",
    title: "Painel",
    icon: "lucide:box",
    views: [
      { id: "one", title: "Um" },
      { id: "two", title: "Dois" },
    ],
  });
  return layout;
}
const inPanel = (layout: ReturnType<typeof setup>) =>
  layout.viewsByContainer.panel!.map((v) => v.id);
const windows = (layout: ReturnType<typeof setup>) => layout.floatingViews.map((v) => v.id);

beforeEach(() => {
  // useStorage reads localStorage: a fresh one for each test
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  } as Storage;
});

describe("a view opened as a window from its panel", () => {
  it("leaves the panel while it is a window", () => {
    const layout = setup();
    layout.floatView("one");
    expect(windows(layout)).toEqual(["one"]);
    expect(inPanel(layout)).toEqual(["two"]);
  });

  it("closing the window puts it back in the panel, and it is not turned off", () => {
    const layout = setup();
    layout.floatView("one");
    layout.closeFloatingView("one");
    expect(windows(layout)).toEqual([]);
    expect(inPanel(layout)).toEqual(["one", "two"]);
    expect(layout.isViewHidden("one")).toBe(false);
  });

  it("closing twice changes nothing more", () => {
    const layout = setup();
    layout.floatView("one");
    layout.closeFloatingView("one");
    layout.closeFloatingView("one");
    expect(inPanel(layout)).toEqual(["one", "two"]);
    expect(layout.isViewHidden("one")).toBe(false);
  });
});

describe("a view that was turned off and opened as a window", () => {
  it("shows as a window, no longer off", () => {
    const layout = setup();
    layout.toggleViewHidden("one");
    layout.floatView("one");
    expect(windows(layout)).toEqual(["one"]);
    expect(layout.isViewHidden("one")).toBe(false);
  });

  it("closing the window turns it off again: it did not come from the panel", () => {
    const layout = setup();
    layout.toggleViewHidden("one");
    layout.floatView("one");
    layout.closeFloatingView("one");
    expect(windows(layout)).toEqual([]);
    expect(inPanel(layout)).toEqual(["two"]);
    expect(layout.isViewHidden("one")).toBe(true);
  });

  it("turned on again from the menu, it comes back to the panel as any other", () => {
    const layout = setup();
    layout.toggleViewHidden("one");
    layout.floatView("one");
    layout.closeFloatingView("one");
    layout.toggleViewHidden("one"); // the views menu
    expect(inPanel(layout)).toEqual(["one", "two"]);
    layout.floatView("one");
    layout.closeFloatingView("one");
    expect(inPanel(layout)).toEqual(["one", "two"]); // now it does come from the panel
    expect(layout.isViewHidden("one")).toBe(false);
  });

  it("docking it puts it in the panel and forgets that it was off", () => {
    const layout = setup();
    layout.toggleViewHidden("one");
    layout.floatView("one");
    layout.dockView("one");
    expect(inPanel(layout)).toEqual(["one", "two"]);
    layout.floatView("one");
    layout.closeFloatingView("one");
    expect(inPanel(layout)).toEqual(["one", "two"]);
  });

  it("resetting the views forgets it too", () => {
    const layout = setup();
    layout.toggleViewHidden("one");
    layout.floatView("one");
    layout.resetViews();
    layout.floatView("one");
    layout.closeFloatingView("one");
    expect(layout.isViewHidden("one")).toBe(false);
    expect(inPanel(layout)).toEqual(["one", "two"]);
  });
});

describe("the order of the activity bar", () => {
  function withPanels() {
    const layout = setup();
    layout.registerContainer({ id: "a", title: "A", icon: "i", order: 0, views: [] });
    layout.registerContainer({ id: "c", title: "C", icon: "i", order: 50, views: [] });
    layout.registerContainer({ id: "b", title: "B", icon: "i", order: 10, views: [] }); // comes later, goes before C
    return layout;
  }
  const order = (layout: ReturnType<typeof setup>) => layout.orderedContainers.map((c) => c.id);

  it("is by default the `order` of each panel, wherever it was registered", () => {
    expect(order(withPanels())).toEqual(["a", "b", "c", "panel"]);
  });

  it("the user moves a panel and that order is kept", () => {
    const layout = withPanels();
    layout.setActivityOrder(["c", "a", "b", "panel"]);
    expect(order(layout)).toEqual(["c", "a", "b", "panel"]);
    // That it is saved in the browser (`lenz:layout:activity-order`) is not seen here: the test
    // runs without a `window`, where the storage only keeps values in memory. It was checked in the app.
  });

  it("moving some panels leaves the others where they were", () => {
    const layout = withPanels();
    layout.setActivityOrder(["b", "a"]); // only these two swap
    expect(order(layout)).toEqual(["b", "a", "c", "panel"]);
  });

  it("a panel added later goes where the default puts it, not in the middle of the user's order", () => {
    const layout = withPanels();
    layout.setActivityOrder(["c", "panel", "a", "b"]);
    layout.registerContainer({ id: "late", title: "L", icon: "i", views: [] }); // default order: last
    expect(order(layout)).toEqual(["c", "panel", "a", "b", "late"]);
  });

  it("restoring the layout goes back to the default order", () => {
    const layout = withPanels();
    layout.setActivityOrder(["c", "b", "a", "panel"]);
    layout.resetViews();
    expect(order(layout)).toEqual(["a", "b", "c", "panel"]);
  });
});
