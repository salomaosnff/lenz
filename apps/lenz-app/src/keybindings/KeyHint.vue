<script setup lang="ts">
import { ref } from "vue";
import { keyHint } from ".";

const list = ref<HTMLElement>();

// Ctrl + wheel is the browser's zoom: over the list, the wheel scrolls the list instead.
function scroll(event: WheelEvent) {
  list.value?.scrollBy({ top: event.deltaY });
}
</script>

<template>
  <Transition name="key-hint">
    <aside v-if="keyHint" class="key-hint" aria-live="polite" aria-label="Atalhos disponíveis">
      <header class="key-hint-header">
        <kbd class="key-hint-key">{{ keyHint.pressed }}</kbd>
        <span>+ …</span>
      </header>
      <ul ref="list" class="key-hint-list" @wheel.prevent="scroll">
        <li v-for="item in keyHint.items" :key="item.keys + item.command" class="key-hint-item">
          <kbd class="key-hint-key">{{ item.keys }}</kbd>
          <span class="truncate">
            <span v-if="item.category" class="text-[var(--ide-fg-muted)]"
              >{{ item.category }}: </span
            >{{ item.title }}
          </span>
        </li>
      </ul>
    </aside>
  </Transition>
</template>

<style>
.key-hint {
  @apply fixed inset-x-0 top-11 z-50 mx-auto w-80 max-w-[calc(100vw-1.5rem)] rounded-lg border border-[var(--ide-menu-border)] bg-[var(--ide-menu-bg)] p-2 text-[13px] text-[var(--ide-fg)] shadow-[0_8px_24px_rgba(0,0,0,0.45)];
}
.key-hint-header {
  @apply mb-1 flex items-center gap-1.5 px-1 text-[12px] text-[var(--ide-fg-muted)];
}
.key-hint-list {
  @apply m-0 flex max-h-[60vh] list-none flex-col gap-0.5 overflow-y-auto p-0;
}
.key-hint-item {
  @apply flex items-center gap-3 rounded px-1 py-0.5;
}
.key-hint-item .key-hint-key {
  @apply w-28 shrink-0;
}
.key-hint-key {
  @apply rounded border border-[var(--ide-border)] bg-[var(--ide-hover)] px-1.5 py-px font-mono text-[12px] whitespace-nowrap;
}
.key-hint-enter-active {
  transition:
    opacity 120ms ease-out,
    transform 150ms ease-out;
}
.key-hint-leave-active {
  transition: opacity 100ms ease-in;
}
.key-hint-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.key-hint-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .key-hint-enter-active,
  .key-hint-leave-active {
    transition: none;
  }
}
</style>
