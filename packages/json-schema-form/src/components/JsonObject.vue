<script setup lang="ts">
import type { JSONSchema7 as JsonSchema } from "json-schema";
import JsonField from "./JsonField.vue";
import { getPath } from "../core/form";

defineProps<{
  schema: JsonSchema;
  path?: string;
}>();
</script>
<template>
  <JsonField
    v-for="(entry, i) in schema.allOf"
    :key="i"
    :schema="{
      type: schema.type ?? 'object',
      ...(entry as object),
    }"
    :path="path ?? ''"
  />
  <JsonField
    v-for="(field, name) in schema.properties"
    :key="name"
    :schema="field"
    :path="getPath(name, path)"
  />
</template>
