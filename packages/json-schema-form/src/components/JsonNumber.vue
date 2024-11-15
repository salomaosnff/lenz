<script setup lang="ts">
import type { JSONSchema7 as JsonSchemaField } from "json-schema";

defineProps<{
  schema: JsonSchemaField;
}>();

const modelValue = defineModel<number>();
</script>
<template>
  <input
    v-model.number="modelValue"
    type="number"
    :min="schema.minimum"
    :max="schema.maximum"
    :step="schema.multipleOf"
    :title="schema.description"
    :placeholder="Array.isArray(schema.examples) ? schema.examples.join(', ') : schema.examples?.toString()"
    />
</template>
