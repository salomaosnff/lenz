<script setup lang="ts">
import { computed, ref } from "vue";
import type { HtmlEditorApi } from "html-visual-editor/api";
import { cssRule, declarationsOf, selectorOf, type Declaration } from "./css";

const props = defineProps<{
  prop: string;
  /** The value, already written the way the widget would write it. */
  value: string;
  /** More declarations of the same rule (the background options that are set). */
  extra?: Declaration[];
  api: HtmlEditorApi;
}>();

const code = computed(() => {
  const el = props.api.session.value?.selected.value;
  return cssRule(el ? selectorOf(el) : "elemento", [
    ...declarationsOf(props.prop, props.value),
    ...(props.extra ?? []),
  ]);
});

const copied = ref(false);
async function copy() {
  try {
    await navigator.clipboard.writeText(code.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    // The clipboard is not available (e.g. an insecure page); the text can still be selected.
  }
}
</script>

<template>
  <div class="hse-code">
    <div class="hse-code-head">
      <span>CSS</span>
      <button class="hse-icon-button" title="Copiar" aria-label="Copiar o CSS" @click="copy">
        <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="size-3.5" />
      </button>
    </div>
    <pre><code>{{ code }}</code></pre>
  </div>
</template>
