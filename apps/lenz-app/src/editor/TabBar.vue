<script setup lang="ts">
import { useEditorStore } from "./store";

const editor = useEditorStore();
</script>

<template>
  <div v-if="editor.activeTab" class="filebar" :title="editor.activeTab.id">
    <Icon :name="editor.activeTab.icon ?? 'lucide:file-text'" class="size-4 shrink-0" />
    <span class="filebar-name">{{ editor.activeTab.name }}</span>
    <span
      v-if="editor.isDirty(editor.activeTab)"
      class="filebar-dirty"
      aria-label="Alterações não salvas"
    />
    <slot />
  </div>
</template>

<style>
.filebar {
  @apply flex h-9 shrink-0 items-center gap-1.5 border-b border-[var(--ide-border)] px-3 text-[13px] text-[var(--ide-activitybar-fg)] select-none;
}
.filebar-name {
  @apply min-w-0 truncate;
}
.filebar-dirty {
  @apply size-2 shrink-0 rounded-full bg-[var(--ide-fg)];
}
</style>
