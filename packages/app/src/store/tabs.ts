import type { Disposable, Icon, View } from '@editor/core';
import { defineStore } from 'pinia';
import { computed, onBeforeUnmount, reactive, ref } from 'vue';

const { EventHost } = require('@editor/core');

export interface TabItem {
    id: string;
    title: string;
    icon?: Icon;
    content: string;
    views: View[];
}

export const useTabsStore = defineStore('Tabs', () => {
  const tabsMap = reactive(new Map()) as Map<string, TabItem>;
  const activeTabId = ref<string>();
  const tabs = computed(() => Array.from(tabsMap.values()));
  const disposers = new Set<Disposable>();

  disposers.add(
    EventHost.on('@app/tabs:prepare', (item: TabItem) => {
      tabsMap.set(item.id, item);
    }),
  );

  disposers.add(
    EventHost.on('@app/tabs:remove', (id: string) => {
      tabsMap.delete(id);
    }),
  );

  disposers.add(
    EventHost.on('@app/tabs:activate', (item: TabItem) => {
      activeTabId.value = item.id;
    }),
  );

  onBeforeUnmount(() => {
    for (const disposer of disposers) {
      disposer.dispose();
    }
  });

  return {
    tabs,
    activeTab: computed(() => activeTabId.value ? tabsMap.get(activeTabId.value) : tabsMap.values().next().value), 
  };
});