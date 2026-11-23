import type { Component } from "vue";

export interface ViewDefinition {
  id: string;
  title: string;
  /** Built-in content. Optional when a ViewProvider supplies it; used as the fallback otherwise. */
  component?: Component;
  props?: Record<string, unknown>;
  /** Start collapsed. */
  collapsed?: boolean;
  /** Starts at the height of its content (it can be resized): for a short list next to a long view. */
  autoHeight?: boolean;
  /** Condition for the view to be available; see `ViewProvider.when`. */
  when?: string;
}

export interface ViewContainer {
  id: string;
  title: string;
  /** Icon name, e.g. `lucide:files`. */
  icon: string;
  views: ViewDefinition[];
  /** Position in the activity bar. */
  /** `right` is the secondary side bar: it has no activity bar icon. */
  location?: "top" | "bottom" | "right";
  badge?: number;
  /**
   * Where the button goes in the activity bar by default: lower comes first, ties keep the order
   * they were registered in. Without it, 100. The order the user gave it wins over this.
   */
  order?: number;
}
