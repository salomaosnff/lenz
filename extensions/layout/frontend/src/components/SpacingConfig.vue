<script lang="ts" setup>
import { computed } from "vue";
import CssNumberInput from "./CssNumberInput.vue";

const modelValue = defineModel<string>();

const spacing = computed(() => {
  const parts = modelValue.value?.split(" ") ?? [];
  const top = parts[0];

  if (parts.length === 1) {
    return {
      top,
      right: top,
      bottom: top,
      left: top,
    };
  }

  const right = parts[1];

  if (parts.length === 2) {
    return {
      top,
      right,
      bottom: top,
      left: right,
    };
  }

  const bottom = parts[2];

  if (parts.length === 3) {
    return {
      top,
      right,
      bottom,
      left: right,
    };
  }

  const left = parts[3];

  return {
    top,
    right,
    bottom,
    left,
  };
});

const top = computed({
  get: () => spacing.value.top,
  set: (value: string) => {
    modelValue.value = `${value} ${spacing.value.right} ${spacing.value.bottom} ${spacing.value.left}`;
  },
});

const right = computed({
  get: () => spacing.value.right,
  set: (value: string) => {
    modelValue.value = `${spacing.value.top} ${value} ${spacing.value.bottom} ${spacing.value.left}`;
  },
});

const bottom = computed({
  get: () => spacing.value.bottom,
  set: (value: string) => {
    modelValue.value = `${spacing.value.top} ${spacing.value.right} ${value} ${spacing.value.left}`;
  },
});

const left = computed({
  get: () => spacing.value.left,
  set: (value: string) => {
    modelValue.value = `${spacing.value.top} ${spacing.value.right} ${spacing.value.bottom} ${value}`;
  },
});

const all = computed({
  get: () => spacing.value.top,
  set: (value: string) => {
    modelValue.value = value;
  },
});

const vertical = computed({
  get: () => `${spacing.value.top} ${spacing.value.bottom}`,
  set: (value: string) => {
    modelValue.value = `${value} ${spacing.value.right} ${value}`;
  },
});

const horizontal = computed({
  get: () => `${spacing.value.right} ${spacing.value.left}`,
  set: (value: string) => {
    modelValue.value = `${spacing.value.top} ${value} ${spacing.value.bottom}`;
  },
});
</script>
<template>
  <label>
    <p>Todos os lados:</p>
    <CssNumberInput v-model="all" name="border-width" default-unit="px" />
  </label>

  <details>
    <summary>Simétrico</summary>
    <label>
      <p>Vertical:</p>
      <CssNumberInput
        v-model="vertical"
        name="border-width"
        default-unit="px"
      />
    </label>

    <label>
      <p>Horizontal:</p>
      <CssNumberInput
        v-model="horizontal"
        name="border-width"
        default-unit="px"
      />
    </label>
  </details>

  <details>
    <summary>Manual</summary>

    <label>
      <p>Superior:</p>
      <CssNumberInput v-model="top" name="border-width" default-unit="px" />
    </label>

    <label>
      <p>Direita:</p>
      <CssNumberInput v-model="right" name="border-width" default-unit="px" />
    </label>

    <label>
      <p>Inferior:</p>
      <CssNumberInput v-model="bottom" name="border-width" default-unit="px" />
    </label>

    <label>
      <p>Esquerda:</p>
      <CssNumberInput v-model="left" name="border-width" default-unit="px" />
    </label>
  </details>

  <button v-if="modelValue" type="button" @click="modelValue = ''">
    Remover
  </button>
</template>
