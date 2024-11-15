<script setup lang="ts">
import type { NumberFormControl } from "../core/types";

defineProps<{
  entry: NumberFormControl;
}>();
const value = defineModel<number>();
</script>
<template>
  <label class="number-control">
    <span>{{ entry.label }}</span>
    <input
      v-model.number="value"
      type="number"
      :min="entry.min"
      :max="entry.max"
      :required="entry.required"
      :placeholder="entry.placeholder"
      :step="entry.step"
    />
    <p v-if="entry.description">{{ entry.description }}</p>
  </label>
</template>

<style scoped>
.number-control {
  & span {
    display: block;
    margin-bottom: 0.25rem;
  }

  & input {
    display: block;
    width: 100%;

    & + p {
      margin: 0.25rem 0 0 0;
    }
  }
}
</style>