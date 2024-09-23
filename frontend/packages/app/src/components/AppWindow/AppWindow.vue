<script setup lang="ts">
import icon_close from "lenz:icons/close";

defineProps<{
  title?: string;
  content: string;
  data?: Record<string, unknown>;
}>();

const visible = defineModel<boolean>("visible", {
  default: true,
});

const x = defineModel<number>("x", {
  default: () => window.innerWidth / 2 - 400,
});

const y = defineModel<number>("y", {
  default: () => window.innerHeight / 2 - 300,
});

const width = defineModel<number>("width", {
  default: 800,
});

const height = defineModel<number>("height", {
  default: 600,
});

const loaded = ref(false);

const iframe = ref<HTMLIFrameElement>();

useEventListener(iframe, "load", () => {
  loaded.value = true;
});

const style = computed(() => ({
  left: `${x.value}px`,
  top: `${y.value}px`,
  width: `${width.value}px`,
  height: `${height.value}px`,
}));

const lastPointerEvent = shallowRef<PointerEvent>();

useEventListener(
  document,
  "pointermove",
  (event) => {
    if (lastPointerEvent.value) {
      event.stopPropagation();
      const dx = event.clientX - lastPointerEvent.value.clientX;
      const dy = event.clientY - lastPointerEvent.value.clientY;

      x.value = Math.max(0, x.value + dx);
      y.value = Math.max(0, y.value + dy);

      lastPointerEvent.value = event;
    }
  },
  { capture: true, passive: true }
);

useEventListener(document, "pointerup", () => {
  lastPointerEvent.value = undefined;
});

const { lockIframe } = inject<{
  lockIframe: Ref<boolean>;
}>("lockIframe", {
  lockIframe: ref(false),
});

watchEffect(() => {
  if (lastPointerEvent.value) {
    lockIframe.value = true;
  } else {
    lockIframe.value = false;
  }
});

let lastResizeEvent: MouseEvent | undefined;

useEventListener(
  window,
  "pointermove",
  (event) => {
    if (lastResizeEvent) {
      event.stopPropagation();

      const dx =
        Math.floor(event.clientX) - Math.floor(lastResizeEvent.clientX);
      const dy =
        Math.floor(event.clientY) - Math.floor(lastResizeEvent.clientY);

      width.value += dx;
      height.value += dy;

      lastResizeEvent = event;
    }
  },
  { capture: true, passive: true }
);

useEventListener(window, "pointerup", () => {
  lastResizeEvent = undefined;
  lockIframe.value = false;
});
</script>
<template>
  <div class="app-window perspective-1000px" :style>
    <div class="app-window__box">
      <div class="app-window__header" @pointerdown="lastPointerEvent = $event">
        <div class="app-window__title text-center">{{ title }}</div>
        <div>
          <UiIcon
            :path="icon_close"
            class="fg--muted cursor-pointer hover:fg--foreground"
            title="Fechar"
            @click="visible = false"
          />
        </div>
      </div>
      <AppWebview
        :content="content"
        :data
        class="flex-1 bg-transparent"
        :class="{
          'pointer-events-none': lastPointerEvent || lastResizeEvent,
        }"
      />
      <div
        class="w-4 h-4 absolute bottom--2 right--2 cursor-se-resize"
        @pointerdown.stop.prevent="
          (lockIframe = true), (lastResizeEvent = $event)
        "
      />
    </div>
  </div>
</template>

<style lang="scss">
.app-window {
  @apply fixed z-5;
  border: 1px solid var(--color-surface-muted);

  &.v-enter-active,
  &.v-leave-active {
    transition-duration: 0.5s;

    .app-window__box {
      transition-property: all;
      transition-duration: inherit;
    }
  }

  &.v-enter-from,
  &.v-leave-to {
    .app-window__box {
      transform: scale(50%) rotate3d(1, 0, 0, -90deg);
      opacity: 0;
    }
  }

  &__header {
    @apply flex gap-2 items-center pa-2 w-full;
  }

  &__title {
    @apply flex-1 font-bold;
  }

  &__box {
    @apply flex flex-col w-full h-full rounded-lg shadow-lg overflow-hidden bg--surface;
  }
}
</style>
