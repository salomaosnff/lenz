<script setup lang="ts">
import { computed, ref, watch } from "vue";

import * as LenzReactivity from "lenz:reactivity";

import schemaStore from "./schema";
import { JSONSchema7 } from "json-schema";

import JsonForm from "@lenz/json-forms/components/JsonForm.vue";

const props = defineProps<{
  getData: () => {
    selection: LenzReactivity.Ref<{ element: HTMLElement; selector: string }[]>;
  };
}>();

const schema = ref<JSONSchema7>();
const attrs = ref<Record<string, string>>({});
const tagName = ref<string>();

const { selection } = props.getData();

function updateSelection() {
  const element = selection.value[0]?.element;
  const tag = element.tagName.toLowerCase();

  tagName.value = tag;

  attrs.value = Object.fromEntries(
    Array.from(element.attributes).map((attr) => [attr.name, attr.value])
  );

  schema.value = (() => {
    try {
      return schemaStore.getDerefSchema(`html.${tag}`);
    } catch {
      return schemaStore.getDerefSchema("base.html");
    }
  })();
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

const html = computed(() => {
  let str = "<" + selection.value[0]?.element.tagName.toLowerCase();

  for (const [key, value] of Object.entries(attrs.value)) {
    str += `\n  ${key}`;

    if (value === undefined || value === "" || value === null) {
      continue;
    }

    str += `="${value}"`;
  }

  str += "\n>";

  return str;
});
</script>

<template>
  <div class="pa-4">
    <div class="flex gap-2">
      <JsonForm v-if="schema" :schema v-model="attrs" class="flex-1" />
      <div v-else class="flex-1">Selecione um elemento</div>
      <pre class="overflow-auto w-70 pa-2 bg-[var(--color-surface2)]">{{
        html
      }}</pre>
    </div>
    <p v-if="tagName" class="mt-4">
      Aprenda mais sobre <code>&lt;{{ tagName }}&gt;</code> em
      <a
        :href="`https://developer.mozilla.org/pt-BR/docs/Web/HTML/Element/${tagName}`"
        target="_blank"
        rel="noopener"
        >MDN Web Docs</a
      >
    </p>
  </div>
</template>
