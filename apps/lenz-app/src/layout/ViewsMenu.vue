<script setup lang="ts">
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItemIndicator,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from "reka-ui";
import { computed } from "vue";
import { useLayoutStore } from "./store";

const props = defineProps<{ containerId: string }>();
const layout = useLayoutStore();

// Includes hidden and detached views, so any of them can be turned back on.
const views = computed(() =>
  (layout.allViewsByContainer[props.containerId] ?? []).filter(layout.isViewAvailable),
);
</script>

<template>
  <DropdownMenuRoot v-if="views.length">
    <DropdownMenuTrigger class="views-menu-trigger" title="Views" aria-label="Views">
      <Icon name="lucide:ellipsis" class="size-4" />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent class="menubar-content" align="end" :side-offset="4">
        <div v-for="view in views" :key="view.id" class="views-menu-row">
          <DropdownMenuCheckboxItem
            class="menubar-item views-menu-item"
            :model-value="!layout.isViewHidden(view.id)"
            @select="layout.toggleViewHidden(view.id)"
          >
            <span class="views-menu-check">
              <DropdownMenuItemIndicator>
                <Icon name="lucide:check" class="size-3.5" />
              </DropdownMenuItemIndicator>
            </span>
            {{ view.title }}
          </DropdownMenuCheckboxItem>
          <DropdownMenuItem
            class="views-menu-window"
            :title="`Abrir ${view.title} como janela`"
            :aria-label="`Abrir ${view.title} como janela`"
            @select="layout.floatView(view.id)"
          >
            <Icon name="lucide:app-window" class="size-3.5" />
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<style>
.views-menu-trigger {
  @apply flex size-6 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-[var(--ide-fg-muted)] outline-none hover:bg-white/10 hover:text-[var(--ide-fg)] data-[state=open]:bg-white/10;
}
.views-menu-row {
  @apply flex items-center pr-1;
}
/* Whole-row hover, same as a view header. */
.views-menu-row:hover,
.views-menu-row:has([data-highlighted]) {
  @apply bg-[var(--ide-hover)];
}
/* Same look as a view title (.viewpane-trigger); the row provides the hover background. */
.menubar-item.views-menu-item {
  @apply h-7 flex-1 cursor-pointer justify-start gap-0.5 rounded-none bg-transparent px-2 text-[11px] font-semibold tracking-wide text-[var(--ide-fg)] uppercase data-[highlighted]:bg-transparent data-[highlighted]:text-[var(--ide-fg)];
}
.views-menu-check {
  @apply flex size-4 shrink-0 items-center justify-center;
}
/* Same look as the view header's window button; only shown on hover. */
.views-menu-window {
  @apply flex size-5 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-[var(--ide-fg-muted)] opacity-0 outline-none select-none hover:bg-white/10 hover:text-[var(--ide-fg)];
}
.views-menu-row:hover .views-menu-window,
.views-menu-row:has([data-highlighted]) .views-menu-window {
  @apply opacity-100;
}
</style>
