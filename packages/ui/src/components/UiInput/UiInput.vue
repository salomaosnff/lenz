<script setup lang="ts">
import icon_close from "lenz:icons/close";
import { uniqueId } from "lodash-es";
import { vColor } from "../../directives/vColor";
import UiIcon from "../UiIcon/UiIcon.vue";

withDefaults(
  defineProps<{
    disabled?: boolean;
    clearable?: boolean;

    hideMessages?: boolean;
    error?: string;
    hint?: string;
    color?: string;

    label?: string;
    prependIcon?: string;
    appendIcon?: string;

    controlId?: string;
  }>(),
  { color: "primary", controlId: () => uniqueId("text-field-control-") }
);

const emit = defineEmits<{
  clear: [];
}>();
</script>

<template>
  <label
    v-color="color"
    class="ui-input w-full block"
    :for="controlId"
    :class="{ 'ui-input--error': error, 'ui-input--disabled': disabled }"
  >
    <span v-if="label" class="ui-input__label">{{ label }}</span>
    <div class="flex items-start ui-input__field mt-3 w-full bg--surface">
      <div class="flex flex-center self-stretch">
        <slot name="prepend"></slot>
        <div class="ml-2 my-1" v-if="prependIcon">
          <UiIcon
            class="fg--muted cursor-pointer text-20px"
            :name="prependIcon"
          />
        </div>
      </div>
      <div class="flex-1 min-h-8 flex">
        <slot />
      </div>
      <div class="flex flex-center">
        <div
          class="mr-2 my-1"
          v-if="clearable"
          @click.capture.prevent.stop="emit('clear')"
        >
          <UiIcon class="fg--muted cursor-pointer text-20px" :path="icon_close" />
        </div>
        <slot name="append"></slot>
        <div class="mr-2 my-1" v-if="appendIcon">
          <UiIcon
            class="fg--muted cursor-pointer text-20px"
            :name="appendIcon"
          />
        </div>
      </div>
    </div>
    <p v-if="!hideMessages" class="text-3 h-3 mt-1">
      <span v-if="error" class="fg--danger">{{ error }}</span>
      <span v-else-if="hint" class="fg--muted">{{ hint }}</span>
    </p>
  </label>
</template>

<style lang="scss">
.ui-input {
  &__label {
    color: var(--color-foreground);
    @apply block font-bold mb--2;
  }

  &--disabled {
    .ui-input__field {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &:not(&--error) {
    .ui-input__field {
      background: oklch(from var(--color-foreground) l c h / 12.5%);
    }
  }

  &--error {
    .ui-input {
      &__field {
        border: 1px solid var(--color-danger);
      }

      &__label,
      &__control {
        color: var(--color-danger);
      }
    }
  }

  &__field {
    @apply rounded-sm;
    outline-offset: 8px;
    outline: 4px solid transparent;
    transition: all 0.25s ease;
  }

  &:focus-within {
    .ui-input {
      &__field {
        outline: 2px solid var(--current-color);
        outline-offset: -2px;
      }

      &__label {
        color: var(--current-color);
      }
    }
  }
}
</style>
