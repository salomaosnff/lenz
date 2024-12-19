<script setup lang="ts">
const props = defineProps({
  defaultUnit: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "Digite um valor",
  },
});
const modelValue = defineModel<string>();

function incrementValue(amount = 1) {
  if (!modelValue.value) {
    modelValue.value = `1${props.defaultUnit}`;
    return;
  }

  const [, valueText, unit = ""] =
    modelValue.value.match(/^(-?(?:\d+)?(?:\.\d+)?)([a-z]+|%)?$/) || [];
  const value = parseFloat(valueText);

  if (isNaN(value)) {
    modelValue.value = `0${props.defaultUnit}`;
    return;
  }

  modelValue.value = `${value + amount}${unit}`;
}
</script>
<template>
  <input
    type="text"
    v-model="modelValue"
    :placeholder
    autocomplete="off"
    @keydown.up.prevent="incrementValue($event.ctrlKey ? 10 : 1)"
    @keydown.down.prevent="incrementValue($event.ctrlKey ? -10 : -1)"
  />
</template>
