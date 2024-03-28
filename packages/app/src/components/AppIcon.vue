<script setup lang="ts">
import type { Icon } from '@editor/core';
import * as mdi from '@mdi/js';
import { computed } from 'vue';

const props = defineProps<{
    icon: Icon
}>();

function toPascalCase(str: string) {
  return str
    .replace(/(\w)(\w*)/g, (_, g1, g2) => g1.toUpperCase() + g2.toLowerCase())
    .replace(/[^a-zA-Z0-9]/g, '');
}

const path = computed(() => {
  const { icon } = props;

  if (typeof icon === 'string') {
    return mdi[icon] ?? '';
  }

  if (typeof icon !== 'object' || !icon) {
    return '';
  }

  if (icon.source === 'mdi') {
    return mdi[`mdi${toPascalCase(icon.name)}` as keyof typeof mdi] ?? '';
  }

  if (icon.source === 'svg') {
    return icon.path;
  }

  return '';
});
</script>
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      v-if="path"
      :d="path"
    />
  </svg>
</template>