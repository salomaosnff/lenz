<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { computed, inject } from 'vue';

defineProps({
  arrow: {
    type: Boolean,
    default: true,
  },
});

const menu = inject<any>('overlay_menu');

if (!menu) {
  throw new Error('UiPopup precisa estar dentro de um UiOverlayMenu');
}

const offset = computed(() => {
  const [side] = menu.origin.value;
  const isVertical = side === 'top' || side === 'bottom';

  if (isVertical) {
    return (
      menu.activatorRect.value.x -
      menu.contentRect.value.x +
      menu.activatorRect.value.width / 2
    );
  } else {
    return (
      menu.activatorRect.value.y -
      menu.contentRect.value.y +
      menu.activatorRect.value.height / 2
    );
  }
});
</script>

<template>
  <div class="ui-popup rounded-md py-2 px-4" :class="arrow && ['ui-popup--arrow', `ui-popup--arrow-${menu.origin.value[0]}`]
    " :style="{
      '--popup-arrow-offset': `${offset}px`,
    }">
    <slot />
  </div>
</template>

<style lang="scss">
.ui-popup {
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.15);
  --popup-color: var(--color-surface);
  background: var(--popup-color);

  &--arrow {
    --arrow-size: 8px;

    position: relative;
    background: var(--popup-color);

    &::before {
      content: '';
      position: absolute;
      border: solid var(--arrow-size) transparent;
      z-index: 1;
    }

    &-bottom {
      top: var(--arrow-size);

      &::before {
        top: calc(var(--arrow-size) * -2);
        border-bottom-color: var(--popup-color, var(--color-popup));
      }
    }

    &-left {
      right: var(--arrow-size);

      &::before {
        right: calc(var(--arrow-size) * -2);
        border-left-color: var(--popup-color, var(--color-popup));
        top: 0;
      }
    }

    &-top {
      bottom: var(--arrow-size);

      &::before {
        bottom: calc(var(--arrow-size) * -2);
        border-top-color: var(--popup-color, var(--color-popup));
        left: 0;
      }
    }

    &-right {
      left: var(--arrow-size);

      &::before {
        left: calc(var(--arrow-size) * -2);
        border-right-color: var(--popup-color, var(--color-popup));
        top: 0;
      }
    }

    &-top,
    &-bottom {
      &::before {
        left: var(--popup-arrow-offset);
        transform: translateX(-50%);
      }
    }

    &-left,
    &-right {
      &::before {
        top: var(--popup-arrow-offset);
        transform: translateY(-50%);
      }
    }
  }
}
</style>