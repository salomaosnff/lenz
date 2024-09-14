<script setup lang="ts">
import './composable/isDark';
const extensionsStore = useExtensionsStore();

declare global {
  interface Window {
    __LENZ_EXTENSIONS__?: any[];
    __LENZ_STORE__: {
      commands: typeof import("./store/commands").useCommandsStore;
      editor: typeof import("./store/editor").useEditorStore;
      files: typeof import("./store/file").useFileStore;
      hotkeys: typeof import("./store/hotkeys").useHotKeysStore;
      menubar: typeof import("./store/menubar").useMenuBarStore;
      windows: typeof import("./store/windows").useWindowStore;
      dialog: typeof import("./store/dialog").useDialogStore;
    };
  }
}

window.__LENZ_STORE__ = {
  commands: useCommandsStore,
  editor: useEditorStore,
  files: useFileStore,
  menubar: useMenuBarStore,
  hotkeys: useHotKeysStore,
  windows: useWindowStore,
  dialog: useDialogStore,
};

for (const i in window.__LENZ_STORE__) {
  (window.__LENZ_STORE__ as any)[i]?.();
}


const ready = ref(false);
extensionsStore.init().then(() => {
  ready.value = true;
});
</script>
<template>
  <RouterView v-if="ready" />
  <div
    class="fixed top-16 w-full max-w-480px left-50% translate-x--50% px-4 z-99"
  >
    <AppPrompt class="shadow-lg" />
  </div>
</template>
