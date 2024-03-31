/* eslint-disable @typescript-eslint/consistent-type-imports */
import { useInternal } from '@/composables/lenz';
import { defineStore } from 'pinia';
import { computed, customRef, ref } from 'vue';

const lenz = useInternal();

export const useToolbarStore = defineStore('Toolbar', () => {
  const activeTool = ref<string>();
  const toolsMap = customRef((track, trigger) => {
    let value = lenz.tools.toolMap;

    lenz.tools.on('update', () => {
      value = lenz.tools.toolMap;
      trigger();
    });

    return {
      get() {
        track();
        return value;
      },
      set() {
        console.warn('toolMap is readonly');
      },
    };
  });

  const tools = computed(() => Array.from(toolsMap.value.values()).sort((a, b) => (a.meta.priority ?? 0) - (b.meta.priority ?? 0)));

  return {
    tools,
    activeTool,
    activate: (toolId: string) => lenz.tools.activate(toolId),
  };
});