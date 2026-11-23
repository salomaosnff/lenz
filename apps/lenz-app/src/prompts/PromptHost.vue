<script setup lang="ts">
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from "reka-ui";
import { ref, watch } from "vue";
import "../extensions/ui.css";
import { currentPrompt, type PromptRequest } from ".";
import PromptInput from "./PromptInput.vue";
import PromptPick from "./PromptPick.vue";

// Keeps showing the prompt while the dialog fades out, after it was answered.
const shown = ref<PromptRequest>();
watch(currentPrompt, (request) => request && (shown.value = request), { immediate: true });

// A new prompt gets a fresh component, even if it is of the same kind as the one before.
const keys = new WeakMap<PromptRequest, number>();
let counter = 0;
const keyOf = (request: PromptRequest) => {
  if (!keys.has(request)) keys.set(request, ++counter);
  return keys.get(request);
};

/** Esc, or a click elsewhere (unless the prompt asked to stay): gives up. */
const close = () => currentPrompt.value?.answer();
</script>

<template>
  <DialogRoot :open="!!currentPrompt" @update:open="(open) => !open && close()">
    <DialogPortal>
      <DialogOverlay class="prompt-overlay" />
      <DialogContent
        v-if="shown"
        class="prompt"
        :aria-describedby="undefined"
        @open-auto-focus.prevent
        @interact-outside="(event) => shown?.ignoreFocusOut && event.preventDefault()"
      >
        <DialogTitle :class="shown.title ? 'prompt-title' : 'sr-only'">
          {{ shown.title ?? "Entrada" }}
        </DialogTitle>
        <PromptInput v-if="shown.kind === 'input'" :key="keyOf(shown)" :request="shown" />
        <PromptPick v-else :key="keyOf(shown)" :request="shown" />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style>
.prompt-overlay {
  @apply fixed inset-0 z-50 bg-black/30;
}
.prompt-overlay[data-state="open"] {
  animation: prompt-fade-in 120ms ease-out;
}
.prompt-overlay[data-state="closed"] {
  animation: prompt-fade-out 100ms ease-in forwards;
}
.prompt {
  @apply fixed inset-x-0 top-[12vh] z-50 mx-auto flex max-h-[60vh] w-[min(640px,92vw)] flex-col overflow-hidden rounded-lg border border-[var(--ide-menu-border)] bg-[var(--ide-menu-bg)] text-[var(--ide-fg)] shadow-[0_12px_32px_rgba(0,0,0,0.5)];
}
.prompt[data-state="open"] {
  animation: prompt-in 150ms cubic-bezier(0.16, 1, 0.3, 1);
}
.prompt[data-state="closed"] {
  animation: prompt-out 100ms ease-in forwards;
}
@keyframes prompt-fade-in {
  from {
    opacity: 0;
  }
}
@keyframes prompt-fade-out {
  to {
    opacity: 0;
  }
}
@keyframes prompt-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
}
@keyframes prompt-out {
  to {
    opacity: 0;
    transform: translateY(-4px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .prompt,
  .prompt-overlay {
    animation: none !important;
  }
}
.prompt-title {
  @apply m-0 px-4 pt-3 text-[12px] font-medium text-[var(--ide-fg-muted)];
}
.prompt-input,
.prompt-pick {
  @apply flex min-h-0 flex-col;
}
.prompt-input {
  @apply gap-1 p-3;
}
.prompt-row {
  @apply flex items-center gap-2;
}
.prompt-row .prompt-field {
  @apply min-w-0 flex-1;
}
.prompt-field {
  @apply w-full rounded-md border border-[var(--ide-border)] bg-transparent px-3 py-2 text-sm text-inherit outline-none focus:border-[var(--ide-accent)];
}
.prompt-pick .prompt-field {
  @apply m-3 mb-1 w-auto;
}
.prompt-field-error {
  @apply border-red-500 focus:border-red-500;
}
.prompt-hint {
  @apply m-0 px-1 text-[12px] text-[var(--ide-fg-muted)];
}
.prompt-message {
  @apply m-0 px-1 text-[12px];
}
.prompt-message-error {
  @apply text-red-400;
}
.prompt-message-warning {
  @apply text-amber-400;
}
.prompt-message-info {
  @apply text-sky-400;
}
.prompt-list {
  @apply m-0 min-h-0 flex-1 list-none overflow-y-auto p-1;
}
.prompt-item {
  @apply flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-[13px];
}
.prompt-item[aria-selected="true"] {
  @apply bg-[var(--ide-accent)] text-[var(--color-primary-foreground)];
}
.prompt-check {
  @apply size-4 shrink-0;
}
.prompt-label {
  @apply flex items-baseline gap-2;
}
.prompt-description {
  @apply truncate text-[12px] opacity-60;
}
.prompt-detail {
  @apply truncate text-[12px] opacity-60;
}
.prompt-match {
  @apply bg-transparent font-semibold text-[var(--ide-accent)];
}
.prompt-item[aria-selected="true"] .prompt-match {
  @apply text-inherit underline;
}
.prompt-separator {
  @apply px-3 pt-2 pb-1 text-[11px] font-medium tracking-wide text-[var(--ide-fg-muted)] uppercase;
}
.prompt-empty {
  @apply flex items-center justify-center gap-2 px-3 py-4 text-[13px] text-[var(--ide-fg-muted)];
}
.prompt-footer {
  @apply flex items-center justify-between border-t border-[var(--ide-border)] px-3 py-2 text-[12px];
}
</style>
