<script setup lang="ts">
import { set as _set, merge } from "lodash-es";
import { APP_SETTINGS_FIELDS } from "./fields";
import { SettingsField, toZodSchema } from "./types";

const props = defineProps<{
  fields: Array<SettingsField>;
}>();

const modelValue = defineModel<any>();
const validModelValue = defineModel<any>("validValues");
const schema = computed(() => markRaw(toZodSchema(props.fields)));

const defaults = computed(() =>
  props.fields.reduce(
    (acc, field) => {
      _set(acc, field.name, field.default);
      return acc;
    },
    {} as Record<string, any>
  )
);

const normalizedModelValue = computed({
  get: () => merge({}, defaults.value, modelValue.value),
  set: (value) => {
    modelValue.value = merge({}, defaults.value, value);
  },
});
</script>
<template>
  <UiForm
    v-model="normalizedModelValue"
    v-model:valid-values="validModelValue"
    :schema
  >
    <component
      :is="APP_SETTINGS_FIELDS[field.type].component"
      v-for="field in fields"
      :key="field.name"
      :field="field"
      class="mb-4"
    />
    <slot name="footer"></slot>
  </UiForm>
</template>
