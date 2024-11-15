
<script setup lang="ts">
import { ref } from 'vue';

const value = ref('Item 1');
</script>
<template>
    <UiRadio v-model="value" value="Item 1">Item 1</UiRadio>
    <UiRadio v-model="value" value="Item 2">Item 2</UiRadio>
    <UiRadio v-model="value" value="Item 3">Item 3</UiRadio>
    <UiCheckbox v-model="value" value="Item 4">Item 4</UiCheckbox>

    <pre>{{ value }}</pre>
</template>