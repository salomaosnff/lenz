<script setup lang="ts">
import icon_refresh from "lenz:icons/refresh";
import { CanvasElement, createElementSelection } from "./types";

const documentModel = defineModel<Document>();
const htmlModel = defineModel<string>("html");
const hoverModel = defineModel<CanvasElement>("hover");
const activeModel = defineModel<CanvasElement[]>("active");

const loaded = ref(false);
const iframe = ref<HTMLIFrameElement>();



const styleEl = document.createElement("style");

styleEl.setAttribute("data-ignore-on-to-string", "true");

styleEl.textContent = `html, body {
  cursor: default !important;
}`;

watch(
  htmlModel,
  () => {
    loaded.value = false;
  },
  { immediate: true }
);

whenever(
  loaded,
  () => {
    documentModel.value = iframe.value?.contentDocument ?? undefined;

    if (
      !documentModel.value?.querySelector("style[data-ignore-on-to-string]")
    ) {
      documentModel.value?.head.appendChild(styleEl.cloneNode(true));
    }

    iframe.value?.contentDocument?.addEventListener("pointermove", (event) => {
      hoverModel.value = createElementSelection(event.target as HTMLElement, iframe.value);
    });

    iframe.value?.contentDocument?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const selection = activeModel.value ?? [];
      const element = createElementSelection(event.target as HTMLElement, iframe.value);
      const isSelected = selection.some((el) =>
        el.element.isSameNode(element.element)
      );

      if (event.ctrlKey) {
        if (isSelected) {
          activeModel.value = selection.filter(
            (el) => !el.element.isSameNode(element.element)
          );
        } else {
          activeModel.value = selection.concat(element);
        }
      } else if (isSelected) {
        activeModel.value = [];
      } else {
        activeModel.value = [element];
      }
    }, {
      capture: true,
    });

    // Propagate iframe window events to the parent window
    const EVENTS = [
      "click",
      "pointermove",
      "pointerleave",
      "scroll",
      "keydown",
      "keyup",
      "pointerdown",
    ];

    for (const event of EVENTS) {
      iframe.value?.contentWindow?.addEventListener(event, (e) => {
        window.dispatchEvent(new (e as any).constructor(e.type, e));
      });
    }

    const currentDocument = iframe.value?.contentDocument as Document;

    if (hoverModel.value) {
      const element = currentDocument.querySelector(hoverModel.value.selector);

      hoverModel.value = element
        ? createElementSelection(element as HTMLElement, iframe.value, hoverModel.value.selector)
        : undefined;
    }

    if (activeModel.value) {
      activeModel.value = activeModel.value.reduce((acc, item) => {
        const element = currentDocument.querySelector(item.selector);

        if (element) {
          acc.push(createElementSelection(element as HTMLElement, iframe.value, item.selector));
        }

        return acc;
      }, [] as CanvasElement[]);
    }
  },
  { flush: "post" }
);

useResizeObserver(
  () => [
    hoverModel.value?.element,
    ...Array.from(activeModel.value ?? []).map((el) => el.element),
  ],
  () => updateInspect()
);

function updateInspect() {
  if (!iframe.value) {
    return;
  }

  if (hoverModel.value) {
    hoverModel.value = createElementSelection(hoverModel.value.element, iframe.value);
  }

  if (activeModel.value) {
    activeModel.value = Array.from(activeModel.value).map((el) =>
      createElementSelection(el.element, iframe.value)
    );
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
    hoverModel.value = undefined;
  },
  { capture: true }
);

function toString() {
  const copy = documentModel.value?.cloneNode(true) as Document;

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
  >
    <iframe
      ref="iframe"
      class="h-full w-full"
      :class="[
        loaded ? ['visible', 'opacity-100'] : ['invisible', 'opacity-0'],
      ]"
      .srcdoc="htmlModel"
      frameborder="0"
      @load="loaded = true"
    ></iframe>

    <AppCanvasInspectBox
      v-for="(item, i) in activeModel"
      :key="i"
      :item="item"
      active
    />
    <AppCanvasInspectBox
      v-if="
        hoverModel &&
        !(
          activeModel &&
          activeModel.some((el) =>
            el.element.isSameNode((hoverModel as CanvasElement).element)
          )
        )
      "
      :item="hoverModel"
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
