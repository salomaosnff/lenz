<script setup lang="ts">
import { useEditorStore } from "../editor/store";

const editor = useEditorStore();

defineProps<{ items?: { label: string; icon?: string; content?: string }[]; message?: string }>();
</script>

<template>
  <ul v-if="items?.length" class="placeholder-list">
    <li
      v-for="item in items"
      :key="item.label"
      class="placeholder-item"
      tabindex="0"
      @click="editor.open(item.label, item.content)"
      @keydown.enter="editor.open(item.label, item.content)"
    >
      {{ item.label }}
    </li>
  </ul>
  <p v-else class="placeholder-message">{{ message ?? "Nada para mostrar." }}</p>
</template>

<style>
.placeholder-list {
  @apply py-0.5;
}
.placeholder-item {
  @apply mx-1.5 cursor-pointer truncate rounded-md px-3 py-1 text-[13px] outline-none hover:bg-[var(--ide-hover)] focus-visible:bg-[var(--ide-hover)];
}
.placeholder-message {
  @apply px-5 py-2 text-[13px] text-[var(--ide-fg-muted)];
}
</style>
