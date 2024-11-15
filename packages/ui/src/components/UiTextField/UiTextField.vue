<script setup lang="ts">
import icon_maginfy from "lenz:icons/magnify";
import _uniqueId from "lodash-es/uniqueId";

import { computed, onMounted, ref } from "vue";
import { useFormField } from "../../composable/useForm";

const props = withDefaults(
  defineProps<{
    name?: string;
    type?: "text" | "password" | "number" | "url" | "email" | "search";
    min?: number;
    minlength?: number;
    max?: number;
    maxlength?: number;
    step?: number;
    autocomplete?: string;
    placeholder?: string;
    disabled?: boolean;
    clearable?: boolean;
    multiline?: boolean;
    autofocus?: boolean;

    hideMessages?: boolean;
    error?: string;
    hint?: string;
    color?: string;

    rows?: number;
    cols?: number;

    label?: string;
    prependIcon?: string;
    appendIcon?: string;

    controlId?: string;
  }>(),
  {
    autocomplete: "off",
    color: "primary",
    controlId: () => _uniqueId("text-field-control-"),
  }
);

const modelValue = defineModel<string>("modelValue");
const showPassword = defineModel<boolean>("showPassword");

const { error: fieldError, canSet } = useFormField<string>({
  key: () => props.name ?? "",
  modelValue,
});

const isDisabled = computed(() => props.disabled || !canSet());

const control = ref<HTMLElement>();

function focus() {
  control.value?.focus();
}

function blur() {
  modelValue.value = "";
}

function select() {
  control.value?.select();
}

onMounted(() => {
  if (props.autofocus) {
    focus();
    select();
  }
});

defineExpose({ focus, blur });
</script>

<template>
  <UiInput
    :hide-messages
    :label
    :control-id
    :disabled="isDisabled"
    :clearable
    :error="error ?? fieldError ?? ''"
    :hint
    :color
    :prepend-icon
    :append-icon
  >
    <template #prepend>
      <UiIcon
        v-if="type === 'search'"
        :path="icon_maginfy"
        class="text-1.5em ml-2 text-muted"
      />
      <slot name="prepend"></slot>
    </template>
    <textarea
      v-if="multiline"
      v-model="modelValue"
      ref="control"
      :id="controlId"
      class="flex-1 ui-textfield__control bg-transparent fg--foreground px-2 py-1"
      :minlength
      :maxlength
      :disabled="isDisabled"
      :placeholder
      :autocomplete
      :autofocus
    ></textarea>
    <input
      v-else
      v-model="modelValue"
      :id="controlId"
      ref="control"
      class="flex-1 ui-textfield__control bg-transparent fg--foreground px-2"
      :type="showPassword ? 'text' : type"
      :min
      :max
      :minlength
      :maxlength
      :disabled="isDisabled"
      :step
      :placeholder
      :autocomplete
      :autofocus
    />
  </UiInput>
</template>

<style lang="scss">
.ui-textfield {
  &__control {
    border: none;
    outline: none;
    font: inherit;
    font-size: 1em;
    width: auto;
    width: 100%;

    &::placeholder {
      color: var(--color-muted);
    }

    /* clears the 'X' from Internet Explorer */
    &[type="search"]::-ms-clear,
    &[type="search"]::-ms-reveal {
      display: none;
      width: 0;
      height: 0;
    }

    /* clears the 'X' from Chrome */
    &[type="search"]::-webkit-search-decoration,
    &[type="search"]::-webkit-search-cancel-button,
    &[type="search"]::-webkit-search-results-button,
    &[type="search"]::-webkit-search-results-decoration {
      display: none;
    }
  }
}
</style>
