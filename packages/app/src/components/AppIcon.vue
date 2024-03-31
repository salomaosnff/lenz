<script setup lang="ts">
import type { IconMeta } from 'lenz/types';
import * as mdi from '@mdi/js';
import { computed } from 'vue';

const props = defineProps<{
    icon: IconMeta
}>();

const path = computed(() => {
  const { icon } = props;

  if (typeof icon === 'string') {
    return mdi[`mdi${icon}`] ?? '';
  }

  if (typeof icon !== 'object' || !icon) {
    return '';
  }

  if (icon.type === 'svg') {
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