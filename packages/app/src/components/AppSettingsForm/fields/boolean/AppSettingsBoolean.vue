<script setup lang="ts">
import { BaseSettingsField } from "../../types";

export interface Field extends BaseSettingsField {
  type: "boolean";
  default?: boolean;
}

declare module "../../types" {
  export interface SettingsFieldMapping {
    boolean: Field;
  }
}

const props = defineProps<{
  field: Field;
}>();

const modelValue = defineModel<boolean>({ default: undefined });

const { canSet, error } = useFormField({
  key: () => props.field.name,
  modelValue,
});
</script>
<template>
  <UiCheckbox
    v-model="modelValue"
    :name="field.name"
    :disabled="!canSet()"
    class="!flex"
  >
    <div>
      <p v-if="field.label" class="mt--1px">{{ field.label }}</p>
      <p v-if="error" class="fg--danger text-3 opacity-50">{{ error }}</p>
      <p v-else-if="field.hint" class="text-3 opacity-50">{{ field.hint }}</p>
    </div>
  </UiCheckbox>
</template>
