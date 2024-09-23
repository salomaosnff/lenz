<script lang="ts" setup>
import { useEditorStore } from "../store/editor";

import { ref } from "vue";
import AppPanel from "../components/AppPanel.vue";

const route = useRoute();
const router = useRouter();
const editor = useEditorStore();

const isMobile = ref(false);

const lockIframe = ref(false);

provide("lockIframe", {
  lockIframe,
});

const fileStore = useFileStore();

const html = computed(() => fileStore.currentFile?.text());

const settingsStore = useSettingsStore();

watch(
  () => route.query.file?.toString(),
  async (file) => {
    if (!file) {
      return;
    }

    await router.replace({ query: { ...route.query, file: undefined } });

    fileStore.openFile(file);
  },
  { immediate: true }
);
</script>
<template>
  <div
    class="w-full h-full flex flex-col pa-2 gap-2 bg--surface"
    :class="{
      'pointer-events-none': lockIframe,
    }"
  >
    <AppMenubar />
    <AppPanel>
      <div class="flex items-center">
        <span>Arquivo atual: </span>
        <p class="px-4">{{ fileStore.currentFile?.filepath }}</p>
        <span
          v-if="fileStore.currentFile?.dirty"
          class="text-3 font-bold fg--warning"
          >Há alterações não salvas</span
        >
      </div>
    </AppPanel>
    <AppCommandPalette
      class="fixed top-12 left-50% w-120 translate-x--50% z-99"
    />
    <AppHotkeys class="fixed top-12 right-4 z-99" />
    <div
      class="app-editor-view w-full flex-1 pa-4 relative justify-center items-center"
    >
      <AppCanvas
        v-if="fileStore.currentFile"
        v-model="editor.currentDocument"
        v-model:active="editor.selectedElements"
        v-model:hover="editor.hoveredElement"
        :html="html"
        :is-mobile
        class="mx-auto h-full bg-white"
        :style="{
          maxWidth: `${settingsStore.settings.frame.width}px`,
        }"
      />
    </div>
    <AppWindowManager />
  </div>
</template>
<style scoped>
.tool-grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(auto-fill, 32px);
  gap: 0.5rem;
}

.app-editor-view {
  --s: 64px; /* control the size*/
  --c1: var(--color-surface-muted);
  --c2: var(--color-surface);

  --g: #0000 90deg, var(--c1) 0;
  background: conic-gradient(from 90deg at 2px 2px, var(--g)),
    conic-gradient(from 90deg at 1px 1px, var(--g)), var(--c2);
  background-size:
    var(--s) var(--s),
    calc(var(--s) / 5) calc(var(--s) / 5);
}
</style>
