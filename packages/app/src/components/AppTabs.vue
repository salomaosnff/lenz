<script setup lang="ts">
import { useViewStore } from '@/store/views';
import AppIcon from './AppIcon.vue';

const tabsStore = useViewStore();
</script>

<template>
  <div
    class="flex h-12 bg--background"
    :class="$style['tabs']"
  >
    <button
      v-for="tab in tabsStore.panelMap.values()"
      :key="tab.id"
      class="w-12 h-12 flex items-center justify-center block"
      :title="tab.name"
    >
      <AppIcon
        v-if="tab.icon"
        class="w-6 h-6"
        :icon="tab.icon"
        fill="white"
      />
    </button>
  </div>
</template>

<style module lang="scss">
.tabs {
  height: 48px;
  color: #f0f0f0;

  & > button {
    &:hover {
      background-color: #ffffff1a;
    }
  }
}
</style>
