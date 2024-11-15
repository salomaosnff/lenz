<script setup lang="ts">
import { BaseSettingsField } from "../../types";

export interface Field extends BaseSettingsField {
  type: "number";
  label: string;
  placeholder?: string;
  default?: number;
  min?: number;
  step?: number;
  max?: number;
}

declare module "../../types" {
  export interface SettingsFieldMapping {
    number: Field;
  }
}

defineProps<{
  field: Field;
}>();
</script>
<template>
  <UiTextField
    :name="field.name"
    type="number"
    :min="field.min"
    :max="field.max"
    :step="field.step"
    :placeholder="field.placeholder"
    :hint="field.hint"
    :label="field.label"
  />
</template>
