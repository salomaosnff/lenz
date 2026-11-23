<script setup lang="ts">
import { computed } from "vue";
import type { HtmlEditorApi } from "html-visual-editor/api";
import StyleGroupView from "./StyleGroupView.vue";
import type { StyleField, StyleGroup } from "./model";
import {
  isDistributed,
  isRow,
  layoutKind,
  layoutSections,
  readAlignment,
  writeAlignment,
  type Cell,
} from "./layout";

const props = defineProps<{ group: StyleGroup; api: HtmlEditorApi }>();

const session = computed(() => props.api.session.value);

/** Computed values of the selected element, re-read after each edit. */
const state = computed(() => {
  const current = session.value;
  const el = current?.selected.value;
  if (!current || !el) return null;
  void current.version.value;
  const style = el.ownerDocument.defaultView!.getComputedStyle(el);
  const get = (prop: string) => style.getPropertyValue(prop);
  const parent = el.parentElement;
  const parentStyle = parent && el.ownerDocument.defaultView!.getComputedStyle(parent);
  return {
    kind: layoutKind(get("display")),
    parent: layoutKind(parentStyle?.getPropertyValue("display") ?? "block"),
    position: get("position"),
    direction: get("flex-direction"),
    wraps: get("flex-wrap") !== "nowrap",
    justifyContent: get("justify-content"),
    alignItems: get("align-items"),
    justifyItems: get("justify-items"),
  };
});

const kind = computed(() => state.value?.kind ?? "block");
const container = computed(() =>
  kind.value === "flex" || kind.value === "grid" ? kind.value : null,
);

const alignment = computed(() => {
  const s = state.value;
  return s && container.value ? readAlignment(container.value, s) : { x: null, y: null };
});

const distributed = computed(() => isDistributed(state.value?.justifyContent ?? ""));

const set = (prop: string, value: string) => session.value?.setStyle(prop, value);

function align(x: Cell, y: Cell) {
  const s = state.value;
  if (!s || !container.value) return;
  for (const [prop, value] of Object.entries(writeAlignment(container.value, s.direction, x, y))) {
    set(prop, value);
  }
}

// Figma's "auto layout": direction, wrap and the nine-point alignment of the children.
const directions = [
  { value: "row", label: "Horizontal", icon: "lucide:arrow-right" },
  { value: "column", label: "Vertical", icon: "lucide:arrow-down" },
];
const cells = ([0, 1, 2] as const).flatMap((y) => ([0, 1, 2] as const).map((x) => ({ x, y })));

/** Fields that apply here; the rest would do nothing, so they are hidden. */
const sections = computed(() =>
  state.value
    ? layoutSections({
        kind: state.value.kind,
        parent: state.value.parent,
        position: state.value.position,
      })
    : [],
);
const groupOf = (fields: StyleField[]): StyleGroup => ({ ...props.group, fields });
</script>

<template>
  <div v-if="state">
    <template v-for="section in sections" :key="section.id">
      <h5 v-if="section.label" class="hse-subhead">{{ section.label }}</h5>

      <div v-if="section.id === 'container' && container" class="hse-auto">
        <div v-if="container === 'flex'" class="hse-segmented" role="group" aria-label="Direção">
          <button
            v-for="direction in directions"
            :key="direction.value"
            :class="{ active: isRow(direction.value) === isRow(state.direction) }"
            :title="direction.label"
            :aria-label="direction.label"
            @click="set('flex-direction', direction.value)"
          >
            <Icon :name="direction.icon" class="size-3.5" />
          </button>
          <button
            :class="{ active: state.wraps }"
            title="Quebrar linha"
            aria-label="Quebrar linha"
            @click="set('flex-wrap', state.wraps ? 'nowrap' : 'wrap')"
          >
            <Icon name="lucide:wrap-text" class="size-3.5" />
          </button>
        </div>

        <div class="hse-align" role="group" aria-label="Alinhamento">
          <button
            v-for="cell in cells"
            :key="`${cell.x}${cell.y}`"
            :class="{ active: alignment.x === cell.x && alignment.y === cell.y }"
            :aria-label="`Alinhar ${cell.y + 1}, ${cell.x + 1}`"
            @click="align(cell.x, cell.y)"
          />
        </div>

        <label v-if="container === 'flex'" class="hse-check">
          <input
            type="checkbox"
            :checked="distributed"
            @change="set('justify-content', distributed ? 'flex-start' : 'space-between')"
          />
          Distribuir espaço entre os itens
        </label>
      </div>

      <StyleGroupView :group="groupOf(section.fields)" :api="api" />
    </template>

    <p v-if="state.kind === 'inline'" class="hse-hint">
      Elementos inline não têm tamanho nem layout próprios. Use block, inline-block, flex ou grid.
    </p>
    <p v-else-if="state.kind === 'none'" class="hse-hint">O elemento não é exibido.</p>
  </div>
</template>
