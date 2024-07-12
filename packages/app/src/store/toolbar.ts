import * as lenz from 'lenz';
import { defineStore } from 'pinia';
import { computed, onBeforeUnmount, reactive, ref } from 'vue';

export const useToolbarStore = defineStore('Toolbar', () => {
  const activeTool = ref<string>();
  const toolsMap = reactive(new Map()) as Map<string, lenz.ToolbarItem>;
  const tools = computed(() => Array.from(toolsMap.values()).sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)));
  const disposers = new Set<lenz.Disposable>();

  disposers.add(
    lenz.events.on('tools:prepare', (item) => {
      console.log('prepare', item);
      toolsMap.set(item.id, item);
    }),
  );

  disposers.add(
    lenz.events.on('tools:remove', (id) => {
      toolsMap.delete(id);
    }),
  );

  disposers.add(
    lenz.events.on('tools:activate', (id) => {
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
    activate: (toolId: string) => lenz.tools.activate(toolId),
  };
});