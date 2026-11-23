<script setup lang="ts">
import { useStorage } from "@vueuse/core";
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from "reka-ui";
import { computed, nextTick, ref, watch } from "vue";
import { availableCommands, executeCommand } from ".";
import { keybindingsFor } from "../keybindings";
import { paletteOpen as open } from "./palette";
import { commandDetail, searchCommands } from "./search";

const query = ref("");
const active = ref(0);
const input = ref<HTMLInputElement>();
const list = ref<HTMLElement>();
/** Ids of the commands run last, most recent first. */
const recent = useStorage<string[]>("lenz:commands:recent", []);

// Reactive: follows commands being registered and the `when` of each one.
const results = computed(() =>
  open.value
    ? searchCommands(availableCommands(), query.value, recent.value, (command) =>
        commandDetail(command, keybindingsFor(command.id).length > 0),
      )
    : [],
);

watch(query, () => (active.value = 0));
watch(open, async (isOpen) => {
  if (!isOpen) return;
  query.value = "";
  active.value = 0;
  await nextTick();
  input.value?.focus();
});

function move(step: number) {
  const count = results.value.length;
  if (!count) return;
  active.value = (active.value + step + count) % count;
  nextTick(() =>
    list.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" }),
  );
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown") move(1);
  else if (event.key === "ArrowUp") move(-1);
  else if (event.key === "Home") active.value = 0;
  else if (event.key === "End") active.value = Math.max(0, results.value.length - 1);
  else if (event.key === "Enter") run(results.value[active.value]?.id);
  else return;
  event.preventDefault();
}

async function run(id: string | undefined) {
  if (!id) return;
  recent.value = [id, ...recent.value.filter((r) => r !== id)].slice(0, 20);
  open.value = false;
  // After the palette closes, so a command that needs focus (an editor) gets it back.
  await nextTick();
  try {
    await executeCommand(id);
  } catch (error) {
    console.error(`[lenz] the command "${id}" failed`, error);
  }
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="palette-overlay" />
      <DialogContent class="palette" :aria-describedby="undefined" @open-auto-focus.prevent>
        <DialogTitle class="sr-only">Paleta de comandos</DialogTitle>
        <input
          ref="input"
          v-model="query"
          class="palette-input"
          placeholder="Digite o nome de um comando…"
          spellcheck="false"
          autocomplete="off"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-label="Comando"
          @keydown="onKeydown"
        />
        <ul id="palette-list" ref="list" class="palette-list" role="listbox">
          <li
            v-for="(command, index) in results"
            :key="command.id"
            class="palette-item"
            role="option"
            :aria-selected="index === active"
            @mousemove="active = index"
            @click="run(command.id)"
          >
            <Icon :name="command.icon ?? 'lucide:terminal'" class="palette-icon size-4" />
            <span class="palette-title">
              <span v-if="command.category" class="palette-category">{{ command.category }}: </span>
              {{ command.title }}
            </span>
            <kbd v-if="keybindingsFor(command.id)[0]" class="palette-key">{{
              keybindingsFor(command.id)[0]
            }}</kbd>
            <span v-else class="palette-id">{{ command.id }}</span>
          </li>
          <li v-if="!results.length" class="palette-empty">Nenhum comando encontrado.</li>
        </ul>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style>
.palette-overlay {
  @apply fixed inset-0 z-50 bg-black/30;
}
.palette {
  @apply fixed top-[12vh] left-1/2 z-50 flex max-h-[60vh] w-[min(640px,92vw)] -translate-x-1/2 flex-col overflow-hidden rounded-lg border border-[var(--ide-menu-border)] bg-[var(--ide-menu-bg)] text-[var(--ide-fg)] shadow-[0_12px_32px_rgba(0,0,0,0.5)];
}
.palette-input {
  @apply w-full border-0 border-b border-[var(--ide-border)] bg-transparent px-4 py-3 text-sm text-inherit outline-none;
}
.palette-list {
  @apply m-0 min-h-0 flex-1 list-none overflow-y-auto p-1;
}
.palette-item {
  @apply flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-[13px];
}
.palette-item[aria-selected="true"] {
  @apply bg-[var(--ide-accent)] text-[var(--color-primary-foreground)];
}
.palette-icon {
  @apply shrink-0 opacity-70;
}
.palette-title {
  @apply min-w-0 flex-1 truncate;
}
.palette-category {
  @apply opacity-60;
}
.palette-id {
  @apply shrink-0 font-mono text-[11px] opacity-50;
}
.palette-key {
  @apply shrink-0 rounded border border-current/30 px-1.5 py-0.5 font-sans text-[11px] opacity-80;
}
.palette-empty {
  @apply px-3 py-4 text-center text-[13px] text-[var(--ide-fg-muted)];
}
</style>
