<script setup lang="ts">
import { computed, ref } from "vue";
import { useEditorStore } from "../editor/store";
import { extensionRecords, titleOf } from "./registry";
import { installFromUrl } from "./manager";
import { EXTENSION_PAGE_PREFIX, openExtensionPage } from "./page";
import "./ui.css";

const editor = useEditorStore();

// Built-in ones first, then the others, each group by name.
const records = computed(() =>
  [...extensionRecords.values()].sort(
    (a, b) => Number(b.builtin) - Number(a.builtin) || titleOf(a).localeCompare(titleOf(b)),
  ),
);

const url = ref("");
const installing = ref(false);
const error = ref<string | null>(null);

async function install() {
  if (!url.value.trim() || installing.value) return;
  installing.value = true;
  error.value = null;
  try {
    const id = await installFromUrl(url.value);
    url.value = "";
    openExtensionPage(id);
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    installing.value = false;
  }
}

const statusLabel = {
  loading: "Carregando",
  active: "Ativa",
  inactive: "Desativada",
  error: "Erro",
};
</script>

<template>
  <form class="ext-install" @submit.prevent="install">
    <input
      v-model="url"
      class="ext-input"
      type="url"
      placeholder="URL da pasta da extensão"
      aria-label="URL da extensão"
      :disabled="installing"
    />
    <button class="ext-btn ext-btn-primary" type="submit" :disabled="installing || !url.trim()">
      <Icon
        :name="installing ? 'lucide:loader-circle' : 'lucide:download'"
        :class="{ 'animate-spin': installing }"
      />
      Carregar
    </button>
  </form>
  <p v-if="error" class="ext-error" role="alert">{{ error }}</p>

  <p v-if="!records.length" class="placeholder-message">Nenhuma extensão instalada.</p>
  <ul v-else class="ext-list">
    <li
      v-for="record in records"
      :key="record.id"
      class="ext-item"
      :class="{ 'ext-item-active': editor.activeId === EXTENSION_PAGE_PREFIX + record.id }"
      tabindex="0"
      :title="record.error"
      @click="openExtensionPage(record.id)"
      @keydown.enter="openExtensionPage(record.id)"
    >
      <Icon
        name="lucide:blocks"
        class="ext-item-icon"
        :class="{ 'opacity-40': record.status === 'inactive' }"
      />
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5">
          <span class="ext-item-name" :class="{ 'opacity-60': record.status === 'inactive' }">{{
            titleOf(record)
          }}</span>
          <span v-if="record.manifest" class="ext-item-version">{{ record.manifest.version }}</span>
        </div>
        <div v-if="record.manifest?.description" class="ext-item-description">
          {{ record.manifest.description }}
        </div>
        <div class="mt-1 flex flex-wrap gap-1">
          <span v-if="record.builtin" class="ext-badge ext-badge-builtin">Embutida</span>
          <span
            v-if="record.status !== 'active'"
            class="ext-badge"
            :class="{ 'ext-badge-error': record.status === 'error' }"
          >
            {{ statusLabel[record.status] }}
          </span>
        </div>
      </div>
    </li>
  </ul>
</template>

<style>
.ext-install {
  @apply flex gap-1.5 px-3 py-2;
}
.ext-input {
  @apply h-7 min-w-0 flex-1 rounded-md border border-[var(--ide-border)] bg-transparent px-2 text-[13px] text-[var(--ide-fg)] outline-none focus:border-[var(--ide-accent)];
}
.ext-error {
  @apply px-3 pb-2 text-[12px] text-red-400;
}
.ext-list {
  @apply py-0.5;
}
.ext-item {
  @apply mx-1.5 flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 outline-none hover:bg-[var(--ide-hover)] focus-visible:bg-[var(--ide-hover)];
}
.ext-item-active {
  @apply bg-[var(--ide-hover)];
}
.ext-item-icon {
  @apply mt-0.5 size-8 shrink-0 text-[var(--ide-fg-muted)];
}
.ext-item-name {
  @apply truncate text-[13px] font-semibold;
}
.ext-item-version {
  @apply shrink-0 text-[11px] text-[var(--ide-fg-muted)];
}
.ext-item-description {
  @apply truncate text-[12px] text-[var(--ide-fg-muted)];
}
</style>
