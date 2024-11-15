<script setup lang="ts">

defineProps<{
  path: string;
}>();

</script>
<template>
  <svg class="ui-icon" viewBox="0 0 24 24" style="fill: currentColor">
    <path :d="path" />
  </svg>
</template>

<style>
.ui-icon {
  display: inline-block;
  vertical-align: middle;
  fill: currentColor;
  width: 1em;
  height: 1em;
}
</style>
