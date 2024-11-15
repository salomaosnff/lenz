<script setup lang="ts">
import type {
  JSONSchema7,
  JSONSchema7Definition as JsonSchemaField,
} from "json-schema";
import JsonString from "./JsonString.vue";
import JsonNumber from "./JsonNumber.vue";
import JsonBoolean from "./JsonBoolean.vue";
import JsonEnum from "./JsonEnum.vue";
import JsonArray from "./JsonArray.vue";
import { computed, useAttrs } from "vue";
import JsonAllOf from "./JsonAllOf.vue";
import JsonObject from "./JsonObject.vue";
import { useForm } from "../core/form";

const props = defineProps<{
  schema: JsonSchemaField;
  path?: string;
}>();

const { get, set } = useForm()

const modelValue = computed({
  get: () => get(props.path),
  set: (value) => set(props.path, value),
})

function isSchemaObject(schema: JsonSchemaField): schema is JSONSchema7 {
  return (
    typeof schema === "object" &&
    schema !== null &&
    typeof schema.type === "string"
  );
}

defineOptions({
  inheritAttrs: false,
});

const attrs = useAttrs();
</script>
<template>
  <div v-if="!isSchemaObject(schema)">Schema inválido {{ schema }}</div>
  <JsonObject v-else-if="schema.type === 'object'" :schema="schema" :path />
  <template v-else>
    <label>{{ schema.title }}</label>
    <JsonEnum
      v-if="schema.enum"
      v-model="modelValue"
      :items="schema.enum"
      :schema
      :path
      v-bind="attrs"
    />
    <JsonArray
      v-else-if="schema.type === 'array'"
      v-model="modelValue"
      :schema
      :path
      v-bind="attrs"
    />
    <JsonString
      v-else-if="schema.type === 'string'"
      v-model="modelValue"
      :schema
      :path
      v-bind="attrs"
    />
    <JsonNumber
      v-else-if="schema.type === 'number' || schema.type === 'integer'"
      v-model="modelValue"
      :schema
      :path
      v-bind="attrs"
    />
    <JsonBoolean
      v-else-if="schema.type === 'boolean'"
      v-model="modelValue"
      :schema
      :path
      v-bind="attrs"
    />
    <JsonAllOf
      v-else-if="schema.allOf"
      v-model="modelValue"
      :schema
      :path
      v-bind="attrs"
    />
  </template>
</template>
