<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { allCommands } from "../commands";
import "../extensions/ui.css";
import {
  isCustomized,
  keybindingsPaused,
  listKeybindings,
  resetUserKeybinding,
  setUserKeybinding,
} from ".";
import { chordOf, chordToText, formatKey, parseKey } from "./keys";

const search = ref("");

interface Row {
  id: string;
  title: string;
  category?: string;
  bindings: { key: string; label: string; when?: string; user: boolean }[];
  customized: boolean;
  /** Other commands with the same key, as titles. */
  conflicts: string[];
}

const rows = computed<Row[]>(() => {
  const bindings = listKeybindings();
  const titles = new Map(allCommands().map((c) => [c.id, c.title]));
  return allCommands()
    .map((command) => {
      const own = bindings.filter((b) => b.command === command.id);
      const conflicts = own.flatMap((b) =>
        bindings
          .filter((o) => o.command !== command.id && o.label === b.label && o.when === b.when)
          .map((o) => titles.get(o.command) ?? o.command),
      );
      return {
        id: command.id,
        title: command.title,
        category: command.category,
        bindings: own,
        customized: isCustomized(command.id),
        conflicts: [...new Set(conflicts)],
      };
    })
    .sort(
      (a, b) =>
        (a.category ?? "").localeCompare(b.category ?? "") || a.title.localeCompare(b.title),
    );
});

const filtered = computed(() => {
  const text = search.value.trim().toLowerCase();
  if (!text) return rows.value;
  // Searching by the keys themselves works too: "ctrl+s".
  return rows.value.filter((row) =>
    [row.title, row.id, row.category ?? "", ...row.bindings.map((b) => b.label)].some((part) =>
      part.toLowerCase().includes(text),
    ),
  );
});

// Recording a new shortcut: the keys pressed are collected (up to two steps, as in Ctrl+K Ctrl+S),
// next to the condition it works under. Enter confirms, and Esc gives up.
const editing = ref<string | null>(null);
const recorded = ref<string[]>([]);
const when = ref("");
const error = ref<string | null>(null);
const recorder = ref<HTMLElement[] | HTMLElement>();

function stopRecording() {
  editing.value = null;
  recorded.value = [];
  keybindingsPaused.value = false;
}

async function startRecording(row: Row) {
  editing.value = row.id;
  recorded.value = [];
  // Starts from the condition the command's shortcut has now.
  when.value = row.bindings.find((b) => b.when)?.when ?? "";
  error.value = null;
  keybindingsPaused.value = true;
  await nextTick();
  [recorder.value].flat()[0]?.focus();
}

function record(event: KeyboardEvent) {
  event.preventDefault();
  event.stopPropagation();
  const chord = chordOf(event);
  if (!chord) return;
  const plain = !chord.ctrl && !chord.alt && !chord.shift && !chord.meta;
  if (plain && chord.key === "escape") return stopRecording();
  if (plain && chord.key === "enter") return recorded.value.length ? confirm() : undefined;
  recorded.value = [...recorded.value, chordToText(chord)].slice(-2);
}

function confirm() {
  if (!editing.value || !recorded.value.length) return;
  try {
    setUserKeybinding(editing.value, recorded.value.join(" "), when.value);
    stopRecording();
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

/** Leaving the recorder as a whole (not just moving between its two fields) gives up. */
function leave(event: FocusEvent) {
  if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null))
    stopRecording();
}

const labelOf = (keys: string[]) => (keys.length ? formatKey(parseKey(keys.join(" "))) : "");

onBeforeUnmount(() => {
  keybindingsPaused.value = false;
});
</script>

