<script setup lang="ts">
import type { JSONSchema7 as JsonSchemaField } from "json-schema";
import JsonField from "./JsonField.vue";

defineProps<{
  schema: JsonSchemaField;
  path: string;
}>();

const modelValue = defineModel<any[]>({ default: () => [] });
</script>
<template>
  <fieldset>
    <legend>{{ schema.description }}</legend>
    <div class="json-schema-array-entries">
      <JsonField
        v-for="(_, index) in modelValue"
        :key="index"
        v-model="modelValue[index]"
        :path="`${path}[${index}]`"
        :schema="schema.items"
        class="w-full"
      />
    </div>
    <button
      type="button"
      @click="modelValue = [...modelValue, schema.default ?? null]"
    >
      Add
    </button>
  </fieldset>
</template>

<style>
.json-schema-array-entries {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: .25rem;
}
</style>
