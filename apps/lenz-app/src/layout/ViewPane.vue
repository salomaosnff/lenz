<script setup lang="ts">
import { computed, onBeforeUnmount } from "vue";
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from "reka-ui";
import type { ViewDefinition } from "./types";
import { useLayoutStore } from "./store";
import ViewHost from "./ViewHost.vue";

const props = withDefaults(
  defineProps<{
    view: ViewDefinition;
    /** `false`: the view takes the height of its content and can only be collapsed. */
    resizable?: boolean;
    /** The only view of its panel: no header (the panel's title says it) and always open. */
    headless?: boolean;
    /**
     * Starts at the height of its content, not sharing the panel with the others. It can still be
     * resized: once the user drags it, that height is what it keeps (double click goes back).
     */
    natural?: boolean;
    /** The first of the closed views at the end of the panel: the free space goes above it. */
    dock?: boolean;
  }>(),
  { resizable: true, headless: false, natural: false, dock: false },
);
// The height the user dragged the view to. The only view of a panel fills it instead, so the view
// is what scrolls and the panel does not scroll as well.
const sized = computed(
  () => props.resizable && !props.headless && !!layout.viewHeights[props.view.id],
);
const isOpen = computed(
  () => props.headless || !layout.isViewCollapsed(props.view.id, props.view.collapsed),
);
const layout = useLayoutStore();
// An open view without a height of its own takes the space the others leave: it stretches.
const grows = computed(() => isOpen.value && !props.headless && props.resizable && !sized.value);

/** Ends the drag in progress, if any. */
let stopResize: (() => void) | undefined;

/**
 * Dragging the handle changes the height of the view. It listens on the window while the drag
 * lasts, not on the handle: the pointer leaves the handle as soon as it moves, and relying on the
 * handle to keep receiving the movements (pointer capture) loses the drag when it does not.
 */
function onSashDown(e: PointerEvent) {
  const sash = e.currentTarget as HTMLElement;
  const body = sash.previousElementSibling as HTMLElement | null;
  const start = { y: e.clientY, height: body?.offsetHeight ?? 0 };
  e.preventDefault(); // no text gets selected while dragging
  stopResize?.();

  const move = (event: PointerEvent) =>
    layout.setViewHeight(props.view.id, start.height + event.clientY - start.y);
  const stop = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
    window.removeEventListener("pointercancel", stop);
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
    stopResize = undefined;
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop);
  window.addEventListener("pointercancel", stop);
  // The cursor stays a resize one wherever the pointer is, not only over the 4px of the handle.
  document.body.style.cursor = "row-resize";
  document.body.style.userSelect = "none";
  stopResize = stop;
}

onBeforeUnmount(() => stopResize?.());
</script>

<template>
  <CollapsibleRoot
    class="viewpane"
    :class="{
      auto: !resizable,
      natural: natural && resizable && !sized,
      sized,
      grow: grows,
      dock,
      fill: headless && resizable,
    }"
    :open="isOpen"
    @update:open="!headless && layout.toggleView(view.id, view.collapsed)"
  >
    <div v-if="!headless" class="viewpane-header">
      <CollapsibleTrigger class="viewpane-trigger">
        <Icon name="lucide:chevron-right" class="viewpane-chevron size-4" />
        <span class="truncate" :title="view.title">{{ view.title }}</span>
      </CollapsibleTrigger>
      <button
        class="viewpane-action"
        title="Mover para uma janela"
        :aria-label="`Mover ${view.title} para uma janela`"
        @click="layout.floatView(view.id)"
      >
        <Icon name="lucide:app-window" class="size-3.5" />
      </button>
    </div>
    <CollapsibleContent
      class="viewpane-body"
      :class="{ sized: sized }"
      :style="sized ? { height: `${layout.viewHeights[view.id]}px` } : undefined"
    >
      <ViewHost :view="view" location="panel" />
    </CollapsibleContent>
    <div
      v-if="resizable && isOpen && !headless"
      class="viewpane-sash"
      role="separator"
      aria-orientation="horizontal"
      title="Arraste para alterar a altura (duplo clique para restaurar)"
      @pointerdown="onSashDown"
      @dblclick="layout.resetViewHeight(view.id)"
    />
  </CollapsibleRoot>
</template>

<style>
.viewpane {
  @apply relative flex min-h-0 flex-col border-t border-[var(--ide-border)] first:border-t-0;
}
.viewpane-header {
  @apply flex h-7 shrink-0 items-center pr-1 hover:bg-[var(--ide-hover)];
}
.viewpane-header:hover .viewpane-action {
  @apply opacity-100;
}
.viewpane-trigger {
  @apply flex h-full min-w-0 flex-1 cursor-pointer items-center gap-0.5 border-0 bg-transparent px-2 text-left text-[11px] font-semibold tracking-wide text-[var(--ide-fg)] uppercase outline-none select-none focus-visible:outline focus-visible:-outline-offset-1 focus-visible:outline-[var(--ide-accent)];
}
.viewpane-action {
  @apply flex size-5 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-[var(--ide-fg-muted)] opacity-0 outline-none hover:bg-white/10 hover:text-[var(--ide-fg)] focus-visible:opacity-100;
}
.viewpane-chevron {
  @apply transition-transform;
}
.viewpane-trigger[data-state="open"] .viewpane-chevron {
  @apply rotate-90;
}
.viewpane-body.sized {
  @apply shrink-0;
}
.viewpane-sash {
  @apply absolute inset-x-0 bottom-0 z-10 h-1 cursor-row-resize after:absolute after:inset-0 after:bg-transparent after:transition-colors after:delay-150 hover:after:bg-[var(--ide-accent)] active:after:bg-[var(--ide-accent)];
}
.viewpane-body {
  @apply overflow-auto;
}
/* The only view of a panel: it takes the whole panel and scrolls inside it, once. */
.viewpane.fill {
  @apply min-h-0 flex-1;
}
.viewpane.fill > .viewpane-body {
  @apply min-h-0 flex-1;
}
/* Starts at the height of its content, or has the height the user gave it: either way it is not
   squeezed by a long view next to it (that would leave its content spilling over the next view). */
.viewpane.natural,
.viewpane.sized {
  @apply shrink-0;
}
/* An open view stretches over the free space of the panel (its body with it), which also keeps the
   closed views after it at the bottom. A view with a height the user gave it does not stretch. */
.viewpane.grow {
  @apply grow;
}
.viewpane.grow > .viewpane-body {
  @apply flex-1;
}
/* Closed views at the end of the panel: when no view stretches, the free space is above them. */
.viewpane.dock {
  @apply mt-auto;
}
/* Automatic height: the pane never shrinks, so the side bar scrolls instead. */
.viewpane.auto {
  @apply shrink-0;
}
.viewpane.auto > .viewpane-body {
  @apply overflow-visible;
}
</style>
