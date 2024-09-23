import { defineStore } from "pinia";

export const useExtensionsStore = defineStore("extensions", () => {
  const extensionsToLoad = window.__LENZ_EXTENSIONS__ || [];
  delete window.__LENZ_EXTENSIONS__;

  const loadedExtensions = ref<Map<string, any>>(new Map());
  const loadingState = ref<{
    extension: any;
    state: "loading" | "unload";
  }>();

  async function loadExtension(extension: any) {
    try {
      loadingState.value = {
        extension,
        state: "loading",
      };

      const data: any = {
        extension,
        context: {
          subscriptions: new Set(),
        },
      };

      if (extension.script_url) {
        const { activate, deactivate } = await import(/* @vite-ignore */extension.script_url);

        data.activate = activate;
        data.deactivate = deactivate;

        await activate(data.context);

        loadedExtensions.value.set(extension.id, data);
      }

      loadedExtensions.value.set(extension.id, data);
    } catch (e) {
      console.error(e);
    } finally {
      loadingState.value = undefined;
    }
  }

  async function unloadExtension(extension: any) {
    try {
      loadingState.value = {
        extension,
        state: "unload",
      };

      const data = loadedExtensions.value.get(extension.id);

      if (data && data.deactivate) {
        await data.deactivate(data.context);
      }

      loadedExtensions.value.delete(extension.id);
    } catch (e) {
      console.error(`Failed to unload extension ${extension.id}`, e);
    } finally {
      loadingState.value = undefined;
    }
  }

  async function init() {
    for (const extension of extensionsToLoad) {
      if (!loadedExtensions.value.has(extension.id)) {
        await loadExtension(extension);
      }
    }
  }

  return {
    loadedExtensions: readonly(loadedExtensions),
    loadingState: readonly(loadingState),
    loadExtension,
    unloadExtension,
    init,
  };
});
