<script setup lang="ts">
import type { ObjectFormControl } from "../core/types";
import FormEntry from "./FormEntry.vue";

defineProps<{
  entry: ObjectFormControl;
}>();
const value = defineModel<string>();
</script>
<template class="object-control">
  <fieldset>
    <legend>{{ entry.label }}</legend>
    <p>{{ entry.description }}</p>
    <FormEntry v-for="(child, i) in entry.properties" :key="i" :entry="child" />
  </fieldset>
</template>

<style scoped>

</style>