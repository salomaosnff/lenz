<script setup lang="ts">
import { computed } from 'vue';
import { vColor } from '../../directives/vColor';

const props = withDefaults(
  defineProps<{
    truthyValue?: any
    falsyValue?: any
    color?: string

  }>(), {
  truthyValue: true,
  falsyValue: false,
  color: 'primary'
})

const modelValue = defineModel<any>()

const modelValueSet = computed(() => {
  if (Array.isArray(modelValue.value)) {
    return new Set(modelValue.value)
  }
  if (modelValue.value instanceof Set) {
    return modelValue.value
  }
  return new Set([modelValue.value])
})


const isChecked = computed(() => modelValueSet.value.has(props.truthyValue))

function check() {
  if (Array.isArray(modelValue.value)) {
    modelValue.value = [...modelValueSet.value, props.truthyValue]
    return;
  }
  if (modelValue.value instanceof Set) {
    modelValue.value = new Set([...modelValue.value, props.truthyValue])
    return
  }

  modelValue.value = props.truthyValue
}

function uncheck() {
  const newValue = new Set(modelValueSet.value)
  newValue.delete(props.truthyValue)

  if (Array.isArray(modelValue.value)) {

    modelValue.value = [...newValue]
    return
  }

  if (modelValue.value instanceof Set) {
    modelValue.value = newValue
    return
  }

  modelValue.value = newValue.values().next()?.value ?? props.falsyValue
}

function toggle() {
  return isChecked.value ? uncheck() : check()
}

</script>

<template>
  <div v-color="color"
  class="ui-checkbox inline-flex gap-2 cursor-pointer items-center" tabindex="0" @click="toggle"
  :class="{
    'ui-checkbox--checked': isChecked
  }"
    @keyup.space="toggle">
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="22" height="22" fill="none" rx="5" ry="5" />

      <path
        fill="none"
        :stroke-width="isChecked ? 3 : 1"
        stroke="white"
        :d="isChecked ? 'M 5 11.5 l 5 5 l 10 -10' : 'M 12 11.5 l 0 0 l 0 0'"
        linecap="round"
        linejoin="round"
      />
    </svg>

    <slot />
  </div>
</template>

<style lang="scss">
.ui-checkbox {
  &>svg {
    width: 1.25em;
    height: 1.25em;

    & > * {
      transition: all .25s ease;
    }

    & > rect {
      stroke: var(--color-muted);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--current-color);
    outline-offset: 2px;
  }

  &--checked {
    &>svg {
      & > rect {
        fill: var(--current-color);
        stroke: none;
      }
    }
  }
}
</style>