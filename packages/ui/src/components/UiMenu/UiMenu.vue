<script setup lang="ts">
import { computed, inject, provide, ref } from 'vue';

const currentItem = ref<string>();
const countIcons = ref(0);

const hasIcons = computed(() => countIcons.value > 0);

export interface Provider {
    currentItem: typeof currentItem
    countIcons: typeof countIcons
    hasIcons: typeof hasIcons
    parent: typeof parent
    dispose(): void
}

const parent = inject<null | Provider>('menu-group', null);

provide<Provider>('menu-group', {
    currentItem,
    countIcons,
    hasIcons,
    parent,
    dispose: parent?.dispose ?? (() => { })
})
</script>
<template>
    <ul class="ui-menu pa-1 bg--surface b-1 border-color-[var(--color-surface-muted)] shadow-sm rounded-md min-w-max">
        <slot />
    </ul>
</template>