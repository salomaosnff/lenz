<script setup lang="ts">
import { computed } from "vue";
import { VueDraggable } from "vue-draggable-plus";
import { useLayoutStore } from "./store";
import type { ViewContainer, ViewDefinition } from "./types";
import ViewPane from "./ViewPane.vue";
import ViewsMenu from "./ViewsMenu.vue";

const props = defineProps<{ container: ViewContainer; label?: string }>();
const layout = useLayoutStore();

// Both side bars share the "views" group, so a view can be dragged between them.
const views = computed<ViewDefinition[]>({
  get: () => layout.viewsByContainer[props.container.id] ?? [],
  set: (value) => layout.setContainerViews(props.container.id, value),
});

/** With one view, its own header would repeat the title: the panel's title carries it instead. */
const single = computed(() => (views.value.length === 1 ? views.value[0] : undefined));

/**
 * Index of the first of the views that are closed at the end of the panel, when there is an open
 * one above them: those stay at the bottom, and the open view stretches over what is left. With
 * every view closed (nothing to stretch) or none (nothing to keep at the bottom) it is `-1`. The
 * views of the right side bar keep the height of their content, so they are left as they are.
 */
const dockFrom = computed(() => {
  if (props.container.location === "right" || single.value) return -1;
  const list = views.value;
  let start = list.length;
  while (start > 0 && layout.isViewCollapsed(list[start - 1]!.id, list[start - 1]!.collapsed))
    start--;
  return start > 0 && start < list.length ? start : -1;
});

const title = computed(() => {
  const viewTitle = single.value?.title?.trim();
  if (!viewTitle || viewTitle.toLowerCase() === props.container.title.trim().toLowerCase()) {
    return props.container.title;
  }
  return `${props.container.title}: ${viewTitle}`;
});
</script>

<template>
  <aside class="sidebar" :aria-label="label ?? 'Side Bar'">
    <header class="sidebar-title">
      <span class="min-w-0 flex-1 truncate" :title="title">{{ title }}</span>
      <button
        v-if="single"
        class="sidebar-action"
        title="Mover para uma janela"
        :aria-label="`Mover ${single.title || container.title} para uma janela`"
        @click="layout.floatView(single.id)"
      >
        <Icon name="lucide:app-window" class="size-3.5" />
      </button>
      <ViewsMenu :container-id="container.id" />
    </header>
    <VueDraggable
      v-model="views"
      class="sidebar-views"
      group="views"
      handle=".viewpane-header"
      ghost-class="viewpane-ghost"
      :animation="150"
    >
      <ViewPane
        v-for="(view, index) in views"
        :key="view.id"
        :view="view"
        :resizable="container.location !== 'right'"
        :natural="view.autoHeight"
        :dock="index === dockFrom"
        :headless="!!single"
      />
    </VueDraggable>
    <p v-if="!views.length" class="sidebar-empty">Arraste uma view para cá</p>
  </aside>
</template>

<style>
.sidebar {
  @apply relative flex h-full min-w-0 flex-col overflow-hidden bg-[var(--ide-sidebar-bg)];
}
.sidebar-title {
  @apply flex h-9 shrink-0 items-center pr-2 pl-4 text-[11px] font-medium tracking-wide text-[var(--ide-fg)] uppercase select-none;
}
.sidebar-action {
  @apply flex size-5 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-[var(--ide-fg-muted)] outline-none hover:bg-white/10 hover:text-[var(--ide-fg)] focus-visible:outline focus-visible:outline-[var(--ide-accent)];
}
.sidebar-views {
  @apply flex min-h-0 flex-1 flex-col overflow-auto;
}
.sidebar-empty {
  @apply pointer-events-none absolute inset-x-0 top-1/2 px-6 text-center text-[13px] text-[var(--ide-fg-muted)];
}
.viewpane-ghost {
  @apply bg-[var(--ide-accent)]/20 opacity-60;
}
.viewpane-header {
  @apply cursor-grab active:cursor-grabbing;
}
</style>
