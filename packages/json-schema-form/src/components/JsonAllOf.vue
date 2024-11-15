<script setup lang="ts">
import type { JSONSchema7 as JsonSchemaField } from "json-schema";
import JsonField from "./JsonField.vue";

defineProps<{
  schema: JsonSchemaField;
  path?: string;
}>();

const modelValue = defineModel<any>();
</script>
<template>
  <JsonField v-for="(entry, i) in schema.allOf" :key="i" v-model="modelValue" :schema="entry" :path="path ?? ''" />
</template>
