<script setup lang="ts">
import { BaseSettingsField } from "../../types";

interface BaseFieldOptions extends BaseSettingsField {
  type: "select";
  placeholder?: string;
  options: Array<{
    label: string;
    value: any;
  }>;
  default?: any;
}

interface MultipleFieldOptions extends BaseFieldOptions {
  multiple: true;
  min?: number;
  max?: number;
  default: any[];
}

export type Field = BaseFieldOptions | MultipleFieldOptions;

declare module "../../types" {
  export interface SettingsFieldMapping {
    select: Field;
  }
}

defineProps<{
  field: Field;
}>();
</script>
<template>
  <UiSelect
    :name="field.name"
    :label="field.label"
    :items="field.options"
    :multiple="(field as MultipleFieldOptions).multiple"
    :placeholder="field.placeholder"
    :hint="field.hint"
    :search="field.options.length > 5"
    clearable
  />
</template>
