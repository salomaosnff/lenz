<script setup lang="ts">
import { marked } from "marked";
import DOMPurify from "dompurify";
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "reka-ui";
import { computed, ref, watch } from "vue";
import { useEditorStore } from "../editor/store";
import ExtensionContributions from "./ExtensionContributions.vue";
import { disableExtension, enableExtension, reloadExtension, uninstallExtension } from "./manager";
import { EXTENSION_PAGE_PREFIX } from "./page";
import { extensionRecords, titleOf } from "./registry";
import "./ui.css";

const props = defineProps<{ extensionId: string }>();

const editor = useEditorStore();
const record = computed(() => extensionRecords.get(props.extensionId));

const busy = ref(false);
const actionError = ref<string | null>(null);

async function run(action: (id: string) => Promise<void>) {
  busy.value = true;
  actionError.value = null;
  try {
    await action(props.extensionId);
  } catch (e) {
    // The record already carries a load failure; this is for the rest.
    actionError.value = e instanceof Error ? e.message : String(e);
  } finally {
    busy.value = false;
  }
}

async function remove() {
  await run(uninstallExtension);
  if (!actionError.value) editor.close(`${EXTENSION_PAGE_PREFIX}${props.extensionId}`);
}

// The README is the file next to the manifest. A dev server answers a missing file with its own
// page, so anything that is HTML is taken as "no README".
const readme = ref<{ html: string } | null>(null);
const readmeState = ref<"loading" | "missing" | "ready">("loading");
let token = 0;

async function loadReadme(folderUrl: string) {
  const current = ++token;
  readmeState.value = "loading";
  try {
    const response = await fetch(new URL("README.md", folderUrl), { cache: "no-cache" });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || type.includes("text/html")) throw new Error("missing");
    const html = DOMPurify.sanitize(await marked.parse(await response.text()), {
      USE_PROFILES: { html: true },
    });
    if (current !== token) return;
    readme.value = { html };
    readmeState.value = "ready";
  } catch {
    if (current !== token) return;
    readme.value = null;
    readmeState.value = "missing";
  }
}

// Again after a reload: the files may have changed.
watch(
  () => [record.value?.folderUrl, record.value?.status === "loading"] as const,
  ([folderUrl, loading]) => {
    if (folderUrl && !loading) loadReadme(folderUrl);
  },
  { immediate: true },
);

const contributionCount = computed(() => {
  const c = record.value?.manifest?.contributes;
  return (
    (c?.commands?.length ?? 0) +
    (c?.keybindings?.length ?? 0) +
    (c?.editors?.length ?? 0) +
    (c?.viewsContainers?.activitybar?.length ?? 0) +
    Object.values(c?.views ?? {}).flat().length
  );
});

const statusLabel = {
  loading: "Carregando…",
  active: "Ativa",
  inactive: "Desativada",
  error: "Com erro",
};
</script>

