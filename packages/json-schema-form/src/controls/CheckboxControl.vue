<script setup lang="ts">
import type { CheckboxFormControl } from "../core/types";

defineProps<{
  entry: CheckboxFormControl;
}>();

const value = defineModel<boolean>();
</script>
<template>
  <div class="checkbox-control">
    <label>
      <input
        v-model="value"
        type="checkbox"
        :required="entry.required"
        :placeholder="entry.placeholder"
      />
      <span>{{ entry.label }}</span>
    </label>
    <p v-if="entry.description">{{ entry.description }}</p>
  </div>
</template>

<style scoped>
.checkbox-control {
  width: max-content;
  & label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  & span {
    display: block;
  }

  & p {
    margin: 0.25rem 0 0 0;
  }
}
</style>
