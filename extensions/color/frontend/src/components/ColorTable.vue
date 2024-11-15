<script setup lang="ts">
import { PropType } from "vue";
import allColors, { toRGB } from "../color-table";

defineProps({
  colors: {
    type: Array as PropType<
      Array<{
        name: string;
        value: string;
      }>
    >,
    default: () =>
      Array.from(allColors).map((color) => ({ name: color, value: color })),
  },
});

const modelValue = defineModel<string>();
</script>
<template>
  <div class="flex flex-col">
    <div class="overflow-y-auto overflow-x-hidden flex-1 max-h-50 pa-2">
      <ul class="w-full color-table gap-1 m-0 p-0">
        <li
          v-for="color in colors"
          :key="color.value"
          :style="{ backgroundColor: color.value }"
          class="rounded-lg h-4 cursor-pointer text-3 overflow-hidden"
          :class="{
            'color-selected': color.value === modelValue,
          }"
          :title="color.name"
          @click="modelValue = color.value"
        ></li>
      </ul>
    </div>
    <button @click="modelValue = modelValue && toRGB(modelValue)">
      Converter para RGB
    </button>
  </div>
</template>
<style scoped>
.color-table {
  display: grid;
  grid-template-columns: repeat(auto-fill, 1.5rem);
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  list-style: none;

  & .color-selected {
    outline: 2px solid black;
  }
}
</style>
