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
const tagName = ref<string[]>();

const { selection } = props.getData();

function updateSelection() {
  tagName.value = selection.value.map(({ element }) => element.tagName.toLowerCase());

  attrs.value = Object.fromEntries(
    selection.value.flatMap(({ element }) =>
      Array.from(element.attributes).map((attr) => [attr.name, attr.value])
    )
  );

  schema.value = (() => {
    const result = structuredClone(schemaStore.getDerefSchema("base.html"));

    for (const { element } of selection.value) {
      const tag = element.tagName.toLowerCase();

      try {
        const schema = schemaStore.getDerefSchema(`html.${tag}`);
        Object.assign(result.properties, schema.allOf[1].properties);
      } catch {
        continue;
      }
    }

    return result
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

  return selection.value.map(({ element }) => {
    let str = "<" + element.tagName.toLowerCase();

    for (const [key, value] of Object.entries(attrs.value)) {
      str += `\n  ${key}`;

      if (value === undefined || value === "" || value === null) {
        continue;
      }

      str += `="${value}"`;
    }

    str += "\n>";

    return str;
  }).join("\n");
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
    <p v-for="tag in tagName" class="mt-4">
      Aprenda mais sobre <code>&lt;{{ tag }}&gt;</code> em
      <a :href="`https://developer.mozilla.org/pt-BR/docs/Web/HTML/Element/${tag}`" target="_blank" rel="noopener">MDN
        Web Docs</a>
    </p>
  </div>
</template>
