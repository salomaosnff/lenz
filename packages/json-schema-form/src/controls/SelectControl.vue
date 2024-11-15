<script setup lang="ts">
import type { SelectFormControl } from "../core/types";

defineProps<{
  entry: SelectFormControl<any>;
}>();
const value = defineModel<any[]>();
</script>
<template>
  <label class="text-control">
    <span>{{ entry.label }}</span>
    <select v-model="value" :required="entry.required">
      <option :value="undefined" disabled selected>{{ entry.placeholder }}</option>
      <option
        v-for="option in entry.options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <p v-if="entry.description">{{ entry.description }}</p>
  </label>
</template>

<style scoped>
.text-control {
  & span {
    display: block;
    margin-bottom: 0.25rem;
  }

  & select {
    display: block;
    width: 100%;
    & + p {
      margin: 0.25rem 0 0 0;
    }
  }
}
</style>
