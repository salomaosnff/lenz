<script setup lang="ts">
import { computed, nextTick, ref, shallowReactive, watch } from "vue";
import LayerNode from "./LayerNode.vue";
import { session } from "./session";

const panel = ref<HTMLElement>();
const current = computed(() => session.value);

/** Elements that were folded by the user. Everything starts open. */
const collapsed = shallowReactive(new Set<HTMLElement>());
function toggle(el: HTMLElement) {
  if (collapsed.has(el)) collapsed.delete(el);
  else collapsed.add(el);
}

/** A selected element is never hidden inside a folded one: its parents open. */
function revealSelection() {
  for (const el of current.value?.selection.value ?? []) {
    for (let parent = el.parentElement; parent; parent = parent.parentElement)
      collapsed.delete(parent);
  }
}

/** Keeps the selected row in view. The view scrolls, not a scroll area of its own: one scrollbar. */
function scrollToSelected() {
  panel.value
    ?.querySelector<HTMLElement>(".hve-layer.selected")
    ?.scrollIntoView({ block: "nearest" });
}

// After the DOM updates (the tree may have changed too), so the row is already highlighted.
watch(
  () => [current.value?.selection.value, current.value?.version.value],
  () => {
    revealSelection();
    nextTick(scrollToSelected);
  },
  { flush: "post" },
);
</script>

<template>
  <div ref="panel" class="hve-layers" role="tree" aria-label="Árvore de elementos">
    <LayerNode
      v-if="current?.root.value"
      :el="current.root.value"
      :selection="current.selection.value"
      :collapsed="collapsed"
      :version="current.version.value"
      @select="(el, additive) => current?.select(el, additive)"
      @toggle="toggle"
    />
  </div>
</template>
