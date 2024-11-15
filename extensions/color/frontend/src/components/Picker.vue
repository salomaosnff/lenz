<script setup lang="ts">
import { computed, ref } from "vue";
import Rgb from "./Rgb.vue";
import Hsl from "./Hsl.vue";
import { generateAnchor } from "./util";
import ColorTable from "./ColorTable.vue";

const anchor = generateAnchor();

const modelValue = defineModel<string>({ required: true });
const format = computed(() => {
  if (!modelValue.value) return "";

  if (
    /^#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})$/.test(
      modelValue.value
    )
  )
    return "rgb";
  if (/^rgba?\(.+?\)$/.test(modelValue.value)) return "rgb";
  if (/^hsla?\(.+?\)$/.test(modelValue.value)) return "hsl";
});

let isVisible = ref(false);

const popover = ref<HTMLElement>();
</script>
<template>
  <div>
    <input
      v-model="modelValue"
      class="color-input w-full"
      placeholder="Digite a cor"
      @pointerup="popover?.showPopover()"
    />

    <div
      ref="popover"
      popover
      class="color-popover bg--surface2 fg--foreground"
      :anchor="anchor"
      @toggle="isVisible = $event.newState"
    >
      <Rgb v-if="format === 'rgb'" v-model="modelValue" />
      <Hsl v-else-if="format === 'hsl'" v-model="modelValue" />
      <ColorTable v-else v-model="modelValue" />
    </div>
  </div>
</template>

<style scoped>
.color-input {
  anchor-name: v-bind(anchor);
}

.color-popover {
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
