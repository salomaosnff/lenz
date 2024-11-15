<script setup lang="ts">
import type { JSONSchema7 as JsonSchemaField } from "json-schema";
const props = defineProps<{
  schema: JsonSchemaField;
}>();

const modelValue = defineModel<string>();
</script>
<template>
  <input
    v-model="modelValue"
    type="checkbox"
    :title="schema.description"
  />
</template>
