<script setup lang="ts">
import type { TextFormControl } from "../core/types";

defineProps<{
  entry: TextFormControl;
}>();
const value = defineModel<string>();
</script>
<template>
  <label class="text-control">
    <span>{{ entry.label }}</span>
    <input
      v-model="value"
      :type="entry.format"
      :minlength="entry.minLength"
      :maxlength="entry.maxLength"
      :required="entry.required"
      :placeholder="entry.placeholder"
      :pattern="entry.pattern"
    />
    <p v-if="entry.description">{{ entry.description }}</p>
  </label>
</template>

<style scoped>
.text-control {
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