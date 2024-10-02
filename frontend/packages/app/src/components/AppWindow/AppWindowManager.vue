<script setup lang="ts">
const windowStore = useWindowStore();
const windowRefs = ref<any[]>([]);

function scheduleFocus() {
  setTimeout(() => {
    windowRefs.value.at(-1)?.focus();
  }, 0);
}
</script>
<template>
  <Teleport to="body">
    <AppWebWindow
      v-for="([id, w], i) of windowStore.windowsMap"
      :key="id"
      :ref="
        (r) => {
          if (r) {
            windowRefs[i] = r;
          } else {
            windowRefs.splice(i, 1);
          }
        }
      "
      v-bind="w.options"
      @close="scheduleFocus"
    />
  </Teleport>
</template>
