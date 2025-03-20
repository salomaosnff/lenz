<script setup lang="ts">
import type { JSONSchema7 as JsonSchemaField } from "json-schema";
import { computed } from "vue";
const props = defineProps<{
  schema: JsonSchemaField;
}>();

const modelValue = defineModel<string>();

const type = computed(() => {
  if (props.schema.format === "email") return "email";
  if (props.schema.type === "integer") return "number";
  return "text";
});
</script>
<template>
  <div class="form-json-string">
    <input v-model="modelValue" :type :minlength="schema.minLength" :maxlength="schema.maxLength"
      :pattern="schema.pattern"
      :placeholder="Array.isArray(schema.examples) && schema.examples.length > 0 ? `Ex. ${schema.examples.join(', ')}` : (schema.examples?.toString())"
      :title="schema.description" />
    <p v-if="schema.description"></p>
  </div>
</template>
<style scoped>
.form-json-string input {
  display: block;
  width: 100%;
}
</style>
