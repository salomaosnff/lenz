<script lang="ts" setup>
import { computed } from "vue";
import CssNumberInput from "./CssNumberInput.vue";

const modelValue = defineModel<string>();

const border = computed(() => {
  const [width, style, color] = modelValue.value?.split(" ") ?? [];

  return {
    width: width || "0px",
    style: style || "solid",
    color: color || "#000000",
  };
});

const borderWidth = computed({
  get: () => border.value.width,
  set: (value: string) => {
    modelValue.value = `${value} ${border.value.style} ${border.value.color}`;
  },
});

const borderStyle = computed({
  get: () => border.value.style,
  set: (value: string) => {
    modelValue.value = `${border.value.width} ${value} ${border.value.color}`;
  },
});

const borderColor = computed({
  get: () => border.value.color ?? "#000000",
  set: (value: string) => {
    modelValue.value = `${border.value.width} ${border.value.style} ${value}`;
  },
});
</script>
<template>
  <label>
    <p>Tamanho:</p>
    <CssNumberInput
      v-model="borderWidth"
      name="border-width"
      default-unit="px"
    />
  </label>

  <label>
    <p>Cor:</p>
    <input type="color" v-model="borderColor" name="border-color" />
  </label>

  <label>
    <p>Estilo:</p>
    <select v-model="borderStyle" name="border-style">
      <option value="solid">Sólida</option>
      <option value="dashed">Tracejada</option>
      <option value="dotted">Pontilhada</option>
      <option value="double">Dupla</option>
    </select>
  </label>

  <button v-if="modelValue" type="button" @click="modelValue = ''">
    Remover
  </button>
</template>
