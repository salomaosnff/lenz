<script setup lang="ts">
const windowStore = useWindowStore();
</script>
<template>
  <Teleport to="body">
    <div class="z-10">
      <AppWindow
        v-for="[id, window] of windowStore.windowsMap"
        :key="id"
        :title="window.options.title"
        :content="window.options.content"
        :channels="window.options.channels"
      />
    </div>
  </Teleport>
</template>
