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
  <div v-color="color" class="ui-checkbox inline-flex gap-2 cursor-pointer" tabindex="0" @click="toggle"
    @keyup.space="toggle">
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="32" height="32" :fill="isChecked ? 'var(--current-color)' : 'var(--color-surface)'" />

      <path fill="none" stroke-width="4" stroke="var(--color-foreground)"
        :d="isChecked ? 'M7,16 L14,23 L26,7' : 'M14,16 L14,16 L14,16'" />
    </svg>

    <slot />

  </div>

</template>

<style lang="scss">
.ui-checkbox {
  &>svg {
    width: 1.25em;
    height: 1.25em;
    border: 1px solid var(--color-surface-muted);

    path,
    rect {
      transition: all .25s ease;
    }
  }

  &:focus-visible {
    outline: 2px solid var(--current-color);
    outline-offset: 2px;
  }
}
</style>