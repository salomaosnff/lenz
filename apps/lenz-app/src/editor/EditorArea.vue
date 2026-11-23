<script setup lang="ts">
import { computed, onBeforeUnmount, watchEffect } from "vue";
import { setContextKey } from "../context";
import { getEditorProvider, getEditorProvidersFor } from "../providers";
import { historyOf } from "./history";
import EditorHost from "./EditorHost.vue";
import EditorSwitcher from "./EditorSwitcher.vue";
import TabBar from "./TabBar.vue";
import { useEditorStore } from "./store";

const editor = useEditorStore();

// Editors that apply to the active file, and the one being shown.
const providers = computed(() => {
  const tab = editor.activeTab;
  if (!tab) return [];
  // A page that is not a file has its one editor, and nothing to switch to.
  if (tab.locked) return [getEditorProvider(tab.editorId ?? "")].filter((p) => !!p);
  return getEditorProvidersFor(tab.name);
});
const activeProvider = computed(
  () => providers.value.find((p) => p.id === editor.activeTab?.editorId) ?? providers.value[0],
);

// Context keys for `when` expressions on views.
watchEffect(() => {
  setContextKey("activeEditor", activeProvider.value?.id);
  setContextKey("activeFile", editor.activeTab?.name);
  // Reads reactive state of the history, so these follow every edit, undo and redo.
  const history = editor.activeTab ? historyOf(editor.activeTab) : undefined;
  setContextKey("canUndo", history?.canUndo ?? false);
  setContextKey("canRedo", history?.canRedo ?? false);
});
onBeforeUnmount(() => {
  setContextKey("activeEditor", undefined);
  setContextKey("activeFile", undefined);
  setContextKey("canUndo", undefined);
  setContextKey("canRedo", undefined);
});
</script>

<template>
  <div class="editor-area">
    <TabBar>
      <EditorSwitcher
        v-if="editor.activeTab && providers.length > 1 && activeProvider"
        :providers="providers"
        :active-id="activeProvider.id"
        @select="editor.setEditor(editor.activeTab.id, $event)"
      />
    </TabBar>
    <template v-if="editor.activeTab">
      <div v-if="activeProvider" class="editor-body">
        <!-- Keyed so each file/editor pair gets its own state. -->
        <EditorHost
          :key="`${editor.activeTab.id}:${activeProvider.id}`"
          :tab="editor.activeTab"
          :provider="activeProvider"
        />
      </div>
      <p v-else class="placeholder-message">Nenhum editor disponível para este arquivo.</p>
    </template>
    <div v-else class="editor-empty">
      <Icon name="lucide:files" class="size-16 opacity-20" />
      <p>Abra um arquivo no Explorer</p>
    </div>
  </div>
</template>

<style>
.editor-area {
  @apply flex h-full min-h-0 flex-col;
}
.editor-body {
  @apply min-h-0 flex-1 overflow-auto;
}
.editor-empty {
  @apply flex flex-1 flex-col items-center justify-center gap-3 text-sm text-[var(--ide-fg-muted)] select-none;
}
</style>
