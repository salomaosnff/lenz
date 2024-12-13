<script setup lang="ts">
import icon_refresh from "lenz:icons/refresh";
import { CanvasElement, createElementSelection } from "./types";

const props = defineProps<{
  html: string;
  hidden?: boolean;
}>();

const documentModel = defineModel<Document>();
const hoverModel = defineModel<CanvasElement>("hover");
const activeModel = defineModel<CanvasElement[]>("active");

const hotKeysStore = useHotKeysStore();

const currentHTML = computed(() => {
  const dom = new DOMParser().parseFromString(props.html, "text/html");
  return dom.documentElement.outerHTML;
});

const emit = defineEmits<{
  "dom-update": [string];
}>();

const loaded = ref(false);
const iframe = ref<HTMLIFrameElement>();

const styleEl = document.createElement("style");

styleEl.setAttribute("data-ignore-on-to-string", "true");

styleEl.textContent = `html, body {
  cursor: default !important;
  user-select: none !important;
}`;

watch(
  currentHTML,
  () => {
    loaded.value = false;
  },
  { immediate: true }
);

let observer: MutationObserver | undefined;

whenever(
  loaded,
  () => {
    const dom = iframe.value?.contentDocument;

    if (!dom) {
      return;
    }

    observer?.disconnect();

    documentModel.value = markRaw(dom);

    if (!dom.querySelector("style[data-ignore-on-to-string]")) {
      dom?.head.appendChild(styleEl.cloneNode(true));
    }

    observer = new MutationObserver(() =>
      emit("dom-update", toString(documentModel.value))
    );

    observer.observe(dom.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    dom?.addEventListener("pointermove", (event) => {
      hoverModel.value = createElementSelection(
        event.target as HTMLElement,
        iframe.value
      );
    });

    iframe.value?.contentDocument?.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        const selection = activeModel.value ?? [];
        const element = createElementSelection(
          event.target as HTMLElement,
          iframe.value
        );
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
        } else if (event.shiftKey && selection.length === 1) {
          const children = Array.from(
            selection[0].element.parentElement?.children ?? []
          );

          const start = children.indexOf(selection[0].element);
          const end = children.indexOf(element.element);

          activeModel.value = children
            .slice(Math.min(start, end), Math.max(start, end) + 1)
            .map((el) =>
              createElementSelection(el as HTMLElement, iframe.value)
            );
        } else if (isSelected) {
          activeModel.value = [];
        } else {
          activeModel.value = [element];
        }
      },
      {
        capture: true,
      }
    );

    // Propagate iframe window events to the parent window
    const EVENTS: string[] = ["pointerdown", "click"];

    for (const event of EVENTS) {
      iframe.value?.contentWindow?.addEventListener(event, (e) => {
        window.dispatchEvent(new (e as any).constructor(e.type, e));
      });
    }

    iframe.value?.contentWindow?.addEventListener(
      "keydown",
      hotKeysStore.handleKeyDown,
      { capture: true }
    );
    iframe.value?.contentWindow?.addEventListener(
      "keyup",
      hotKeysStore.handleKeyUp,
      { capture: true }
    );

    const currentDocument = iframe.value?.contentDocument as Document;

    if (hoverModel.value) {
      const element = currentDocument.querySelector(hoverModel.value.selector);

      hoverModel.value = element
        ? createElementSelection(
            element as HTMLElement,
            iframe.value,
            hoverModel.value.selector
          )
        : undefined;
    }

    if (activeModel.value) {
      activeModel.value = activeModel.value.reduce((acc, item) => {
        const element = currentDocument.querySelector(item.selector);

        if (element) {
          acc.push(
            createElementSelection(
              element as HTMLElement,
              iframe.value,
              item.selector
            )
          );
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
    const { box } = createElementSelection(
      hoverModel.value.element,
      iframe.value
    );
    hoverModel.value.box = box;
  }

  if (activeModel.value) {
    for (const item of activeModel.value) {
      const { box } = createElementSelection(item.element, iframe.value);
      item.box = box;
    }
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

function toString(dom?: Document) {
  if (!dom) {
    return "";
  }

  const copy = dom.cloneNode(true) as Document;

  for (const el of copy.querySelectorAll("[data-ignore-on-to-string]")) {
    el.remove();
  }

  return copy?.documentElement?.outerHTML ?? "";
}

defineExpose({
  toString: () => toString(documentModel.value),
});
</script>
<template>
  <div class="relative rounded-md transition-all duration-1000 shadow-lg">
    <iframe
      ref="iframe"
      class="h-full w-full"
      :class="[
        loaded ? ['visible', 'opacity-100'] : ['invisible', 'opacity-0'],
      ]"
      .srcdoc="html"
      frameborder="0"
      @loadstart="loaded = false"
      @load="loaded = true"
    ></iframe>

    <template v-if="!hidden">
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
    </template>

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
