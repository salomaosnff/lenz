<script setup lang="ts">
import type { EditorDocument } from "lenz-sdk";

defineProps<{ document: EditorDocument }>();
</script>

<template>
  <textarea
    class="editor-textarea"
    spellcheck="false"
    :aria-label="document.name"
    :value="document.content"
    @input="document.setContent(($event.target as HTMLTextAreaElement).value)"
  />
</template>

<style>
.editor-textarea {
  @apply block h-full w-full resize-none border-0 bg-transparent p-4 font-mono text-[13px] leading-5 text-[var(--ide-fg)] outline-none;
}
</style>
