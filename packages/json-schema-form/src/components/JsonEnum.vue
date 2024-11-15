<script setup lang="ts">
import type { JSONSchema7 as JsonSchemaField } from "json-schema";
defineProps<{
  schema: JsonSchemaField;
}>();

const modelValue = defineModel<any>();
</script>
<template>
  <div class="form-json-enum">
    <select v-model="modelValue">
      <option disabled :value="undefined">Selecione...</option>
      <option v-for="item in schema.enum" :key="item" :value="item">
        {{ item }}
      </option>
    </select>
    <p v-if="schema.description"></p>
  </div>
</template>
<style scoped>
.form-json-enum select {
  display: block;
  width: 100%;
}
</style>
