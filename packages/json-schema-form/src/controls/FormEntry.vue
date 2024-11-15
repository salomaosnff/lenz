<script setup lang="ts">
import type { FormElement } from "../core/types";
import ArrayControl from "./ArrayControl.vue";
import CheckboxControl from "./CheckboxControl.vue";
import NumberControl from "./NumberControl.vue";
import ObjectFormControl from "./ObjectControl.vue";
import SelectControl from "./SelectControl.vue";
import TextControl from "./TextControl.vue";
import VerticalLayout from "./VerticalLayout.vue";

defineProps<{
  entry: FormElement;
}>();

const value = defineModel<any>();
</script>
<template>
  <VerticalLayout v-if="entry.type === 'VerticalLayout'" :entry="entry" />
  <TextControl
    v-else-if="entry.type === 'TextControl'"
    v-model="value"
    :entry="entry"
  />
  <NumberControl
    v-else-if="entry.type === 'NumberControl'"
    v-model="value"
    :entry="entry"
  />
  <CheckboxControl
    v-else-if="entry.type === 'CheckboxControl'"
    v-model="value"
    :entry="entry"
  />
  <SelectControl
    v-else-if="entry.type === 'SelectControl'"
    v-model="value"
    :entry="entry"
  />
  <ObjectFormControl
    v-else-if="entry.type === 'ObjectControl'"
    v-model="value"
    :entry="entry"
  />
  <ArrayControl
    v-else-if="entry.type === 'ArrayControl'"
    v-model="value"
    :entry="entry"
  />
</template>
