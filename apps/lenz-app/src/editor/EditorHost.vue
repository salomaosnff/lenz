<script setup lang="ts">
import { ref, shallowRef, watch } from "vue";
import type { EditorProvider, ViewContent } from "../providers";
import ContentHost from "../layout/ContentHost.vue";
import { documentFor } from "./document";
import type { EditorTab } from "./store";

const props = defineProps<{ tab: EditorTab; provider: EditorProvider }>();

const content = shallowRef<ViewContent | null>(null);
const error = ref<string | null>(null);
let token = 0;

// Resolve again whenever the tab or the chosen editor changes.
watch(
  () => [props.tab.id, props.provider] as const,
  async () => {
    const current = ++token;
    try {
      const result = await props.provider.resolveEditor({ document: documentFor(props.tab) });
      if (current !== token) return;
      error.value = null;
      content.value = result;
    } catch (e) {
      if (current !== token) return;
      error.value = e instanceof Error ? e.message : String(e);
      content.value = null;
    }
  },
  { immediate: true },
);
</script>

<template>
  <ContentHost v-if="content" :content="content" class="editor-host" />
  <p v-else-if="error" class="placeholder-message">
    Não foi possível abrir o editor "{{ provider.label }}": {{ error }}
  </p>
</template>
