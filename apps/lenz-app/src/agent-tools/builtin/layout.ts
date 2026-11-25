import { useLayoutStore } from "../../layout/store";
import type { ViewDefinition } from "../../layout/types";
import { boolean, requiredBoolean, schema, string, text, type Tools } from "./input";

const viewId = string("The id of a view, from get_layout.");

/** A view of any panel, or why there is none. */
function viewOf(id: string): ViewDefinition {
  const view = useLayoutStore()
    .containers.flatMap((c) => c.views)
    .find((v) => v.id === id);
  if (!view) throw new Error(`There is no view "${id}". See get_layout.`);
  return view;
}

export const layoutTools: Tools = [
  {
    name: "get_layout",
    description:
      "Describes the window: the panels of the activity bar and the side bars, the views in each (and which are shown, hidden, collapsed or floating) and which panel is open.",
    readOnly: true,
    execute() {
      const layout = useLayoutStore();
      const floating = new Set(layout.floatingViews.map((v) => v.id));
      return {
        activePanel: layout.activeContainerId,
        sidebarVisible: layout.sidebarVisible,
        secondarySidebarVisible: layout.secondaryVisible,
        panels: layout.orderedContainers
          .concat(layout.containers.filter((c) => c.location === "right"))
          .map((container) => ({
            id: container.id,
            title: container.title,
            location: container.location ?? "top",
            available: layout.isContainerAvailable(container),
            views: (layout.allViewsByContainer[container.id] ?? []).map((view) => ({
              id: view.id,
              title: view.title,
              available: layout.isViewAvailable(view),
              hidden: layout.isViewHidden(view.id),
              collapsed: layout.isViewCollapsed(view.id, view.collapsed),
              floating: floating.has(view.id),
            })),
          })),
      };
    },
  },
  {
    name: "show_panel",
    description:
      "Opens a panel of the activity bar in the side bar (Explorer, Extensions, Settings, or an extension's). The panels of the right side bar are shown with set_secondary_sidebar_visible.",
    inputSchema: schema({ id: string("The id of a panel, from get_layout.") }, ["id"]),
    execute(input) {
      const layout = useLayoutStore();
      const id = text(input, "id");
      const container = layout.containers.find((c) => c.id === id);
      if (!container) throw new Error(`There is no panel "${id}". See get_layout.`);
      if (container.location === "right") {
        throw new Error("That one is in the right side bar: use set_secondary_sidebar_visible.");
      }
      layout.activeContainerId = id;
      layout.sidebarVisible = true;
      return { activePanel: id };
    },
  },
  {
    name: "set_sidebar_visible",
    description: "Shows or hides the left side bar.",
    inputSchema: schema({ visible: boolean("true to show it.") }, ["visible"]),
    execute(input) {
      const layout = useLayoutStore();
      layout.sidebarVisible = requiredBoolean(input, "visible");
      return { sidebarVisible: layout.sidebarVisible };
    },
  },
  {
    name: "set_secondary_sidebar_visible",
    description:
      "Shows or hides the right side bar (the properties of the visual editors). It only appears while one of its views is available.",
    inputSchema: schema({ visible: boolean("true to show it.") }, ["visible"]),
    execute(input) {
      const layout = useLayoutStore();
      layout.secondaryVisible = requiredBoolean(input, "visible");
      return { secondarySidebarVisible: layout.secondaryVisible };
    },
  },
  {
    name: "set_view_collapsed",
    description: "Collapses or expands a view inside its panel.",
    inputSchema: schema({ id: viewId, collapsed: boolean("true to collapse it.") }, [
      "id",
      "collapsed",
    ]),
    execute(input) {
      const layout = useLayoutStore();
      const view = viewOf(text(input, "id"));
      const collapsed = requiredBoolean(input, "collapsed");
      if (layout.isViewCollapsed(view.id, view.collapsed) !== collapsed) {
        layout.toggleView(view.id, view.collapsed);
      }
      return { id: view.id, collapsed };
    },
  },
  {
    name: "set_view_hidden",
    description: "Turns a view off, or back on, as the views menu does.",
    inputSchema: schema({ id: viewId, hidden: boolean("true to turn it off.") }, ["id", "hidden"]),
    execute(input) {
      const layout = useLayoutStore();
      const view = viewOf(text(input, "id"));
      const hidden = requiredBoolean(input, "hidden");
      if (layout.isViewHidden(view.id) !== hidden) layout.toggleViewHidden(view.id);
      return { id: view.id, hidden };
    },
  },
  {
    name: "float_view",
    description:
      "Detaches a view from its panel into a floating window (turning it on if it was off).",
    inputSchema: schema({ id: viewId }, ["id"]),
    execute(input) {
      const view = viewOf(text(input, "id"));
      useLayoutStore().floatView(view.id);
      return { id: view.id, floating: true };
    },
  },
  {
    name: "dock_view",
    description: "Puts a floating view back in its panel.",
    inputSchema: schema({ id: viewId }, ["id"]),
    execute(input) {
      const view = viewOf(text(input, "id"));
      useLayoutStore().dockView(view.id);
      return { id: view.id, floating: false };
    },
  },
  {
    name: "reset_layout",
    description:
      "Undoes the user's arrangement of the window: where views and panels were moved, which are turned off or floating, and their heights.",
    consequential: true,
    execute() {
      useLayoutStore().resetViews();
      return "The layout is back to the default.";
    },
  },
];
