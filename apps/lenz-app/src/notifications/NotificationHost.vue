<script setup lang="ts">
import {
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from "reka-ui";
import { useResizeObserver } from "@vueuse/core";
import { computed, ref, shallowRef, watch, type ComponentPublicInstance } from "vue";
import { dismissAllNotifications, notices, orderedToasts, type Notice, type Severity } from ".";

// The ones behind take the height of the one in front, so the stack reads as one card.
const frontEl = shallowRef<HTMLElement>();
const frontHeight = ref(0);
useResizeObserver(frontEl, ([entry]) => {
  frontHeight.value = entry?.borderBoxSize?.[0]?.blockSize ?? frontEl.value?.offsetHeight ?? 0;
});
function trackFront(el: Element | ComponentPublicInstance | null, position: number) {
  if (position === 0 && el instanceof HTMLElement) frontEl.value = el;
}

/** How many notifications show behind the one in front; the rest are hidden until their turn. */
const LAYERS = 4;

const toasts = computed(orderedToasts);
// One dialog at a time; the next shows when this one is answered.
const modal = computed(() => notices.find((n) => n.modal));

// The dialog keeps showing what it showed while it fades out, after the message was answered.
const shown = ref<Notice>();
watch(modal, (notice) => notice && (shown.value = notice), { immediate: true });

const icons: Record<Severity, string> = {
  info: "lucide:info",
  warning: "lucide:triangle-alert",
  error: "lucide:circle-x",
};

/** Closing a dialog (Esc) is its cancel button, or just closing it when it has none. */
const dismiss = (notice: Notice) =>
  notice.answer(notice.closeIndex === -1 ? undefined : notice.closeIndex);
</script>

<template>
  <TransitionGroup tag="div" name="toast" class="toasts" role="region" aria-label="Notificações">
    <div
      v-for="(notice, position) in toasts"
      :key="notice.id"
      class="toast"
      :class="[
        `toast-${notice.severity}`,
        { 'toast-front': position === 0, 'toast-gone': position > LAYERS },
      ]"
      :ref="(el) => trackFront(el, position)"
      :style="{
        '--depth': Math.min(position, LAYERS),
        height: position > 0 && frontHeight ? `${frontHeight}px` : undefined,
      }"
      :role="position === 0 ? (notice.severity === 'error' ? 'alert' : 'status') : undefined"
      :inert="position > 0"
      :aria-hidden="position > 0 ? true : undefined"
    >
      <Icon :name="icons[notice.severity]" class="toast-icon" />
      <div class="min-w-0 flex-1">
        <p class="toast-message">{{ notice.message }}</p>
        <p v-if="notice.source || toasts.length > 1" class="toast-source">
          <template v-if="notice.source">Origem: {{ notice.source }}</template>
          <template v-if="position === 0 && toasts.length > 1">
            {{ notice.source ? " · " : "" }}+{{ toasts.length - 1 }} na fila ·
            <button class="toast-link" @click="dismissAllNotifications()">Fechar todas</button>
          </template>
        </p>
        <div v-if="notice.labels.length" class="toast-actions">
          <button
            v-for="(label, index) in notice.labels"
            :key="index"
            class="ext-btn"
            :class="{ 'ext-btn-primary': index === 0 }"
            @click="notice.answer(index)"
          >
            {{ label }}
          </button>
        </div>
      </div>
      <button class="toast-close" aria-label="Fechar a notificação" @click="notice.answer()">
        <Icon name="lucide:x" class="size-3.5" />
      </button>
    </div>
  </TransitionGroup>

  <AlertDialogRoot :open="!!modal" @update:open="(open) => !open && modal && dismiss(modal)">
    <AlertDialogPortal>
      <AlertDialogOverlay class="modal-overlay" />
      <AlertDialogContent v-if="shown" class="modal">
        <div class="flex gap-3">
          <Icon
            :name="icons[shown.severity]"
            class="toast-icon modal-icon"
            :class="`toast-${shown.severity}`"
          />
          <div class="min-w-0 flex-1">
            <AlertDialogTitle class="modal-title">{{ shown.message }}</AlertDialogTitle>
            <AlertDialogDescription v-if="shown.detail" class="modal-detail">
              {{ shown.detail }}
            </AlertDialogDescription>
            <p v-if="shown.source" class="toast-source">Origem: {{ shown.source }}</p>
          </div>
        </div>
        <div class="modal-actions">
          <button
            v-for="(label, index) in shown.labels"
            :key="index"
            class="ext-btn"
            :class="{ 'ext-btn-primary': index === 0 && index !== shown.closeIndex }"
            @click="shown.answer(index)"
          >
            {{ label }}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>

