<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "reka-ui";
import { useWorkspaceStore } from "./workspace";
import { joinPath } from "./path";
import type { DirectoryEntry, FileSystemProvider } from "./types";

const props = defineProps<{
  fs: FileSystemProvider;
  /** The directory this lists, relative to the root of `fs`. */
  path: string;
  depth: number;
}>();

const workspace = useWorkspaceStore();
const entries = ref<DirectoryEntry[]>();
const error = ref<string>();

async function load() {
  try {
    entries.value = await props.fs.readDirectory(props.path);
    error.value = undefined;
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

onMounted(load);
// Files were created, renamed or deleted: read again, keeping what is on screen meanwhile.
watch(() => workspace.revision, load);

const pathOf = (entry: DirectoryEntry) => joinPath(props.path, entry.name);
const isOpen = (entry: DirectoryEntry) => workspace.expanded.has(pathOf(entry));
/** New items go inside a folder, and next to a file. */
const parentFor = (entry: DirectoryEntry) =>
  entry.type === "directory" ? pathOf(entry) : props.path;

function activate(entry: DirectoryEntry) {
  if (entry.type === "directory") workspace.toggle(pathOf(entry));
  else void workspace.openFile(pathOf(entry));
}

const indent = (depth: number) => ({ paddingLeft: `${8 + depth * 12}px` });
const iconOf = (entry: DirectoryEntry) =>
  entry.type === "file"
    ? "lucide:file"
    : isOpen(entry)
      ? "lucide:chevron-down"
      : "lucide:chevron-right";
</script>

<template>
  <p v-if="error" class="tree-message" :style="indent(depth)">{{ error }}</p>
  <p v-else-if="entries && !entries.length && depth === 0" class="tree-message">Pasta vazia.</p>
  <ul v-else-if="entries" class="tree-list" role="group">
    <template v-for="entry in entries" :key="entry.name">
      <ContextMenuRoot>
        <ContextMenuTrigger as-child>
          <li
            class="tree-row"
            role="treeitem"
            tabindex="0"
            :aria-expanded="entry.type === 'directory' ? isOpen(entry) : undefined"
            :style="indent(depth)"
            @click="activate(entry)"
            @keydown.enter="activate(entry)"
            @keydown.f2.prevent="workspace.rename(pathOf(entry))"
            @keydown.delete.prevent="workspace.remove(pathOf(entry), entry.type)"
          >
            <Icon :name="iconOf(entry)" class="size-3.5 shrink-0" />
            <span class="truncate">{{ entry.name }}</span>
          </li>
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent class="menubar-content">
            <ContextMenuItem class="menubar-item" @select="workspace.createFile(parentFor(entry))">
              Novo arquivo…
            </ContextMenuItem>
            <ContextMenuItem
              class="menubar-item"
              @select="workspace.createFolder(parentFor(entry))"
            >
              Nova pasta…
            </ContextMenuItem>
            <ContextMenuSeparator class="menubar-separator" />
            <ContextMenuItem class="menubar-item" @select="workspace.rename(pathOf(entry))">
              <span>Renomear…</span>
              <span class="menubar-shortcut">F2</span>
            </ContextMenuItem>
            <ContextMenuItem
              class="menubar-item"
              @select="workspace.remove(pathOf(entry), entry.type)"
            >
              <span>Excluir</span>
              <span class="menubar-shortcut">Del</span>
            </ContextMenuItem>
            <ContextMenuSeparator class="menubar-separator" />
            <ContextMenuItem class="menubar-item" @select="workspace.copyPath(pathOf(entry))">
              Copiar caminho
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenuRoot>
      <li v-if="entry.type === 'directory' && isOpen(entry)" role="none">
        <FileTreeNode :fs="fs" :path="pathOf(entry)" :depth="depth + 1" />
      </li>
    </template>
  </ul>
</template>

<style>
.tree-list {
  @apply m-0 list-none p-0;
}
.tree-row {
  @apply flex cursor-pointer items-center gap-1.5 truncate py-1 pr-2 text-[13px] outline-none hover:bg-[var(--ide-hover)] focus-visible:bg-[var(--ide-hover)];
}
.tree-message {
  @apply px-3 py-1 text-[13px] text-[var(--ide-fg-muted)];
}
</style>
