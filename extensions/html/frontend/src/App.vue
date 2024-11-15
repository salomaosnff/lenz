<script setup lang="ts">
import { ref, watch } from "vue";

import * as LenzReactivity from "lenz:reactivity";

import schemaStore from './schema'
import { JSONSchema7 } from "json-schema";

import JsonForm from '@lenz/json-forms/components/JsonForm.vue'

const props = defineProps<{
  getData: () => {
    selection: LenzReactivity.Ref<{ element: HTMLElement; selector: string }[]>;
  };
}>();

const schema = ref<JSONSchema7>()
const attrs = ref<Record<string, string>>({});

const { selection } = props.getData();

function updateSelection() {
  const element = selection.value[0]?.element;
  const tag = element.tagName.toLowerCase();
  attrs.value = Object.fromEntries(
    Array.from(element.attributes).map((attr) => [attr.name, attr.value])
  );

  schema.value = (() => {
    try {
      return schemaStore.getDerefSchema(`html.${tag}`)
    } catch {
      return schemaStore.getDerefSchema('base.html')
    }
  })()


}

LenzReactivity.watch(selection, updateSelection, { immediate: true });

let timer: number | undefined;

function debouncedSend() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const element = selection.value[0]?.element;

    if (!element) return;

    for (const [key, value] of Object.entries(attrs.value)) {
      if (value === undefined || value === "" || value === null) {
        element.removeAttribute(key);
      } else {
        element.setAttribute(key, value);
      }
    }
  }, 1000 / 30);
}

watch(attrs, debouncedSend, { deep: true });
</script>

<template>
  <JsonForm v-if="schema" :schema v-model="attrs" />
  <div v-else>Selecione um elemento</div>
</template>
