<script setup lang="ts">
const windowStore = useWindowStore();
</script>
<template>
  <Teleport to="body">
    <div class="!z-100 fixed">
      <TransitionGroup>
        <AppWindow
          v-for="[id, window] of windowStore.windowsMap"
          :key="id"
          :title="window.options.title"
          :content="(window.options.content as string)"
          :data="window.options.data"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>
