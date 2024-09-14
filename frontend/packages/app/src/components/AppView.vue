<script setup lang="ts">

defineProps<{
  title?: string;
}>()

</script>
<template>
  <div class="flex flex-col gap-1">
    <p v-if="title" class="text-3 uppercase fg--muted">{{ title }}</p>
    <div class="flex-1 w-full flex overflow-auto">
      <slot></slot>
    </div>
  </div>
</template>
