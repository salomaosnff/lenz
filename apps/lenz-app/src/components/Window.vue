<script setup lang="ts">
import { useDraggable } from "@vueuse/core";
import { DialogClose, DialogContent, DialogPortal, DialogRoot, DialogTitle } from "reka-ui";
import { computed, ref } from "vue";

const props = withDefaults(
  defineProps<{
    title: string;
    open?: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    /** Removes the body padding. */
    flush?: boolean;
  }>(),
  {
    open: undefined,
    x: 96,
    y: 96,
    width: 420,
    height: 280,
    minWidth: 220,
    minHeight: 140,
  },
);

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const windowRef = ref<HTMLElement>();
const titlebarRef = ref<HTMLElement>();

const { style: dragStyle } = useDraggable(windowRef, {
  handle: titlebarRef,
  initialValue: { x: props.x, y: props.y },
  preventDefault: true,
});

const width = ref(props.width);
const height = ref(props.height);
const sizeStyle = computed(() => ({
  width: `${width.value}px`,
  height: `${height.value}px`,
}));

let resizeStart = { pointerX: 0, pointerY: 0, width: 0, height: 0 };

function onResizeStart(event: PointerEvent) {
  resizeStart = {
    pointerX: event.clientX,
    pointerY: event.clientY,
    width: width.value,
    height: height.value,
  };
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function onResizeMove(event: PointerEvent) {
  if (event.buttons === 0) return;
  width.value = Math.max(
    props.minWidth,
    resizeStart.width + (event.clientX - resizeStart.pointerX),
  );
  height.value = Math.max(
    props.minHeight,
    resizeStart.height + (event.clientY - resizeStart.pointerY),
  );
}
</script>

<template>
  <DialogRoot :open="open" :modal="false" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogContent
        as-child
        @escape-key-down.prevent
        @interact-outside.prevent
        :aria-describedby="undefined"
      >
        <div ref="windowRef" class="window" :style="[dragStyle, sizeStyle]">
          <div ref="titlebarRef" class="window-titlebar">
            <DialogTitle as="span" class="window-title">{{ title }}</DialogTitle>
            <div class="window-actions">
              <slot name="actions" />
              <DialogClose class="window-close" aria-label="Fechar">
                <Icon name="lucide:x" class="size-3.5" />
              </DialogClose>
            </div>
          </div>
          <div class="window-body" :class="{ flush }">
            <slot />
          </div>
          <div
            class="window-resize-handle"
            @pointerdown="onResizeStart"
            @pointermove="onResizeMove"
          />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style>
.window {
  @apply fixed z-40 flex flex-col overflow-hidden rounded-lg border border-[var(--ide-menu-border)] bg-[var(--ide-menu-bg)] text-[var(--ide-fg)] shadow-[0_8px_24px_rgba(0,0,0,0.45)];
}
.window-titlebar {
  @apply flex cursor-move items-center justify-between border-b border-[var(--ide-border)] px-3 py-1.5 select-none;
}
.window-title {
  @apply text-sm font-medium;
}
.window-actions {
  @apply flex items-center gap-0.5;
}
.window-action,
.window-close {
  @apply flex cursor-pointer items-center justify-center rounded border-0 bg-transparent p-1 text-inherit outline-none hover:bg-white/10;
}
.window-close:hover {
  @apply bg-red-500 text-white;
}
.window-body {
  @apply flex-1 overflow-auto p-3;
}
.window-body.flush {
  @apply p-0;
}
.window-resize-handle {
  @apply absolute right-0 bottom-0 size-3 cursor-nwse-resize;
}
</style>
