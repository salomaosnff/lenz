<script setup lang="ts">
import icon_close from "lenz:icons/close";

withDefaults(
  defineProps<{
    title: string;
  }>(),
  {
    title: "Window",
  }
);

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

const html = defineModel<string>("html");

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
      x.value += event.clientX - lastPointerEvent.value.clientX;
      y.value += event.clientY - lastPointerEvent.value.clientY;
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
</script>
<template>
  <Transition appear>
    <div v-if="visible" class="app-window" :style>
      <div class="app-window__header" @pointerdown="lastPointerEvent = $event">
        <div class="app-window__title">{{ title }}</div>
        <div>
          <UiIcon
            :path="icon_close"
            class="fg--muted cursor-pointer hover:fg--foreground"
            title="Fechar"
            @click="visible = false"
          />
        </div>
      </div>
      <iframe
        ref="iframe"
        .srcdoc="html"
        frameborder="0"
        class="flex-1 bg-transparent"
        :class="{
          'pointer-events-none': lastPointerEvent,
        }"
      />
    </div>
  </Transition>
</template>

<style lang="scss">
.app-window {
  @apply fixed flex flex-col rounded-md shadow-lg overflow hidden bg--surface z-5;
  border: 1px solid var(--color-surface);

  &.v-enter-active,
  &.v-leave-active {
    transition: all 0.25s;
  }

  &.v-enter-from,
  &.v-leave-to {
    transform: scale(0);
    opacity: 0;
  }

  &__header {
    @apply flex gap-2 items-center pa-2 w-full;
  }

  &__title {
    @apply flex-1 font-bold;
  }
}
</style>
