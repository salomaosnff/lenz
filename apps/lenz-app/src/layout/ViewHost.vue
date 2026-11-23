<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef, toRaw, watch } from "vue";
import { getViewProvider } from "../providers";
import type { ViewContent, ViewLocation } from "../providers";
import ContentHost from "./ContentHost.vue";
import type { ViewDefinition } from "./types";

const props = defineProps<{ view: ViewDefinition; location: ViewLocation }>();

const content = shallowRef<ViewContent | null>(null);
const error = ref<string | null>(null);
let token = 0;

/** Resolves the content from the provider, or falls back to the view's own component. */
async function resolve() {
  const current = ++token;
  const provider = getViewProvider(props.view.id);
  if (!provider) {
    error.value = null;
    content.value = props.view.component
      ? { type: "vue-component", component: toRaw(props.view.component), props: props.view.props }
      : null;
    return;
  }
  try {
    const result = await provider.resolveView({ viewId: props.view.id, location: props.location });
    if (current !== token) return; // a newer resolve superseded this one
    error.value = null;
    content.value = result;
  } catch (e) {
    if (current !== token) return;
    error.value = e instanceof Error ? e.message : String(e);
    content.value = null;
  }
}

// Re-resolve when the provider is (un)registered, announces a change, or the view moves.
watch(
  () => [getViewProvider(props.view.id), props.location] as const,
  (_, __, onCleanup) => {
    resolve();
    const subscription = getViewProvider(props.view.id)?.onDidChange?.(resolve);
    onCleanup(() => subscription?.dispose());
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  token++;
});
</script>

<template>
  <ContentHost v-if="content" :content="content" />
  <p v-else-if="error" class="placeholder-message">Não foi possível carregar a view: {{ error }}</p>
</template>
