<script setup lang="ts">
import { WebviewChannel } from './types';

const props = defineProps<{
  content?: string;
  channels?: Record<string, WebviewChannel<unknown>>;
}>()

function injectLenzData(event: Event) {
  const iframe = event.target as HTMLIFrameElement;
  const contentWindow = iframe.contentWindow as any;

  contentWindow.__LENZ__CHANNELS = props.channels ?? {};
  contentWindow.onUiReady?.({
    channels: props.channels ?? {},
  });
}
</script>
<template>
  <iframe :srcdoc="content" frameborder="0" @load="injectLenzData"></iframe>
</template>
