<script setup lang="ts">
import type { ArrayFormControl } from "../core/types";
import FormEntry from "./FormEntry.vue";

defineProps<{
  entry: ArrayFormControl;
}>();
const value = defineModel<any[]>({ default: () => [] });
</script>
<template>
  <fieldset class="array-control">
    <legend>
      {{ entry.label }} <button @click="value = [...value, {}]">Add</button>
    </legend>
    <p>{{ entry.description }}</p>
    <div class="array-control__entry" v-for="i in value" :key="i">
      <FormEntry :entry="entry.items" />
      <button @click="value = value.toSpliced(i, 1)">Remove</button>
    </div>
  </fieldset>
</template>

<style scoped>
.array-control {
  & .array-control__entry {
    display: flex;
    gap: 1rem;
    align-items: center;

    & > :first-child {
      flex: 1;
    }
  }
}
</style>
