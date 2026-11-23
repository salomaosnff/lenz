<script setup lang="ts">
import { computed } from "vue";
import { iconForTag } from "./elementIcons";
import { describe } from "./model";

const props = defineProps<{
  el: HTMLElement;
  /** Every selected element: all of them are highlighted. */
  selection: readonly HTMLElement[];
  /** Elements whose children are hidden. */
  collapsed: ReadonlySet<HTMLElement>;
  /** Bumps on every edit; the DOM is not reactive, so this is what re-renders the tree. */
  version: number;
  depth?: number;
}>();
const emit = defineEmits<{
  select: [el: HTMLElement, additive: boolean];
  toggle: [el: HTMLElement];
}>();

const depth = computed(() => props.depth ?? 0);
const children = computed(() => {
  void props.version;
  return Array.from(props.el.children) as HTMLElement[];
});
const open = computed(() => !props.collapsed.has(props.el));
const tag = computed(() => props.el.tagName.toLowerCase());
const id = computed(() => {
  void props.version;
  return props.el.id;
});
/** The first classes, then how many more there are: `.card.wide +2`. */
const classes = computed(() => {
  void props.version;
  const all = [...props.el.classList];
  const shown = all
    .slice(0, 2)
    .map((name) => `.${name}`)
    .join("");
  return all.length > 2 ? `${shown} +${all.length - 2}` : shown;
});
const text = computed(() => {
  void props.version;
  return props.el.children.length ? "" : (props.el.textContent ?? "").trim().slice(0, 40);
});
const title = computed(() => {
  void props.version;
  return describe(props.el);
});

/** Left and Right fold and unfold, like in every tree. */
function onKey(event: KeyboardEvent) {
  if (!children.value.length) return;
  if (event.key === "ArrowRight" && !open.value) emit("toggle", props.el);
  else if (event.key === "ArrowLeft" && open.value) emit("toggle", props.el);
  else return;
  event.preventDefault();
}
</script>

<template>
  <div class="hve-node" role="none">
    <div
      class="hve-layer"
      :class="{ selected: selection.includes(el) }"
      :style="{ paddingLeft: `${6 + depth * 14}px` }"
      role="treeitem"
      :aria-level="depth + 1"
      :aria-selected="selection.includes(el)"
      :aria-expanded="children.length ? open : undefined"
    >
      <!-- One thin line per level, so a deep element can be followed up to its parents. -->
      <span
        v-for="level in depth"
        :key="level"
        class="hve-guide"
        :style="{ left: `${12 + (level - 1) * 14}px` }"
      />

      <button
        v-if="children.length"
        type="button"
        class="hve-layer-toggle"
        :aria-label="open ? 'Recolher' : 'Expandir'"
        tabindex="-1"
        @click.stop="emit('toggle', el)"
      >
        <Icon name="lucide:chevron-right" class="hve-layer-chevron" :class="{ open }" />
      </button>
      <span v-else class="hve-layer-toggle" />

      <button
        type="button"
        class="hve-layer-main"
        :title="title"
        @click="emit('select', el, $event.ctrlKey || $event.metaKey || $event.shiftKey)"
        @keydown="onKey"
      >
        <Icon :name="iconForTag(tag)" class="hve-layer-icon" />
        <span class="hve-layer-tag">{{ tag }}</span>
        <span v-if="id" class="hve-layer-id">#{{ id }}</span>
        <span v-if="classes" class="hve-layer-class">{{ classes }}</span>
        <span v-if="text" class="hve-layer-text">{{ text }}</span>
      </button>
    </div>

    <div v-if="children.length && open" role="group">
      <LayerNode
        v-for="(child, i) in children"
        :key="i"
        :el="child"
        :selection="selection"
        :collapsed="collapsed"
        :version="version"
        :depth="depth + 1"
        @select="(node, additive) => emit('select', node, additive)"
        @toggle="(node) => emit('toggle', node)"
      />
    </div>
  </div>
</template>
