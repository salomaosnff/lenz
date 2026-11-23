<script setup lang="ts">
import { useLayoutStore } from "./store";

const layout = useLayoutStore();
</script>

<template>
  <footer class="statusbar">
    <div class="statusbar-group">
      <button class="statusbar-item" title="Alternar barra lateral" @click="layout.toggleSidebar()">
        <Icon name="lucide:panel-left" class="size-3.5" />
      </button>
    </div>
    <div class="statusbar-group">
      <button
        class="statusbar-item"
        title="Alternar painel direito (Ctrl+Alt+B)"
        @click="layout.toggleSecondary()"
      >
        <Icon name="lucide:panel-right" class="size-3.5" />
      </button>
    </div>
  </footer>
</template>

<style>
.statusbar {
  @apply flex h-6 shrink-0 items-center justify-between border-t border-[var(--ide-border)] bg-[var(--ide-statusbar-bg)] px-2 text-xs text-[var(--ide-fg-muted)] select-none;
}
.statusbar-group {
  @apply flex h-full items-center;
}
.statusbar-item {
  @apply my-0.5 flex h-5 items-center gap-1 rounded px-2 outline-none;
}
button.statusbar-item {
  @apply cursor-pointer hover:bg-[var(--ide-hover)] hover:text-[var(--ide-fg)];
}
</style>
