import { defineStore } from 'pinia';
import { computed, onBeforeUnmount, reactive } from 'vue';
import type { Disposable, ViewState } from '@editor/core';

export const useViewStore = defineStore('views', () => {
  const viewMap = reactive(new Map<string, ViewState>());
  const views = computed(() => Array.from(viewMap.values()));

  function setViewRef(id: string, element: HTMLElement) {
    const oldElement = viewMap.get(id);

    if (!oldElement?.element?.isSameNode(element)) {
      core.ViewHost.setViewElement(id, element);
    }
  }

  const disposers = new Set<Disposable>();

  disposers.add(
    core.EventHost.on('@app/views:update', (view) => {
      viewMap.set(view.meta.id, view);
    }),
  );

  onBeforeUnmount(() => {
    disposers.forEach(disposer => disposer.dispose());
  });

  function toggleView(id: string) {
    const view = viewMap.get(id);

    if (view?.visible) {
      core.ViewHost.hideView(id)
    } else {
      core.ViewHost.showView(id)
    }
  }

  return {
    setViewRef,
    views,
    toggleView
  };
});