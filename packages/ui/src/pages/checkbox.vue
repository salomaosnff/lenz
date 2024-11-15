<script setup lang="ts">
const colors = [
  'primary',
  'secondary',
  'success',
  'danger',
  'warning',
  'info',
]
</script>
<template>
  <div class="flex gap-1">
    <UiCheckbox v-for="color in colors" :color />
  </div>
  <div class="flex gap-1 text-5">
    <UiCheckbox v-for="color in colors" :color />
  </div>
  <div class="flex gap-1 text-6">
    <UiCheckbox v-for="color in colors" :color />
  </div>
  <div class="flex gap-1 text-8">
    <UiCheckbox v-for="color in colors" :color />
  </div>
  <div class="flex gap-1 text-16">
    <UiCheckbox v-for="color in colors" :color />
  </div>
</template>