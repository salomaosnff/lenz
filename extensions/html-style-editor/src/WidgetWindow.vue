<script setup lang="ts">
import { computed } from "vue";
import type { HtmlEditorApi } from "html-visual-editor/api";
import GradientInput from "./GradientInput.vue";
import ShadowInput from "./ShadowInput.vue";
import { readInline, writeInline } from "./inline";

const props = defineProps<{ prop: string; api: HtmlEditorApi }>();

const session = computed(() => props.api.session.value);
const isGradient = computed(
  () => props.prop === "text-gradient" || props.prop === "background-image",
);

/** Follows the selected element: select another one and the window edits that one. */
const value = computed(() => {
  const current = session.value;
  const el = current?.selected.value;
  if (!current || !el) return null;
  void current.version.value; // the DOM is not reactive: re-read after each edit
  return readInline(el, props.prop);
});
const write = (next: string) => writeInline(session.value, props.prop, next);
</script>

<template>
  <div class="hse-window">
    <p v-if="value === null" class="hse-hint hse-shadow-empty">
      Selecione um elemento no editor visual para editar.
    </p>
    <GradientInput
      v-else-if="isGradient"
      :prop="prop"
      :model-value="value"
      :api="api"
      @update:model-value="write"
    />
    <ShadowInput v-else :prop="prop" :model-value="value" :api="api" @update:model-value="write" />
  </div>
</template>
