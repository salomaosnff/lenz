<script setup lang="ts">
import { computed, provide, ref } from 'vue';

const currentItem = ref<string>();
const countIcons = ref(0);
const hasIcons = computed(() => countIcons.value > 0);

provide('menu-group', {
    is_menu_bar: true,
    currentItem,
    countIcons,
    hasIcons
})
</script>
<template>
    <ul class="ui-menubar flex pa-1">
        <slot />
    </ul>
</template>
<style>
.ui-menubar {
    & > * {
        padding: 0 0.5rem;
    }
}
</style>