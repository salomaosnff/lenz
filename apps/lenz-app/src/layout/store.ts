import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useStorage } from "@vueuse/core";
import { matchesWhen } from "../context";
import { getViewProvider } from "../providers";
import { orderContainers, withMoved } from "./order";
import type { ViewContainer, ViewDefinition } from "./types";

export const useLayoutStore = defineStore("layout", () => {
  const containers = ref<ViewContainer[]>([]);
  const activeContainerId = useStorage<string | null>("lenz:layout:active", null);
  const sidebarVisible = useStorage("lenz:layout:sidebar-visible", true);
  const sidebarWidth = useStorage("lenz:layout:sidebar-width", 260);
  const secondaryVisible = useStorage("lenz:layout:secondary-visible", true);
  const secondaryWidth = useStorage("lenz:layout:secondary-width", 280);
  /** containerId -> ordered view ids. `null` until the user moves a view. */
  const placement = useStorage<Record<string, string[]> | null>("lenz:layout:placement", null);
  /** Ids of views detached into floating windows. */
  const floating = useStorage<string[]>("lenz:layout:floating", []);
  /** Ids of views the user turned off from the views menu. */
  const hidden = useStorage<string[]>("lenz:layout:hidden", []);
  /** Floating views that were turned off when they were opened as a window: closing turns them off again. */
  const floatedFromOff = useStorage<string[]>("lenz:layout:floated-from-off", []);
  /** View id -> body height in px. Views without an entry share the free space. */
  const viewHeights = useStorage<Record<string, number>>("lenz:layout:view-heights", {});
  const collapsedViews = useStorage<Record<string, boolean>>("lenz:layout:collapsed-views", {});
  /** Ids of the panels in the order the user gave them in the activity bar; empty until they move one. */
  const activityOrder = useStorage<string[]>("lenz:layout:activity-order", []);

  /** The panels in the order of the activity bar: the user's order, or the default one (`order`). */
  const orderedContainers = computed(() => orderContainers(containers.value, activityOrder.value));

  /**
   * The user moved some panels of the activity bar: `ids` is their new order. Each takes the place of
   * one of them, so the panels that were not moved (the other group, the hidden ones) stay put.
   */
  function setActivityOrder(ids: string[]) {
    activityOrder.value = withMoved(
      orderedContainers.value.map((c) => c.id),
      ids,
    );
  }

  /** A view is available when both its own `when` and its provider's `when` hold. */
  const isViewAvailable = (view: ViewDefinition) =>
    matchesWhen(view.when) && matchesWhen(getViewProvider(view.id)?.when);

  const activeContainer = computed(() => {
    const container = containers.value.find((c) => c.id === activeContainerId.value);
    return container && isContainerAvailable(container) ? container : undefined;
  });

  /** A container with views is only available while at least one of them is. */
  function isContainerAvailable(container: ViewContainer) {
    return !container.views.length || container.views.some(isViewAvailable);
  }

  function registerContainer(container: ViewContainer) {
    containers.value = [...containers.value.filter((c) => c.id !== container.id), container];
    if (!activeContainer.value && (container.location ?? "top") === "top") {
      activeContainerId.value = container.id;
    }
  }

  /** Same behaviour as VSCode: clicking the active icon toggles the side bar. */
  function toggleContainer(id: string) {
    if (activeContainerId.value === id && sidebarVisible.value) {
      sidebarVisible.value = false;
    } else {
      activeContainerId.value = id;
      sidebarVisible.value = true;
    }
  }

  function toggleSecondary() {
    secondaryVisible.value = !secondaryVisible.value;
  }

  function setSecondaryWidth(width: number) {
    secondaryWidth.value = Math.min(Math.max(width, 200), 600);
  }

  /** Removes a container (and with it its views), e.g. when the extension that added it goes. */
  function unregisterContainer(id: string) {
    containers.value = containers.value.filter((c) => c.id !== id);
    if (activeContainerId.value === id) {
      activeContainerId.value =
        containers.value.find((c) => (c.location ?? "top") === "top")?.id ?? null;
    }
  }

  /** Adds a view to a container, e.g. from an extension. Returns a function that removes it. */
  function registerView(containerId: string, view: ViewDefinition) {
    const container = containers.value.find((c) => c.id === containerId);
    if (!container) throw new Error(`There is no view container "${containerId}".`);
    if (containers.value.some((c) => c.views.some((v) => v.id === view.id))) {
      throw new Error(`A view with id "${view.id}" already exists.`);
    }
    // Views of the right side bar start closed, unless they ask otherwise.
    if (container.location === "right") view = { ...view, collapsed: view.collapsed ?? true };
    const added = view;
    containers.value = containers.value.map((c) =>
      c.id === containerId ? { ...c, views: [...c.views, added] } : c,
    );
    return () => {
      containers.value = containers.value.map((c) => ({
        ...c,
        // Reading through the ref gives proxies, so compare by id, not by identity.
        views: c.views.filter((v) => v.id !== added.id),
      }));
    };
  }

  function toggleSidebar() {
    sidebarVisible.value = !sidebarVisible.value;
  }

  function setSidebarWidth(width: number) {
    sidebarWidth.value = Math.min(Math.max(width, 170), 600);
  }

  /**
   * Views currently shown in each container. Starts from each container's own
   * `views`, then applies the user's moves. Unknown ids in the saved layout are
   * ignored and newly registered views fall back to their home container.
   * View ids must be unique across containers.
   */
  const allViewsByContainer = computed(() => {
    const known = new Map<string, ViewDefinition>();
    for (const c of containers.value) for (const v of c.views) known.set(v.id, v);

    const result: Record<string, ViewDefinition[]> = {};
    const placed = new Set<string>();
    for (const c of containers.value) result[c.id] = [];

    for (const [containerId, ids] of Object.entries(placement.value ?? {})) {
      const list = result[containerId];
      if (!list) continue;
      for (const id of ids) {
        const view = known.get(id);
        if (view && !placed.has(id)) {
          list.push(view);
          placed.add(id);
        }
      }
    }
    for (const c of containers.value) {
      for (const v of c.views) if (!placed.has(v.id)) result[c.id]!.push(v);
    }
    return result;
  });

  /** What the side bars show: everything except hidden views and views detached into windows. */
  const viewsByContainer = computed(() =>
    Object.fromEntries(
      Object.entries(allViewsByContainer.value).map(([id, list]) => [
        id,
        list.filter(
          (v) =>
            !floating.value.includes(v.id) && !hidden.value.includes(v.id) && isViewAvailable(v),
        ),
      ]),
    ),
  );

  /** The right side bar, shown only while it has at least one available view. */
  const secondaryContainer = computed(() => {
    const container = containers.value.find((c) => c.location === "right");
    return container && viewsByContainer.value[container.id]?.length ? container : undefined;
  });

  const floatingViews = computed(() => {
    const all = Object.values(allViewsByContainer.value).flat();
    return floating.value.flatMap((id) =>
      hidden.value.includes(id) ? [] : all.filter((v) => v.id === id && isViewAvailable(v)),
    );
  });

  /** Replaces a container's views (used by drag and drop, which may add views from another container). */
  function setContainerViews(containerId: string, views: ViewDefinition[]) {
    const moved = new Set(views.map((v) => v.id));
    const next: Record<string, string[]> = {};
    for (const [id, list] of Object.entries(allViewsByContainer.value)) {
      const ids = list.map((v) => v.id);
      // Detached and hidden views keep their slot so they come back where they were.
      next[id] =
        id === containerId
          ? [
              ...views.map((v) => v.id),
              ...ids.filter(
                (v) => (floating.value.includes(v) || hidden.value.includes(v)) && !moved.has(v),
              ),
            ]
          : ids.filter((v) => !moved.has(v));
    }
    placement.value = next;
  }

  function resetViews() {
    placement.value = null;
    floating.value = [];
    hidden.value = [];
    floatedFromOff.value = [];
    activityOrder.value = [];
    viewHeights.value = {};
  }

  function isViewHidden(id: string) {
    return hidden.value.includes(id);
  }

  function toggleViewHidden(id: string) {
    hidden.value = isViewHidden(id) ? hidden.value.filter((v) => v !== id) : [...hidden.value, id];
  }

  function floatView(id: string) {
    // Opening a view that is turned off as a window turns it on, and remembers it was off.
    if (hidden.value.includes(id) && !floatedFromOff.value.includes(id)) {
      floatedFromOff.value = [...floatedFromOff.value, id];
    }
    hidden.value = hidden.value.filter((v) => v !== id);
    if (!floating.value.includes(id)) floating.value = [...floating.value, id];
  }

  /**
   * Closing a window sends the view back to where it came from: its panel, if that is where it was
   * taken from, or off, if it was turned off and only opened as a window. The views menu brings an
   * off view back.
   */
  function closeFloatingView(id: string) {
    floating.value = floating.value.filter((v) => v !== id);
    if (floatedFromOff.value.includes(id)) {
      floatedFromOff.value = floatedFromOff.value.filter((v) => v !== id);
      if (!hidden.value.includes(id)) hidden.value = [...hidden.value, id];
    }
  }

  /** Puts a floating view back in its panel, whatever it was before. */
  function dockView(id: string) {
    floating.value = floating.value.filter((v) => v !== id);
    floatedFromOff.value = floatedFromOff.value.filter((v) => v !== id);
  }

  function isViewCollapsed(viewId: string, initial = false) {
    return collapsedViews.value[viewId] ?? initial;
  }

  function setViewHeight(viewId: string, height: number) {
    viewHeights.value = { ...viewHeights.value, [viewId]: Math.max(Math.round(height), 40) };
  }

  function resetViewHeight(viewId: string) {
    const { [viewId]: _, ...rest } = viewHeights.value;
    viewHeights.value = rest;
  }

  function toggleView(viewId: string, initial = false) {
    collapsedViews.value = { ...collapsedViews.value, [viewId]: !isViewCollapsed(viewId, initial) };
  }

  return {
    containers,
    orderedContainers,
    setActivityOrder,
    activeContainerId,
    activeContainer,
    sidebarVisible,
    sidebarWidth,
    registerContainer,
    toggleContainer,
    toggleSidebar,
    setSidebarWidth,
    secondaryVisible,
    secondaryWidth,
    secondaryContainer,
    toggleSecondary,
    setSecondaryWidth,
    registerView,
    unregisterContainer,
    allViewsByContainer,
    viewsByContainer,
    isViewAvailable,
    isContainerAvailable,
    isViewHidden,
    toggleViewHidden,
    floatingViews,
    floatView,
    dockView,
    closeFloatingView,
    setContainerViews,
    resetViews,
    viewHeights,
    setViewHeight,
    resetViewHeight,
    isViewCollapsed,
    toggleView,
  };
});
