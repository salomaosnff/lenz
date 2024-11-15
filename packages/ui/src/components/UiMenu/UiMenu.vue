<script setup lang="ts">
import { computed, provide, ref } from 'vue';

const currentItem = ref<string>();
const countIcons = ref(0);

const hasIcons = computed(() => countIcons.value > 0);

provide('menu-group', {
    currentItem,
    countIcons,
    hasIcons
})
</script>
<template>
    <ul class="ui-menu pa-1 bg--surface b-1 border-color-[var(--color-surface-muted)] shadow-sm rounded-md min-w-max">
        <slot />
    </ul>
</template>