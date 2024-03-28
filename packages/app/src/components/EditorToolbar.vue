<script setup lang="ts">
import type { Tool } from '@/store/toolbar';
import { useToolbarStore } from '@/store/toolbar';
import { computed, ref } from 'vue';
import AppIcon from './AppIcon.vue';

const toolbarStore = useToolbarStore();
const hoveredItem = ref<Tool>();
const mainTools = computed(() => toolbarStore.tools.filter(tool => !tool.parentId));
const children = computed(() => hoveredItem.value && toolbarStore.tools.filter(tool => tool.parentId === hoveredItem.value?.id));
const activeTool = computed(() => toolbarStore.tools.find(tool => tool.id === toolbarStore.activeTool));
</script>

<template>
  <div
    class="bg--background relative z-10"
    @pointerleave="hoveredItem = undefined"
  >
    <div
      class="flex h-12"
      :class="$style['toolbar']"
    >
      <button
        v-for="tool in mainTools"
        :key="tool.id"
        class="w-12 h-12 flex items-center justify-center block"
        :title="activeTool?.parentId === tool.id ? activeTool.title : tool.title"
        @click="toolbarStore.activate(tool.id)"
        @pointerenter="hoveredItem = tool"
      >
        <AppIcon
          v-if="activeTool?.parentId === tool.id"
          class="w-6 h-6"
          :icon="activeTool.icon"
          fill="yellow"
        />
        <AppIcon
          v-else
          class="w-6 h-6"
          :icon="tool.icon"
          :fill="toolbarStore.activeTool === tool.id ? 'yellow' : 'white'"
        />
      </button>
    </div>
    <div
      v-if="children?.length"
      class="flex absolute h-12 top-100% left-0 bg--background"
    >
      <button
        v-for="tool in children"
        :key="tool.id"
        class="w-12 h-12 flex items-center justify-center block"
        :title="tool.title"
        @click="toolbarStore.activate(tool.id)"
      >
        <AppIcon
          class="w-6 h-6"
          :icon="tool.icon"
          :fill="toolbarStore.activeTool === tool.id ? 'yellow' : 'white'"
        />
      </button>
    </div>
  </div>
</template>

<style module lang="scss">
.toolbar {
  color: #f0f0f0;
  border-bottom: 1px solid var(--color-surface);

  & > button {
    &:hover {
      background-color: #ffffff1a;
    }
  }
}
</style>
