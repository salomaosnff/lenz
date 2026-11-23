<script setup lang="ts">
import { computed } from "vue";
import { VueDraggable } from "vue-draggable-plus";
import {
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "reka-ui";
import { useLayoutStore } from "./store";

const layout = useLayoutStore();
const top = computed(() =>
  layout.orderedContainers.filter(
    (c) => (c.location ?? "top") === "top" && layout.isContainerAvailable(c),
  ),
);
const bottom = computed(() =>
  layout.orderedContainers.filter((c) => c.location === "bottom" && layout.isContainerAvailable(c)),
);
// Each group is reordered on its own: a panel does not cross from the top to the bottom.
const groups = computed(() => [top.value, bottom.value]);
const reorder = (list: { id: string }[]) => layout.setActivityOrder(list.map((c) => c.id));

function isActive(id: string) {
  return layout.sidebarVisible && layout.activeContainerId === id;
}

function toggle(id: string) {
  layout.toggleContainer(id);
}
</script>

<template>
  <TooltipProvider :delay-duration="300">
    <nav class="activitybar" aria-label="Activity Bar">
      <!-- Dragging a button moves the panel. The fallback drag follows the mouse itself, which works
           the same everywhere (touch included) and does not lose the tooltips to a native drag. -->
      <VueDraggable
        v-for="(group, i) in groups"
        :key="i"
        :model-value="group"
        class="activitybar-group"
        :animation="150"
        :force-fallback="true"
        :fallback-tolerance="4"
        ghost-class="activitybar-ghost"
        @update:model-value="reorder"
      >
        <div v-for="c in group" :key="c.id" class="activitybar-slot">
          <TooltipRoot>
            <TooltipTrigger as-child>
              <button
                class="activitybar-item"
                :class="{ active: isActive(c.id) }"
                :aria-label="c.title"
                :aria-pressed="isActive(c.id)"
                @click="toggle(c.id)"
              >
                <Icon :name="c.icon" class="size-5" />
                <span v-if="c.badge" class="activitybar-badge">{{ c.badge }}</span>
              </button>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent side="right" :side-offset="6" class="activitybar-tooltip">
                {{ c.title }}
                <TooltipArrow class="fill-[var(--ide-tooltip-bg)]" />
              </TooltipContent>
            </TooltipPortal>
          </TooltipRoot>
        </div>
      </VueDraggable>
    </nav>
  </TooltipProvider>
</template>

<style>
.activitybar {
  @apply flex w-12 shrink-0 flex-col items-center justify-between border-r border-[var(--ide-border)] py-1 bg-[var(--ide-activitybar-bg)];
}
.activitybar-item {
  @apply relative my-0.5 flex size-10 cursor-pointer rounded-lg items-center justify-center text-[var(--ide-activitybar-fg-inactive)] outline-none hover:text-[var(--ide-activitybar-fg)] focus-visible:text-[var(--ide-activitybar-fg)];
}
.activitybar-item:hover {
  @apply bg-[var(--ide-hover)];
}
.activitybar-item.active {
  @apply bg-white/10 text-[var(--ide-activitybar-fg)];
}
.activitybar-slot {
  @apply flex;
}
/* The button that is being dragged stays in its place, faded; the one under the mouse is the copy. */
.activitybar-ghost {
  @apply opacity-40;
}
.activitybar-badge {
  @apply absolute right-0.5 bottom-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--ide-accent)] px-1 text-[10px] leading-none font-semibold text-white;
}
.activitybar-tooltip {
  @apply z-50 rounded-md border border-[var(--ide-menu-border)] bg-[var(--ide-tooltip-bg)] px-2 py-1 text-xs text-[var(--ide-fg)] shadow-lg;
}
</style>