<template>
  <p v-if="!record" class="placeholder-message">Esta extensão não está mais instalada.</p>
  <article v-else class="ext-page">
    <header class="ext-header">
      <Icon name="lucide:blocks" class="ext-header-icon" />
      <div class="min-w-0 flex-1">
        <h1 class="ext-title">
          {{ titleOf(record) }}
          <span v-if="record.builtin" class="ext-badge ext-badge-builtin">Embutida</span>
          <span class="ext-badge" :class="{ 'ext-badge-error': record.status === 'error' }">
            {{ statusLabel[record.status] }}
          </span>
        </h1>
        <p class="ext-meta">
          {{ record.id
          }}<template v-if="record.manifest"> · v{{ record.manifest.version }}</template>
        </p>
        <p v-if="record.manifest?.description" class="mt-2 text-[13px]">
          {{ record.manifest.description }}
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            v-if="record.status === 'active' || record.status === 'loading'"
            class="ext-btn"
            :disabled="busy || record.status === 'loading'"
            @click="run(disableExtension)"
          >
            <Icon name="lucide:power-off" /> Desativar
          </button>
          <button
            v-else
            class="ext-btn ext-btn-primary"
            :disabled="busy"
            @click="run(enableExtension)"
          >
            <Icon name="lucide:power" /> Ativar
          </button>
          <button
            class="ext-btn"
            :disabled="busy || record.status === 'loading'"
            @click="run(reloadExtension)"
          >
            <Icon name="lucide:refresh-cw" :class="{ 'animate-spin': busy }" /> Recarregar
          </button>
          <button v-if="!record.builtin" class="ext-btn" :disabled="busy" @click="remove">
            <Icon name="lucide:trash-2" /> Remover
          </button>
        </div>
      </div>
    </header>

    <p v-if="record.error" class="ext-alert" role="alert">{{ record.error }}</p>
    <p v-if="actionError" class="ext-alert" role="alert">{{ actionError }}</p>

    <TabsRoot default-value="info" class="mt-6">
      <TabsList class="ext-tabs" aria-label="Seções da extensão">
        <TabsTrigger value="info" class="ext-tab">Informações</TabsTrigger>
        <TabsTrigger value="contributions" class="ext-tab">
          Contribuições
          <span v-if="contributionCount" class="ext-badge">{{ contributionCount }}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="info" class="ext-tab-panel">
        <p v-if="readmeState === 'loading'" class="text-[var(--ide-fg-muted)]">
          Carregando README…
        </p>
        <p v-else-if="readmeState === 'missing'" class="text-[var(--ide-fg-muted)]">
          Esta extensão não tem um README.
        </p>
        <!-- Sanitized by DOMPurify above. -->
        <div v-else-if="readme" class="markdown" v-html="readme.html" />
      </TabsContent>

      <TabsContent value="contributions" class="ext-tab-panel">
        <ExtensionContributions :manifest="record.manifest" />
      </TabsContent>
    </TabsRoot>
  </article>
</template>

<style>
.ext-page {
  @apply mx-auto max-w-3xl px-8 py-6 text-[14px];
}
.ext-header {
  @apply flex gap-5;
}
.ext-header-icon {
  @apply size-24 shrink-0 text-[var(--ide-fg-muted)];
}
.ext-title {
  @apply m-0 flex flex-wrap items-center gap-2 text-2xl font-semibold;
}
.ext-meta {
  @apply mt-1 text-[13px] text-[var(--ide-fg-muted)];
}
.ext-alert {
  @apply mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[13px] text-red-300;
}
.ext-tabs {
  @apply flex gap-1 border-b border-[var(--ide-border)];
}
.ext-tab {
  @apply -mb-px flex cursor-pointer items-center gap-1.5 border-0 border-b-2 border-transparent bg-transparent px-3 py-2 text-[13px] text-[var(--ide-fg-muted)] outline-none hover:text-[var(--ide-fg)] data-[state=active]:border-[var(--ide-accent)] data-[state=active]:text-[var(--ide-fg)];
}
.ext-tab-panel {
  @apply pt-4 outline-none;
}
.markdown {
  @apply leading-relaxed break-words;
}
.markdown h1,
.markdown h2,
.markdown h3 {
  @apply mt-6 mb-2 font-semibold;
}
.markdown h1 {
  @apply border-b border-[var(--ide-border)] pb-2 text-2xl;
}
.markdown h2 {
  @apply border-b border-[var(--ide-border)] pb-1 text-xl;
}
.markdown h3 {
  @apply text-base;
}
.markdown p,
.markdown ul,
.markdown ol,
.markdown pre,
.markdown table,
.markdown blockquote {
  @apply my-3;
}
.markdown ul {
  @apply list-disc pl-6;
}
.markdown ol {
  @apply list-decimal pl-6;
}
.markdown a {
  @apply text-[var(--ide-accent)] hover:underline;
}
.markdown code {
  @apply rounded bg-[var(--ide-hover)] px-1 py-px font-mono text-[0.9em];
}
.markdown pre {
  @apply overflow-auto rounded-md bg-[var(--ide-hover)] p-3;
}
.markdown pre code {
  @apply bg-transparent p-0;
}
.markdown blockquote {
  @apply border-l-4 border-[var(--ide-border)] pl-3 text-[var(--ide-fg-muted)];
}
.markdown table {
  @apply border-collapse;
}
.markdown th,
.markdown td {
  @apply border border-[var(--ide-border)] px-2 py-1;
}
.markdown img {
  @apply max-w-full;
}
</style>
