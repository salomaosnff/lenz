<script setup lang="ts">
import { toRaw } from 'vue';


const props = defineProps<{
  content?: string;
  data?: Record<string, unknown>;
}>();

function injectLenzData(event: Event) {
  const iframe = event.target as HTMLIFrameElement;
  const contentWindow = iframe.contentWindow as Window & {
    __LENZ_UI_INIT: Record<string, unknown>;
  };

  contentWindow.__LENZ_UI_INIT = toRaw(props.data ?? {});

  // Propagate iframe window events to the parent window
  const EVENTS = new Set(Object.keys(window).filter((key) => key.startsWith("on")).map((key) => key.slice(2).toLowerCase()));

  EVENTS.delete("beforeunload")

  for (const event of EVENTS) {
    contentWindow.addEventListener(event, (e) => {
      window.dispatchEvent(new (e as any).constructor(e.type, e));
    });
  }

  contentWindow.dispatchEvent(new CustomEvent("lenz:ui:init", {
    detail: contentWindow.__LENZ_UI_INIT,
  }));
}
</script>
<template>
  <iframe :srcdoc="content" frameborder="0" @load="injectLenzData"></iframe>
</template>
