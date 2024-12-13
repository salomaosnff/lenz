<script setup lang="ts">
import type { JSONSchema7 as JsonSchemaField } from "json-schema";
const props = defineProps<{
  schema: JsonSchemaField;
}>();

const modelValue = defineModel<string>();
</script>
<template>
  <select v-model="modelValue" :title="schema.description">
    <option :value="undefined">Selecione...</option>
    <option :value="true">Sim</option>
    <option :value="false">Não</option>
  </select>
</template>
