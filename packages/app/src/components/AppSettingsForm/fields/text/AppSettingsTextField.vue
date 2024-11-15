<script setup lang="ts">
import { BaseSettingsField } from "../../types";

export interface Field extends BaseSettingsField {
  type: "text";
  label: string;
  format?: "email" | "hidden" | "url";
  pattern?: string;
  placeholder?: string;
  default?: string;
  min?: number;
  max?: number;
}

declare module "../../types" {
  export interface SettingsFieldMapping {
    text: Field;
  }
}

const props = defineProps<{
  field: Field;
}>();

const fieldType = computed(() => {
  const { format = "text" } = props.field;

  if (format === "hidden") {
    return "password";
  }

  return format;
});
</script>
<template>
  <UiTextField
    :name="field.name"
    :type="fieldType"
    :minlength="field.min"
    :maxlength="field.max"
    :placeholder="field.placeholder"
    :hint="field.hint"
    :label="field.label"
  />
</template>
