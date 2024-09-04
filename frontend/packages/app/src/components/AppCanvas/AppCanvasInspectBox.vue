<script setup lang="ts">
import { CanvasElement, getElementSelector } from "./types";

const props = defineProps<{
  item: CanvasElement;
  active?: boolean;
}>();

const hoverSelector = computed(() =>
  props.item ? getElementSelector(props.item.element) : ""
);

const style = computed(() => {
  const borderSize = props.active ? 2 : 1;
  return {
    width: `${props.item.box.width + borderSize * 2}px`,
    height: `${props.item.box.height + borderSize * 2}px`,
    top: `${props.item.box.top - borderSize}px`,
    left: `${props.item.box.left - borderSize}px`,
  };
});
</script>
<template>
  <div
    class="app-canvas__inspect fixed pointer-events-none z-1"
    :style
    :data-tag="hoverSelector"
    :class="{
      'app-canvas__inspect--active': active,
    }"
  >
    <svg width="100%" height="100%">
      <rect
        width="100%"
        height="100%"
        fill="none"
        stroke="white"
        stroke-width="2"
        stroke-dasharray="4"
      />
    </svg>
  </div>
</template>

<style lang="scss">
@keyframes dash-1 {
  from {
    stroke-dashoffset: 0;
  }

  to {
    stroke-dashoffset: 8;
  }
}

@keyframes blink {
  0%,
  100% {
    fill: oklch(from var(--color-primary) l c h / 25%);
  }

  50% {
    fill: transparent;
  }
}

.app-canvas__inspect {
  svg rect {
    stroke: var(--color-primary);
    stroke-dasharray: 0;
  }

  &--active {
    svg > rect {
      animation:
        dash-1 1s infinite linear,
        blink 1s infinite;
      fill: var(--color-surface-primary);
      stroke-width: 4;
      stroke-dasharray: 4;
    }

    &::before {
      content: attr(data-tag);
      position: absolute;
      bottom: 100%;
      left: 0;
      background: var(--color-primary);
      padding: 2px 8px;
    }
  }
}
</style>
