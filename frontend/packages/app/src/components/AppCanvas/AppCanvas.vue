<script setup lang="ts">
import icon_refresh from "lenz:icons/refresh";
import { CanvasElement } from "./types";

const modelValue = defineModel<string>("html");
const dom = defineModel<Document>();
const hover = defineModel<CanvasElement>("hover");
const active = defineModel<CanvasElement>("active");
const isMobile = defineModel<boolean>("isMobile", {
  default: false,
});

const loaded = ref(false);
const iframe = ref<HTMLIFrameElement>();

function createCanvasElement(element: HTMLElement): CanvasElement {
  const iframeBox = iframe.value?.getBoundingClientRect() ?? new DOMRect();
  const box = element.getBoundingClientRect();

  return {
    element,
    box: new DOMRect(
      iframeBox.x + box.x,
      iframeBox.y + box.y,
      box.width,
      box.height
    ),
  };
}

const styleEl = document.createElement("style");

styleEl.setAttribute("data-ignore-on-to-string", "true");

styleEl.textContent = `html, body {
  cursor: default !important;
}`;

watch(modelValue, () => {
  loaded.value = false;
  hover.value = undefined;
  active.value = undefined;
});

whenever(loaded, () => {
  dom.value = iframe.value?.contentDocument ?? undefined;

  iframe.value?.contentDocument?.addEventListener("pointermove", (event) => {
    hover.value = createCanvasElement(event.target as HTMLElement);
  });

  iframe.value?.contentDocument?.addEventListener("click", (event) => {
    active.value = createCanvasElement(event.target as HTMLElement);
  });

  iframe.value?.contentDocument?.head.appendChild(styleEl);
});

useResizeObserver(
  () => [hover.value?.element, active.value?.element],
  () => updateInspect()
);

function updateInspect() {
  if (!iframe.value) {
    return;
  }

  if (hover.value) {
    hover.value = createCanvasElement(hover.value.element);
  }

  if (active.value) {
    active.value = createCanvasElement(active.value.element);
  }
}

useEventListener("scroll", updateInspect, { passive: true });
useEventListener(() => iframe.value?.contentWindow, "scroll", updateInspect, {
  passive: true,
});
useEventListener(
  iframe,
  "pointerleave",
  () => {
    hover.value = undefined;
  },
  { capture: true }
);

function toString() {
  const copy = dom.value?.cloneNode(true) as Document;

  for (const el of copy.querySelectorAll("[data-ignore-on-to-string]")) {
    el.remove();
  }

  return copy?.documentElement?.outerHTML ?? "";
}

defineExpose({
  toString,
});
</script>
<template>
  <div
    class="relative rounded-md transition-all duration-1000 shadow-lg"
    :class="isMobile ? 'w-480px' : 'w-full'"
  >
    <iframe
      ref="iframe"
      class="h-full w-full"
      :class="[
        loaded ? ['visible', 'opacity-100'] : ['invisible', 'opacity-0'],
      ]"
      .srcdoc="modelValue"
      frameborder="0"
      @load="loaded = true"
    ></iframe>

    <AppCanvasInspectBox v-if="active" :item="active" active />
    <AppCanvasInspectBox
      v-if="hover && !(active && active.element.isSameNode(hover.element))"
      :item="hover"
    />

    <UiIcon
      v-if="!loaded"
      :path="icon_refresh"
      class="fg--muted absolute top-50% right-50% translate-[-50%,-50%] animate-spin text-25"
    />
  </div>
</template>

<style lang="scss">
.app-canvas {
  &__hover {
    background-color: var(--color-surface-primary);
  }
}
</style>
