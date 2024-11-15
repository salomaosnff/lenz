<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import { onMounted, ref, shallowRef, watch } from "vue";

import iconClose from "lenz:icons/close";
import iconTriangle from "lenz:icons/triangle_down";

import { useMovable } from "../../composable/useMovable";

defineProps<{
  title?: string;
  resizable?: boolean;
  closable?: boolean;
  modal?: boolean;
  movable?: boolean;
  dense?: boolean;
  collapsible?: boolean;
  frame?: boolean;
  transparent?: boolean;
  shadow?: boolean;
  autoWidth?: boolean;
  autoHeight?: boolean;
}>();

const emit = defineEmits<{
  open: [];
  close: [];
  move: [position: { x: number; y: number }];
  movestart: [position: { x: number; y: number }];
  moveend: [position: { x: number; y: number }];
  resize: [size: { width: number; height: number }];
}>();


const focused = defineModel<boolean>("focused");

const visible = defineModel<boolean>("visible", {
  default: true,
});

const widthModel = defineModel<number>("width", {
  default: 800,
});

const heightModel = defineModel<number>("height", {
  default: 600,
});

const xModel = defineModel<number>("x", {
  default: 0,
  get(v) {
    return Math.min(
      document.body.clientWidth - 64,
      Math.max(-widthModel.value + 64, v)
    );
  },
});

const yModel = defineModel<number>("y", {
  default: 0,
  get(v) {
    return Math.min(document.body.clientHeight - 32, Math.max(0, v));
  },
});

const collapsed = ref(false);

const { x, y, startMove } = useMovable({
  x: xModel,
  y: yModel,
  onStart() {
    emit("movestart", { x: x.value, y: y.value });
  },
  onMove(x, y) {
    xModel.value = x;
    yModel.value = y;
    emit("move", { x, y });
  },
  onStop() {
    emit("moveend", { x: x.value, y: y.value });
  },
});

const lastMoveEvent = shallowRef<PointerEvent>();

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

const observer = new ResizeObserver((entries) => {
  if (collapsed.value) {
    return;
  }

  const entry = entries[0];

  widthModel.value = entry.borderBoxSize[0].inlineSize;
  heightModel.value = entry.borderBoxSize[0].blockSize;
});

watch(el, (el, oldEl) => {
  if (oldEl) {
    observer.unobserve(oldEl);
  }

  if (el) {
    observer.observe(el);
  }
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
      class="app-window select-none fixed"
      :class="[
        focused ? 'z-100' : 'z-10',
        {
          'inset-0 app-window-backdrop': modal,
        },
      ]"
    >
      <Transition @after-leave="visible = false">
        <div
          v-if="windowVisible"
          ref="el"
          class="app-window__frame fixed w-min h-min overflow-hidden min-h-min min-w-40"
          :class="{
            'app-window__frame--no-frame': !frame,
            resize: resizable && !collapsed,
            'app-window__frame--dense': dense,
            'bg--surface': !transparent,
            'shadow--md': shadow,
          }"
          :style="[
            {
              left: `${x}px`,
              top: `${y}px`,
              width: autoWidth ? 'max-content' : `${widthModel}px`,
              height: collapsed ? '0' : autoHeight ? 'max-content' : `${heightModel}px`,
            },
          ]"
          tabindex="-1"
          @keydown.esc="windowVisible = false"
          @pointerdown.capture="focus"
          @focus="focused = true"
        >
          <div
            v-if="frame"
            class="app-window__header bg--surface"
            :class="[
              movable && [lastMoveEvent ? 'cursor-grabbing' : 'cursor-grab'],
            ]"
            @pointerdown="movable && startMove($event)"
          >
            <slot name="title">
              <div class="app-window__title truncate">
                {{ title }}
              </div>
            </slot>
            <div class="flex gap-2 items-center">
              <div
                v-if="collapsible"
                class="fg--muted cursor-pointer hover:fg--foreground text-3"
                title="Enrrolar"
                @click="collapsed = !collapsed"
              >
                <UiIcon :path="iconTriangle" />
              </div>
              <div
                v-if="closable"
                class="fg--muted cursor-pointer hover:fg--foreground"
              >
                <UiIcon
                  :path="iconClose"
                  class="text-1rem"
                  title="Fechar"
                  @click="windowVisible = false"
                />
              </div>
            </div>
          </div>
          <div
            class="flex-1 select-text overflow-auto relative"
            :class="{ 'pointer-events-none': lastMoveEvent }"
          >
            <slot :startMove />
          </div>
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

  &__frame {
    @apply flex flex-col rounded-lg;

    &:not(.app-window__frame--no-frame) {
      border: 1px solid var(--color-surface-muted);
    }
    outline: none;

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

    &--dense {
      .app-window__header {
        @apply py-1 px-2 text-3;
      }
    }
  }
}
</style>
