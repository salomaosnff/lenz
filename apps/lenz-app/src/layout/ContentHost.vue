<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import type { ViewContent } from "../providers";

const props = defineProps<{ content: ViewContent }>();

const container = ref<HTMLElement>();
let cleanup: (() => void) | undefined;

function runCleanup() {
  cleanup?.();
  cleanup = undefined;
}

// Imperative content is (re)mounted whenever the content or its container changes.
watch(
  [() => props.content, container],
  ([value, el]) => {
    runCleanup();
    el?.shadowRoot?.replaceChildren();
    if (value.type === "shadow-dom" && el) {
      // attachShadow works once per element, so reuse the root when the content is replaced.
      const root = el.shadowRoot ?? el.attachShadow({ mode: "open" });
      cleanup = value.mount(root) || undefined;
    }
  },
  { flush: "post" },
);

onBeforeUnmount(runCleanup);
</script>

<template>
  <component
    :is="content.component"
    v-if="content.type === 'vue-component'"
    v-bind="content.props"
  />
  <div v-else-if="content.type === 'shadow-dom'" ref="container" class="view-host-mount" />
</template>
