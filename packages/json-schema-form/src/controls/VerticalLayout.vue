<script setup lang="ts">
import type { FormElement, VerticalLayout } from "../core/types";
import FormEntry from "./FormEntry.vue";
import TextControl from "./TextControl.vue";

defineProps<{
  entry: VerticalLayout;
}>();

const value = defineModel<any>();
</script>
<template>
  <div class="vertical-layout">
    <FormEntry v-for="(child, i) in entry.children" :key="i" :entry="child" />
  </div>
</template>

<style scoped>
.vertical-layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>