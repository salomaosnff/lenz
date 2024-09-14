<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import {
  onClickOutside,
  useEventListener,
  useResizeObserver,
} from '@vueuse/core';
import type { PropType } from 'vue';
import { computed, provide, reactive, ref, useAttrs, watchEffect } from 'vue';
import { useOverlayStack } from '../../composable/useOverlayStack';
import type {
  OverlayMenuAlign,
  OverlayMenuOrigin,
  OverlayMenuSide,
} from './types';

interface MenuPosition {
  top: number;
  left: number;
}

const props = defineProps({
  /** Se o conteúdo está visível */
  visible: Boolean,

  /** Direção e alinhamento onde o conteúdo irá aparecer em relação ao ativador */
  origin: {
    type: String as PropType<OverlayMenuOrigin>,
    default: 'bottom',
  },

  /** Fechar o menu ao clicar fora do conteúdo */
  closeOnClick: Boolean,

  /** Fechar o menu ao clicar no conteúdo */
  closeOnClickContent: Boolean,

  /** Abrir ao clicar no menu */
  openOnClick: {
    type: Boolean,
    default: true,
  },

  /** Teleporta o conteúdo para um elemento */
  teleport: {
    type: String,
    default: 'body',
  },

  /** Posição do conteúdo quando não houver ativador */
  position: Object as PropType<{ x: number; y: number }>,

  /** Distância do conteúdo e do ativador (ou da posição) */
  offset: {
    type: Number,
    default: 0,
  },

  /** Define as dimensões mínimas do conteúdo igual as dimensões do ativador */
  full: Boolean,

  disabled: Boolean,

  /** Não empilha o menu no overlay stack */
  noStack: Boolean,

  /** Nome da transição */
  transition: {
    type: String,
    default: 'ui-fade',
  },
});

const emit = defineEmits<{
  /** Dispara quando o menu é aberto */
  (name: 'open'): void;

  /** Dispara quando o menu é fechado */
  (name: 'close'): void;
}>();

const isVisible = defineModel<boolean>();

const activatorEl = ref<HTMLDivElement>();
const contentEl = ref<HTMLDivElement>();
const activatorRect = ref(new DOMRect());
const contentRect = ref(new DOMRect());
const overlay = useOverlayStack(close);

const origin = computed(() => {
  const [side = 'bottom', align = 'center'] = props.origin.split('-') as [
    side: OverlayMenuSide,
    align: OverlayMenuAlign,
  ];

  const hasSpace = checkSpace(side);

  if (hasSpace) {
    return [side, align] as [side: OverlayMenuSide, align: OverlayMenuAlign];
  } else {
    const oppositeSide = getOppositeSide(side);
    return [oppositeSide, align] as [
      side: OverlayMenuSide,
      align: OverlayMenuAlign,
    ];
  }
});

