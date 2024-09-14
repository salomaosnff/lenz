<script setup lang="ts" generic="T">
import { computed } from 'vue';
import { vColor } from '../../directives/vColor';

const props = withDefaults(
    defineProps<{
        value: T
        color?: string
    }>(),
    {
        color: 'primary'
    }
)

const modelValue = defineModel<T>()

const isChecked = computed(() => modelValue.value === props.value)

function check() {
    if (!isChecked.value) {
        modelValue.value = props.value
    }
}
</script>
<template>
    <div v-color="color" :class="{ 'ui-radio--checked': isChecked }"
        class="ui-radio inline-flex gap-2 cursor-default items-center" @click="check">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10.5" fill="none" stroke-width="1.5" />
            <circle cx="12" cy="12" r="0" />
        </svg>
        <slot></slot>
    </div>
</template>

<style lang="scss">
.ui-radio {
    &>svg {
        width: 1.25em;
        height: 1.25em;

        &>circle {
            transition: all 0.25s ease;

            &:first-child {
                stroke: var(--color-muted);
            }
        }
    }

    &--checked {
        &>svg {
            &>circle {
                &:first-child {
                    stroke: var(--current-color);
                }
                &:last-child {
                    fill: var(--current-color);
                    r: 5;
                }
            }
        }
    }
}
</style>