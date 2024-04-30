import type { ExtensionMetadata, ToolbarItem, Disposable } from '@editor/core';
import { defineStore } from 'pinia';
import { computed, onBeforeUnmount, reactive, ref } from 'vue';

export interface Tool extends ToolbarItem {
  extension: ExtensionMetadata
}

export const useToolbarStore = defineStore('Toolbar', () => {
  const activeTool = ref<string>();
  const toolsMap = reactive(new Map()) as Map<string, Tool>;
  const tools = computed(() => Array.from(toolsMap.values()).sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)));
  const disposers = new Set<Disposable>();

  disposers.add(
    core.EventHost.on('@app/tools:prepare', (item) => {
      toolsMap.set(item.id, item);
    }),
  );

  disposers.add(
    core.EventHost.on('@app/tools:remove', (id) => {
      toolsMap.delete(id);
    }),
  );

  disposers.add(
    core.EventHost.on('@app/tools:activate', (id) => {
      console.log('activate', id);
      activeTool.value = id;
    }),
  );

  onBeforeUnmount(() => {
    for (const disposer of disposers) {
      disposer.dispose();
    }
  });

  return {
    tools,
    activeTool,
    activate: core.ToolHost.activate,
  };
});