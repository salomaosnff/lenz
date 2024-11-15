<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";

import { generateAnchor, getThemes } from "./util";

import * as LenzReactivity from "lenz:reactivity";

const props = defineProps<{
  result: LenzReactivity.Ref<string>;
}>();

const value = defineModel<string>();

const styleContent = ref(
  props.result.value ||
    `
.theme--dark {
  --color-primary: #ff0000;
  --color-secondary: #00ff00;
}
.theme--light {
  --color-primary: #0000ff;
  --color-secondary: #ffff00;
}
`
);

const anchor = generateAnchor();

onUnmounted(
  LenzReactivity.watch(props.result, (newStyle) => {
    styleContent.value = newStyle;
  })
);

const themes = getThemes(styleContent);

const colors = computed(() => {
  return Object.entries(
    themes.value.reduce<
      Record<string, Array<{ theme: string; value: string }>>
    >((colors, theme) => {
      return theme.colors.reduce((colors, color) => {
        colors[color.name] ??= [];
        colors[color.name].push({
          theme: theme.name,
          value: color.value,
        });
        return colors;
      }, colors);
    }, {})
  ).map(([name, value]) => ({ name, value: Array.from(new Set(value)) }));
});

function isSelected(color: string) {
  return value.value === `var(--color-${color})`;
}

const selectedItem = computed(() => {
  return colors.value.find((color) => isSelected(color.name));
});

let isVisible = ref(false);
const popover = ref<HTMLElement>();
</script>

<template>
  <div
    class="flex gap-1 color-value py-2 cursor-pointer"
    @pointerup="popover?.showPopover()"
  >
    <template v-if="selectedItem">
      <div
        v-for="c in selectedItem.value"
        class="w-4 h-4"
        :key="`${c.theme}-${c.value}`"
        :style="{ background: c.value }"
        :title="c.theme"
      ></div>
    </template>
    <div
      v-else
      class="w-4 h-4"
      :style="{ background: value }"
    ></div>
    <input type="text" v-model="value" />
  </div>
  <ul
    ref="popover"
    popover
    class="color-value__popover"
    @toggle="isVisible = $event.newState"
  >
    <li
      v-for="color in colors"
      :key="color.name"
      class="flex gap-1 pa-2 cursor-pointer"
      :class="{
        'bg-gray-200': isSelected(color.name),
      }"
      @click="(value = `var(--color-${color.name})`), popover?.hidePopover()"
    >
      <div
        class="w-4 h-4"
        v-for="c in color.value"
        :key="`${c.theme}-${color.name}`"
        :style="{ background: c.value }"
        :title="c.theme"
      ></div>
      <span>{{ color.name }}</span>
    </li>
  </ul>
</template>

<style>
.color-value {
  anchor-name: v-bind(anchor);
}

.color-value__popover {
  position-anchor: v-bind(anchor);
  position: absolute;
  z-index: 1;
  inset: auto;
  top: anchor(bottom);
  left: anchor(left);
  border: 1px solid black;
  padding: 0.5rem;
  min-inline-size: max(anchor-size(inline), 200px);
  box-sizing: border-box;

  &::backdrop {
    background: none;
  }
}
</style>
