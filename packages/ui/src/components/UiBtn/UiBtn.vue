<script setup lang="ts">
import icon_refresh from "lenz:icons/refresh";
import { computed, ref } from "vue";
import {
  SUBMITTING,
  useForm,
  VALID,
  VALIDATING,
} from "../../composable/useForm";
import { vColor } from "../../directives/vColor";
import { MaybeArray } from "../../types";

const props = withDefaults(
  defineProps<{
    is?: string;
    type?: "button" | "submit" | "reset";
    color?: string;
    disabled?: boolean;
    loading?: boolean;
    icon?: boolean;
    flat?: boolean;
    noFormIntegration?: boolean;
    onClick?: MaybeArray<(event: MouseEvent) => void | Promise<void>>;
  }>(),
  {
    is: "button",
    color: "primary",
    type: "button",
  }
);

const form = useForm();

const pendingTask = ref(false);

async function handleClick(event: MouseEvent) {
  const onClick = ([] as any[]).concat(props.onClick ?? []);

  if (isDisabled.value || onClick.length === 0) {
    return;
  }

  try {
    pendingTask.value = true;
    await Promise.all(onClick.map(fn => fn(event)));
  } finally {
    pendingTask.value = false;
  }
}

const isLoading = computed(() => {
  if (props.loading || pendingTask.value) {
    return true;
  }

  if (!props.noFormIntegration && props.type === "submit" && form) {
    const state: number = form.state.value;

    if (state & SUBMITTING || state & VALIDATING) {
      return true;
    }

    return false;
  }
});

const isDisabled = computed(() => {
  if (props.disabled || pendingTask.value) {
    return true;
  }

  if (props.noFormIntegration || !form) {
    return false;
  }

  const state: number = form.state.value;

  if (props.type === "submit") {
    return state & SUBMITTING || state & VALIDATING || !(state & VALID);
  }

  if (props.type === "reset") {
    return state & SUBMITTING;
  }

  return false;
});
</script>
<template>
  <component
    v-color="color"
    :is="is"
    class="ui-btn"
    :type="type"
    :class="{
      'ui-btn--disabled': isDisabled,
      'cursor-wait': isLoading,
      'ui-btn--icon': icon,
      'ui-btn--flat': flat,
    }"
    @click="handleClick"
  >
    <Transition>
      <div
        v-if="isLoading"
        class="ui-btn__loading w-full h-full absolute top-0 left-0 flex items-center justify-center"
      >
        <UiIcon class="animate-spin text-6" :path="icon_refresh"/>
      </div>
    </Transition>
    <div
      class="ui-btn__content"
      :class="{
        'ui-btn__content--loading': isLoading,
      }"
    >
      <slot />
    </div>
  </component>
</template>

<style lang="scss">
.ui-btn {
  @apply inline-flex items-center justify-center px-4 py-1 relative rounded-sm;
  background: var(--current-color);
  color: oklch(from white l c h / 82%);
  outline: 2px solid transparent;
  outline-offset: 16px;
  transition: all 0.25s ease;
  border: none;

  .ui-icon {
    font-size: 1.25em;
  }

  &--icon {
    aspect-ratio: 1;
    @apply w-8 rounded-full;
  }

  &--flat {
    background: transparent;
    color: var(--current-color);

    &:hover {
      background: var(--current-surface-color);
    }
  }

  &__loading {
    &.v-enter-active,
    &.v-leave-active {
      transition: all 0.25s;
    }

    &.v-enter-active {
      transition-delay: 0.25s;
    }

    &.v-enter-from,
    &.v-leave-to {
      transform: scale(0);
    }
  }

  &__content {
    transition: transform 0.25s;
    transition-delay: 0.25s;

    &--loading {
      transform: scale(0);
      transition-delay: 0s;
    }
  }

  &:focus-visible {
    outline: 2px solid var(--current-color);
    outline-offset: 2px;
  }

  &--disabled {
    pointer-events: none;
    color: oklch(from var(--color-foreground) l c h / 50%);

    &:not(.ui-btn--flat) {
      background: oklch(from var(--color-foreground) l c h / 12.5%) !important;
    }
  }

  &:not(&--icon) > .ui-btn__content {
    display: flex;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    .ui-icon {
      &:first-child {
        @apply ml--2 mr-1;
      }

      &:last-child {
        @apply mr--2 ml-1;
      }
    }
  }
}
</style>
