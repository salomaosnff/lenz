<script setup lang="ts">
import type { JSONSchema7 as JsonSchema } from "json-schema";
import JsonAllOf from "./JsonAllOf.vue";
import { provideForm } from "../core/form";
import JsonObject from "./JsonObject.vue";

defineProps<{
  schema: JsonSchema;
  path?: string;
}>();

const modelValue = defineModel<any>();

provideForm(modelValue);
</script>

<template>
  <div v-if="typeof schema !== 'object' || schema.type !== 'object'">
    Erro: O esquema não é um objeto.
  </div>
  <div v-else class="json-form-grid">
    <JsonAllOf
      v-if="schema.allOf"
      :schema="schema"
      :path
    />
    <JsonObject v-else :schema="schema" :path />
  </div>
</template>

<style scoped>
.json-form-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem;
  align-items: start;
}
</style>
