<script setup lang="ts">
import { useToolbarStore } from '@/store/tools';
import { computed, ref } from 'vue';
import AppIcon from './AppIcon.vue';
import type { ToolHostItem } from 'lenz/internal';

const toolbarStore = useToolbarStore();
const hoveredItem = ref<ToolHostItem>();
const mainTools = computed(() => toolbarStore.tools.filter(tool => !tool.meta.parent));
const children = computed(() => hoveredItem.value && toolbarStore.tools.filter(tool => tool.meta.parent === hoveredItem.value?.meta.id));
const activeTool = computed(() => toolbarStore.tools.find(tool => tool.meta.id === toolbarStore.activeTool));
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
        :key="tool.meta.id"
        class="w-12 h-12 flex items-center justify-center block"
        :title="activeTool?.meta.parent === tool.meta.id ? activeTool.meta.name : tool.meta.name"
        @click="toolbarStore.activate(tool.meta.id)"
        @pointerenter="hoveredItem = tool"
      >
        <AppIcon
          v-if="activeTool?.meta.parent === tool.meta.id"
          class="w-6 h-6"
          :icon="activeTool.meta.icon"
          fill="yellow"
        />
        <AppIcon
          v-else
          class="w-6 h-6"
          :icon="tool.meta.icon"
          :fill="toolbarStore.activeTool === tool.meta.id ? 'yellow' : 'white'"
        />
      </button>
    </div>
    <div
      v-if="children?.length"
      class="flex absolute h-12 top-100% left-0 bg--background"
    >
      <button
        v-for="tool in children"
        :key="tool.meta.id"
        class="w-12 h-12 flex items-center justify-center block"
        :title="tool.meta.name"
        @click="toolbarStore.activate(tool.meta.id)"
      >
        <AppIcon
          class="w-6 h-6"
          :icon="tool.meta.icon"
          :fill="toolbarStore.activeTool === tool.meta.id ? 'yellow' : 'white'"
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
