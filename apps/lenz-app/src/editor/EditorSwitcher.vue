<script setup lang="ts">
import {
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectViewport,
} from "reka-ui";
import { computed } from "vue";
import type { EditorProvider } from "../providers";

const props = defineProps<{ providers: EditorProvider[]; activeId: string }>();
defineEmits<{ select: [id: string] }>();

const active = computed(() => props.providers.find((p) => p.id === props.activeId));
</script>

<template>
  <SelectRoot :model-value="activeId" @update:model-value="$emit('select', String($event))">
    <SelectTrigger class="editor-switcher" aria-label="Editor">
      <Icon v-if="active?.icon" :name="active.icon" class="size-3.5" />
      <span>{{ active?.label }}</span>
      <Icon name="lucide:chevron-down" class="size-3.5 opacity-60" />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent class="editor-switcher-content" position="popper" align="end" :side-offset="4">
        <SelectViewport>
          <SelectItem
            v-for="provider in providers"
            :key="provider.id"
            :value="provider.id"
            class="editor-switcher-item"
          >
            <Icon v-if="provider.icon" :name="provider.icon" class="size-3.5" />
            <SelectItemText>{{ provider.label }}</SelectItemText>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<style>
.editor-switcher {
  @apply ml-auto flex h-6 shrink-0 cursor-pointer items-center gap-1.5 rounded border border-[var(--ide-border)] bg-[var(--ide-menu-bg)] px-1.5 text-xs text-[var(--ide-fg)] outline-none focus-visible:outline focus-visible:outline-[var(--ide-accent)];
}
.editor-switcher-content {
  @apply z-50 min-w-32 rounded-md border border-[var(--ide-menu-border)] bg-[var(--ide-menu-bg)] p-1 text-xs text-[var(--ide-fg)] shadow-lg;
}
.editor-switcher-item {
  @apply flex h-7 cursor-pointer items-center gap-1.5 rounded px-2 outline-none select-none data-[highlighted]:bg-white/10 data-[state=checked]:text-[var(--ide-activitybar-fg)];
}
</style>