<style>
.toasts {
  /* All the notifications share one cell, one behind the other, seen in perspective. */
  @apply pointer-events-none fixed right-4 bottom-10 z-50 grid w-96 max-w-[calc(100vw-2rem)] items-end;
  perspective: 450px;
  perspective-origin: 50% 100%;
}
.toast {
  @apply flex items-start gap-2.5 rounded-lg border border-[var(--ide-menu-border)] bg-[var(--ide-menu-bg)] p-3 text-[13px] text-[var(--ide-fg)] shadow-[0_8px_24px_rgba(0,0,0,0.45)];
  grid-area: 1 / 1;
  z-index: calc(10 - var(--depth));
  transform-origin: 50% 100%;
  /* Each layer is pushed back and up, so the ones behind peek out above the front one. */
  transform: translateY(calc(var(--depth) * -22px)) translateZ(calc(var(--depth) * -55px));
  opacity: calc(1 - var(--depth) * 0.2);
  transition:
    transform 300ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 250ms ease;
}
.toast-front {
  @apply pointer-events-auto;
}
/* Behind the front one, a notification is just a card edge: its content waits for its turn. */
.toast > * {
  transition: opacity 200ms ease 80ms;
}
.toast:not(.toast-front) {
  overflow: hidden;
}
.toast:not(.toast-front) > * {
  opacity: 0;
}
.toast-gone {
  opacity: 0;
}
.toast-icon {
  @apply mt-px size-4 shrink-0;
}
.toast-info .toast-icon,
.toast-icon.toast-info {
  @apply text-sky-400;
}
.toast-warning .toast-icon,
.toast-icon.toast-warning {
  @apply text-amber-400;
}
.toast-error .toast-icon,
.toast-icon.toast-error {
  @apply text-red-400;
}
.toast-message {
  @apply m-0 break-words;
}
.toast-source {
  @apply mt-1 text-[11px] text-[var(--ide-fg-muted)];
}
.toast-link {
  @apply cursor-pointer border-0 bg-transparent p-0 text-[11px] text-[var(--ide-accent)] underline-offset-2 outline-none hover:underline focus-visible:underline;
}
.toast-actions {
  @apply mt-2 flex flex-wrap justify-end gap-2;
}
.toast-close {
  @apply flex size-5 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-[var(--ide-fg-muted)] outline-none hover:bg-white/10 hover:text-[var(--ide-fg)];
}
.modal-overlay {
  @apply fixed inset-0 z-50 bg-black/50;
}
.modal-overlay[data-state="open"] {
  animation: modal-fade-in 150ms ease-out;
}
.modal-overlay[data-state="closed"] {
  animation: modal-fade-out 120ms ease-in forwards;
}
.modal[data-state="open"] {
  animation: modal-in 180ms cubic-bezier(0.16, 1, 0.3, 1);
}
.modal[data-state="closed"] {
  animation: modal-out 120ms ease-in forwards;
}
@keyframes modal-fade-in {
  from {
    opacity: 0;
  }
}
@keyframes modal-fade-out {
  to {
    opacity: 0;
  }
}
@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.96);
  }
}
@keyframes modal-out {
  to {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
}

/* A notification rises into place from below; when it leaves it fades, and the next comes forward. */
.toast-enter-from {
  opacity: 0;
  transform: translateY(16px) translateZ(calc(var(--depth) * -55px));
}
.toast-leave-active {
  transition:
    opacity 150ms ease-in,
    transform 150ms ease-in;
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}
@media (prefers-reduced-motion: reduce) {
  .toast,
  .modal,
  .modal-overlay {
    transition: none !important;
    animation: none !important;
  }
}
.modal {
  @apply fixed inset-x-0 top-1/3 z-50 mx-auto w-[28rem] max-w-[calc(100vw-2rem)] rounded-lg border border-[var(--ide-menu-border)] bg-[var(--ide-menu-bg)] p-4 text-[13px] text-[var(--ide-fg)] shadow-[0_8px_24px_rgba(0,0,0,0.45)] outline-none;
}
.modal-icon {
  @apply size-6;
}
.modal-title {
  @apply m-0 text-[14px] font-semibold break-words;
}
.modal-detail {
  @apply mt-1.5 break-words text-[var(--ide-fg-muted)];
}
.modal-actions {
  @apply mt-4 flex flex-wrap justify-end gap-2;
}
</style>