<template>
  <div class="kb-page">
    <header class="kb-header">
      <h1 class="m-0 text-xl font-semibold">Atalhos de teclado</h1>
      <input
        v-model="search"
        class="ext-input kb-search"
        type="search"
        placeholder="Buscar por comando ou tecla"
        aria-label="Buscar atalhos"
      />
    </header>

    <p v-if="!filtered.length" class="placeholder-message">Nenhum comando encontrado.</p>
    <table v-else class="kb-table">
      <thead>
        <tr>
          <th>Comando</th>
          <th>Atalho</th>
          <th>Condição</th>
          <th>Origem</th>
          <th class="w-px" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in filtered" :key="row.id">
          <td>
            <div>
              <span v-if="row.category" class="text-[var(--ide-fg-muted)]"
                >{{ row.category }}: </span
              >{{ row.title }}
            </div>
            <code class="kb-id">{{ row.id }}</code>
          </td>
          <td>
            <div v-if="editing === row.id" class="kb-recorder" @focusout="leave">
              <div
                ref="recorder"
                class="kb-capture"
                tabindex="0"
                role="textbox"
                aria-label="Pressione as teclas do novo atalho"
                @keydown="record"
              >
                <kbd v-if="recorded.length" class="kb-key">{{ labelOf(recorded) }}</kbd>
                <span v-else class="text-[var(--ide-fg-muted)]">Pressione as teclas…</span>
              </div>
              <input
                v-model="when"
                class="ext-input kb-when"
                placeholder="Condição (when), ex.: activeFile"
                aria-label="Condição do atalho"
                spellcheck="false"
                @keydown.enter.prevent="confirm"
                @keydown.esc.prevent="stopRecording"
              />
              <button
                class="ext-btn ext-btn-primary"
                :disabled="!recorded.length"
                @mousedown.prevent="confirm"
              >
                OK
              </button>
              <span class="kb-hint"
                >Enter confirma, Esc cancela. Deixe a condição vazia para valer sempre.</span
              >
              <p v-if="error" class="ext-error !p-0" role="alert">{{ error }}</p>
            </div>
            <template v-else>
              <div class="flex flex-wrap gap-1">
                <kbd v-for="b in row.bindings" :key="b.key + b.when" class="kb-key">{{
                  b.label
                }}</kbd>
                <span v-if="!row.bindings.length" class="text-[var(--ide-fg-muted)]">—</span>
              </div>
              <p v-if="row.conflicts.length" class="kb-conflict">
                <Icon name="lucide:triangle-alert" /> Também usado por:
                {{ row.conflicts.join(", ") }}
              </p>
            </template>
          </td>
          <td class="text-[12px] text-[var(--ide-fg-muted)]">
            <code
              v-for="b in row.bindings.filter((b) => b.when)"
              :key="b.key + b.when"
              class="block"
              >{{ b.when }}</code
            >
          </td>
          <td>
            <span class="ext-badge" :class="{ 'ext-badge-builtin': row.customized }">
              {{ row.customized ? "Usuário" : "Padrão" }}
            </span>
          </td>
          <td class="whitespace-nowrap">
            <button
              class="kb-icon"
              title="Alterar o atalho"
              aria-label="Alterar o atalho"
              @click="startRecording(row)"
            >
              <Icon name="lucide:pencil" />
            </button>
            <button
              class="kb-icon"
              title="Remover o atalho"
              aria-label="Remover o atalho"
              :disabled="!row.bindings.length"
              @click="setUserKeybinding(row.id, null)"
            >
              <Icon name="lucide:x" />
            </button>
            <button
              class="kb-icon"
              title="Restaurar o padrão"
              aria-label="Restaurar o padrão"
              :disabled="!row.customized"
              @click="resetUserKeybinding(row.id)"
            >
              <Icon name="lucide:rotate-ccw" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style>
.kb-page {
  @apply mx-auto max-w-5xl px-8 py-6 text-[13px];
}
.kb-header {
  @apply mb-4 flex flex-wrap items-center justify-between gap-3;
}
.kb-search {
  @apply w-72 flex-none;
}
.kb-table {
  @apply w-full border-collapse text-left;
}
.kb-table th {
  @apply border-b border-[var(--ide-border)] px-2 py-1.5 text-[12px] font-medium text-[var(--ide-fg-muted)];
}
.kb-table td {
  @apply border-b border-[var(--ide-border)] px-2 py-2 align-top;
}
.kb-id {
  @apply font-mono text-[11px] text-[var(--ide-fg-muted)];
}
.kb-key {
  @apply rounded border border-[var(--ide-border)] bg-[var(--ide-hover)] px-1.5 py-px font-mono text-[12px];
}
.kb-conflict {
  @apply mt-1 flex items-center gap-1 text-[12px] text-amber-400;
}
.kb-recorder {
  @apply flex flex-wrap items-center gap-2;
}
.kb-capture {
  @apply flex h-7 min-w-44 items-center rounded-md border border-[var(--ide-accent)] px-2 outline-none;
}
.kb-when {
  @apply w-64 flex-none;
}
.kb-hint {
  @apply text-[11px] text-[var(--ide-fg-muted)];
}
.kb-icon {
  @apply inline-flex size-6 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-[var(--ide-fg-muted)] hover:bg-[var(--ide-hover)] hover:text-[var(--ide-fg)] disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent;
}
</style>
