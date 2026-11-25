<script setup lang="ts">
import { executeCommand } from "../commands";
import FileTreeNode from "./FileTreeNode.vue";
import { useWorkspaceStore } from "./workspace";

const workspace = useWorkspaceStore();
</script>

<template>
  <div v-if="workspace.fs" class="workspace">
    <div class="workspace-header">
      <span class="truncate font-medium">Projeto</span>
      <button
        class="workspace-button"
        title="Novo arquivo"
        aria-label="Novo arquivo"
        @click="workspace.createFile()"
      >
        <Icon name="lucide:file-plus" class="size-3.5" />
      </button>
      <button
        class="workspace-button"
        title="Nova pasta"
        aria-label="Nova pasta"
        @click="workspace.createFolder()"
      >
        <Icon name="lucide:folder-plus" class="size-3.5" />
      </button>
      <button
        class="workspace-button"
        title="Atualizar"
        aria-label="Atualizar"
        @click="workspace.refresh()"
      >
        <Icon name="lucide:refresh-cw" class="size-3.5" />
      </button>
      <button
        class="workspace-button"
        title="Baixar o projeto"
        aria-label="Baixar o projeto"
        @click="executeCommand('file.downloadProject')"
      >
        <Icon name="lucide:download" class="size-3.5" />
      </button>
    </div>
    <FileTreeNode :fs="workspace.fs" path="" :depth="0" />
  </div>
  <p v-else class="tree-message">{{ workspace.error ?? "Carregando…" }}</p>
</template>

<style>
.workspace-header {
  @apply flex items-center gap-0.5 px-2 py-1 text-[13px];
}
.workspace-header .truncate {
  @apply flex-1;
}
.workspace-button {
  @apply flex cursor-pointer items-center justify-center rounded border-0 bg-transparent p-1 text-inherit outline-none hover:bg-white/10;
}
</style>
