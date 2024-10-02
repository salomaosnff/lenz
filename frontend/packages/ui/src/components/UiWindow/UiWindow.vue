<script setup lang="ts">
import { onClickOutside, useEventListener } from "@vueuse/core";
import icon_close from "lenz:icons/close";
import { computed, onMounted, ref, shallowRef } from "vue";

defineProps<{
  title?: string;
  resizable?: boolean;
  closable?: boolean;
  modal?: boolean;
  movable?: boolean;
}>();

const emit = defineEmits<{
  open: [];
  close: [];
  resizestart: [position: { width: number; height: number }];
  resize: [size: { width: number; height: number }];
  resizeend: [size: { width: number; height: number }];
  movestart: [position: { x: number; y: number }];
  move: [position: { x: number; y: number }];
  moveend: [position: { x: number; y: number }];
}>();

const focused = defineModel<boolean>("focused");

const visible = defineModel<boolean>("visible", {
  default: true,
});

const width = defineModel<number>("width", {
  default: 800,
});

const height = defineModel<number>("height", {
  default: 600,
});

const x = defineModel<number>("x", {
  default: 0,
  get(v) {
    return Math.min(
      document.body.clientWidth - 64,
      Math.max(-width.value + 64, v)
    );
  },
});

const y = defineModel<number>("y", {
  default: 0,
  get(v) {
    return Math.min(document.body.clientHeight - 32, Math.max(0, v));
  },
});

const style = computed(() => ({
  left: `${x.value}px`,
  top: `${y.value}px`,
  width: `${width.value}px`,
  height: `${height.value}px`,
}));

const lastMoveEvent = shallowRef<PointerEvent>();
const lastResizeEvent = shallowRef<PointerEvent>();

useEventListener(
  document,
  "pointermove",
  (event) => {
    if (lastMoveEvent.value) {
      event.stopPropagation();
      const dx = event.clientX - lastMoveEvent.value.clientX;
      const dy = event.clientY - lastMoveEvent.value.clientY;

      x.value += dx;
      y.value += dy;

      lastMoveEvent.value = event;

      emit("move", { x: x.value, y: y.value });
    }

    if (lastResizeEvent.value) {
      event.stopPropagation();

      const dx =
        Math.floor(event.clientX) - Math.floor(lastResizeEvent.value.clientX);
      const dy =
        Math.floor(event.clientY) - Math.floor(lastResizeEvent.value.clientY);

      width.value += dx;
      height.value += dy;

      lastResizeEvent.value = event;

      emit("resize", { width: width.value, height: height.value });
    }
  },
  { capture: true, passive: true }
);

useEventListener(window, "pointerup", () => {
  if (lastResizeEvent.value) {
    emit("resizeend", { width: width.value, height: height.value });
  }

  if (lastMoveEvent.value) {
    emit("moveend", { x: x.value, y: y.value });
  }

  lastResizeEvent.value = undefined;
  lastMoveEvent.value = undefined;
});

const windowVisible = ref();
const el = ref<HTMLElement>();

function focus() {
  el.value?.focus();
  focused.value = true;
}

onMounted(() => {
  if (windowVisible.value) {
    focus();
  }
});

defineExpose({ focus });

onClickOutside(el, () => {
  focused.value = false;
});
</script>
<template>
  <Transition
    appear
    @enter="(windowVisible = true), emit('open')"
    @after-leave="((windowVisible = false), (visible = false)), emit('close')"
  >
    <div
      v-if="visible"
      ref="el"
      class="app-window select-none fixed z-10"
      tabindex="-1"
      :class="{
        'w-full h-full top-0 left-0 app-window-backdrop': modal,
        '!z-100': focused,
      }"
      @keydown.esc="windowVisible = false"
      @pointerdown.capture="focus"
      @focus="focused = true"
    >
      <Transition @after-leave="visible = false">
        <div
          v-if="windowVisible"
          class="app-window__box fixed min-w-32 min-h-32"
          :style
        >
          <div
            class="app-window__header"
            :class="[
              movable && [lastMoveEvent ? 'cursor-grabbing' : 'cursor-grab'],
            ]"
            @pointerdown="
              movable && ((lastMoveEvent = $event), emit('movestart', { x, y }))
            "
          >
            <slot name="title">
              <div class="app-window__title text-center truncate">
                {{ title }}
              </div>
            </slot>
            <div>
              <UiIcon
                v-if="closable"
                :path="icon_close"
                class="fg--muted cursor-pointer hover:fg--foreground"
                title="Fechar"
                @click="windowVisible = false"
              />
            </div>
          </div>
          <div
            class="flex-1 select-text overflow-auto"
            :class="{ 'pointer-events-none': lastMoveEvent || lastResizeEvent }"
          >
            <slot />
          </div>
          <div
            v-if="resizable"
            class="w-4 h-4 absolute bottom--2 right--2 cursor-se-resize"
            @pointerdown.stop.prevent="
              (lastResizeEvent = $event), emit('resizestart', { width, height })
            "
          />
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style lang="scss">
.app-window {
  &-backdrop {
    backdrop-filter: blur(4px);
    background: rgba(0, 0, 0, 0.5);
  }

  &.v-enter-active,
  &.v-leave-active {
    transition: all 0.25s ease;
  }

  &.v-enter-from,
  &.v-leave-to {
    opacity: 0;
  }

  &__header {
    @apply flex gap-2 items-center pa-2 w-full;
  }

  &__title {
    @apply flex-1 font-bold;
  }

  &__box {
    @apply flex flex-col w-full h-full rounded-lg shadow-md bg--surface;
    border: 1px solid var(--color-surface-muted);
    backface-visibility: hidden;

    &.v-enter-active,
    &.v-leave-active {
      transition: all 0.25s ease;
    }

    &.v-enter-from,
    &.v-leave-to {
      opacity: 0;
      transform: perspective(800px) rotate3d(1, 0, 0, 90deg) scale(0.5);
    }

    &.v-enter-to,
    &.v-leave-from {
      opacity: 1;
      transform: perspective(800px) rotate3d(0, 0, 0, 0deg) scale(1);
    }
  }
}
</style>