const viewport = computed(() => {
  if (!activatorEl.value) {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  let el: HTMLElement | null =
    typeof props.teleport === 'string'
      ? document.querySelector(props.teleport)
      : activatorEl.value?.parentElement;

  while (el && el !== document.body) {
    if (el === document.documentElement) {
      break;
    }

    const style = getComputedStyle(el);
    if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
      return {
        width: el.clientWidth,
        height: el.clientHeight,
      };
    }

    el = el.parentElement;
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
});

function checkSpace(side: OverlayMenuSide) {
  const viewportWidth = viewport.value.width;
  const viewportHeight = viewport.value.height;
  const offset = props.offset;

  const hasSpace = {
    top: () => activatorRect.value.top >= contentRect.value.height + offset,
    right: () =>
      activatorRect.value.right + contentRect.value.width <=
      viewportWidth - offset,
    bottom: () =>
      activatorRect.value.bottom + contentRect.value.height <=
      viewportHeight - offset,
    left: () => activatorRect.value.left >= contentRect.value.width + offset,
  };
  return hasSpace[side]?.() ?? true;
}

function getOppositeSide(side: OverlayMenuSide) {
  return (
    {
      top: 'bottom',
      right: 'left',
      bottom: 'top',
      left: 'right',
    }[side] ?? side
  );
}

function updateRect() {
  if (props.position) {
    activatorRect.value = new DOMRect(props.position.x, props.position.y, 0, 0);
  } else {
    activatorRect.value =
      activatorEl.value?.getBoundingClientRect() ?? new DOMRect();
  }

  contentRect.value = contentEl.value?.getBoundingClientRect() ?? new DOMRect();
}

function setVisible(value: boolean) {
  isVisible.value = value;
  if (value) {
    emit('open');
  } else {
    emit('close');
  }
}

function open() {
  setVisible(true);
}

function close() {
  setVisible(false);
}

function toggle() {
  return isVisible.value ? close() : open();
}

function normalizePosition(position: MenuPosition): MenuPosition {
  const viewportHeight = document.documentElement.clientHeight;
  const viewportWidth = document.documentElement.clientWidth;

  position.top = Math.max(
    Math.min(0, activatorRect.value.bottom),
    position.top,
  );
  position.left = Math.max(
    Math.min(0, activatorRect.value.right),
    position.left,
  );
  position.top = Math.min(
    Math.max(viewportHeight, activatorRect.value.top) -
    contentRect.value.height,
    position.top,
  );
  position.left = Math.min(
    Math.max(viewportWidth, activatorRect.value.left) - contentRect.value.width,
    position.left,
  );

  return position;
}

const positionStyle = computed(() => {
  let position: MenuPosition = {
    top: activatorRect.value.top,
    left: activatorRect.value.left,
  };
  const [side, align] = origin.value;
  const activator = activatorRect.value;
  const content = contentRect.value;
  const offset = props.offset;

  if (side === 'bottom') {
    position.top = activator.bottom + offset;
  } else if (side === 'top') {
    position.top = activator.top - content.height - offset;
  } else if (side === 'left') {
    position.left = activator.left - content.width - offset;
  } else if (side === 'right') {
    position.left = activator.right + offset;
  }

  if (side === 'top' || side === 'bottom') {
    if (align === 'start') {
      position.left = activator.left;
    } else if (align === 'center') {
      position.left = activator.left - (content.width - activator.width) / 2;
    } else if (align === 'end') {
      position.left = activator.left - content.width + activator.width;
    }
  }

  if (side === 'left' || side === 'right') {
    if (align === 'start') {
      position.top = activator.top;
    } else if (align === 'center') {
      position.top = activator.top - (content.height - activator.height) / 2;
    } else if (align === 'end') {
      position.top = activator.top - content.height + activator.height;
    }
  }

  position = normalizePosition(position);

  return {
    top: position.top && `${position.top}px`,
    left: position.left && `${position.left}px`,
  };
});

const dimensionStyle = computed(() => {
  if (!props.full) {
    return {};
  }

  const [side] = origin.value;

  if (side === 'top' || side === 'bottom') {
    return { 'min-width': `${activatorRect.value.width}px` };
  }

  return { 'min-height': `${activatorRect.value.height}px` };
});

useEventListener(document, 'scroll', updateRect, {
  passive: true,
  capture: true,
});

useEventListener(window, 'resize', updateRect, { passive: true });

onClickOutside(contentEl, () => {
  if (!props.closeOnClick) {
    return;
  }

  if(props.noStack) {
    return close();
  }
  
  return overlay.pop()
}, {
  ignore: [activatorEl],
});

useResizeObserver([activatorEl, contentEl], updateRect);

watchEffect(() => {
  isVisible.value = props.visible;
});

watchEffect(() => {
  if (isVisible.value === true) {
    updateRect();
  }
});

watchEffect(() => {
  if (props.noStack) {
    return;
  }
  if (isVisible.value) {
    overlay.push();
  } else {
    overlay.dispose();
  }
});

function setActivatorRef(ref: any) {
  if (ref && !(ref instanceof HTMLElement)) {
    ref = ref.$el;
  }

  activatorEl.value = ref;
}

const bind = reactive({
  isVisible,
  open,
  close,
  toggle,
  setActivatorRef,
});

const attrs = useAttrs();

provide('overlay_menu', {
  origin,
  activatorRect,
  contentRect,
});
</script>

<template>
  <slot v-bind="bind" :attrs="{
    ...attrs,
    ref: setActivatorRef,
    onClick: openOnClick && !disabled ? toggle : () => { },
  }" name="activator" />
  <Teleport :to="teleport">
    <Transition :name="transition">
      <div v-if="isVisible" ref="contentEl" class="ui-menu__content fixed z-999 inline-block"
        :style="[positionStyle, dimensionStyle]" @click="closeOnClickContent && close()">
        <slot v-bind="bind" />
      </div>
    </Transition>
  </Teleport>
</template>