<script setup lang="ts">
import { createScope } from "lenz:reactivity";
import { LenzDisposer } from "lenz:types";
import { Widget } from "lenz:widgets";

const props = defineProps<{
  widget: Widget;
}>();

const scope = createScope();

const el = ref<HTMLElement>();
let disposer: LenzDisposer | undefined;

watch(
  el,
  (newEL) => {
    if (disposer) {
      disposer?.();
      disposer = undefined;
    }

    if (newEL) {
      disposer = scope.run(() => props.widget(newEL));
    }
  },
  {
    flush: "pre",
    immediate: true,
  }
);

onBeforeUnmount(() => {
  scope.dispose();

  if (disposer) {
    disposer?.();
    disposer = undefined;
  }
});
</script>
<template>
  <div ref="el" class="contents app-widget"></div>
</template>

<style>
.app-widget {
  & a {
    font-weight: bold;

    &:hover {
      text-decoration: underline;
    }
  }

  & input:not([type="checkbox"]):not([type="radio"]),
  & select,
  & textarea {
    width: 100%;
    font: inherit;
    background: var(--color-surface);
    color: var(--color-foreground);
    border: 1px solid var(--color-surface2);
    padding: 0.25rem 0.5rem;

    &:focus {
      outline: 1px solid var(--color-primary);
    }
  }

  & fieldset {
    border: 1px solid var(--color-surface2);
    padding: 0.5rem;
    & legend {
      font-weight: bold;
      padding: 0 0.25rem;
    }
  }

  & .separator {
    width: 100%;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent 0%,
      var(--color-surface2) 50%,
      transparent 100%
    );
    margin: 0.5rem 0;
  }

  & button {
    background: var(--color-primary);
    color: var(--color-foreground);
    border: none;
    padding: 0.25rem 0.5rem;
    cursor: pointer;

    &:hover {
      background: hsl(from var(--color-primary) h s l / 0.8);
    }
  }

  & h1 {
    font-size: 1.5rem;
    margin: 0.5rem 0;
  }
}
</style>
