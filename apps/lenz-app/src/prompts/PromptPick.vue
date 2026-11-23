<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { filterEntries, highlight, type PickEntry, type PickRequest } from ".";

const props = defineProps<{ request: PickRequest }>();

const query = ref("");
const active = ref(0);
const input = ref<HTMLInputElement>();
const list = ref<HTMLElement>();
const checked = ref(new Set<PickEntry>());

const visible = computed(() => filterEntries(props.request, query.value));
const selectable = computed(() => visible.value.filter((entry) => !entry.separator));

// The entries that start checked, once they are known (they may come from a promise).
watch(
  () => props.request.entries,
  (entries) => (checked.value = new Set(entries.filter((entry) => entry.picked))),
  { immediate: true },
);
watch(query, () => (active.value = 0));

onMounted(async () => {
  await nextTick();
  input.value?.focus();
});

function move(to: number) {
  const count = selectable.value.length;
  if (!count) return;
  active.value = (to + count) % count;
  nextTick(() =>
    list.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" }),
  );
}

function toggle(entry: PickEntry) {
  const next = new Set(checked.value);
  if (!next.delete(entry)) next.add(entry);
  checked.value = next;
}

/** Accepting: the checked ones, in list order, or the one under the cursor. */
function accept(entry?: PickEntry) {
  if (props.request.many) {
    props.request.answer(
      props.request.entries.filter((e) => checked.value.has(e)).map((e) => e.item),
    );
  } else if (entry) {
    props.request.answer([entry.item]);
  }
}

function onKeydown(event: KeyboardEvent) {
  const entry = selectable.value[active.value];
  if (event.key === "ArrowDown") move(active.value + 1);
  else if (event.key === "ArrowUp") move(active.value - 1);
  else if (event.key === "Home") move(0);
  else if (event.key === "End") move(selectable.value.length - 1);
  else if (event.key === "Enter") accept(entry);
  // Space only checks when the filter is empty: otherwise it is part of what is being typed.
  else if (event.key === " " && props.request.many && !query.value && entry) toggle(entry);
  else return;
  event.preventDefault();
}

function choose(entry: PickEntry, index: number) {
  active.value = index;
  if (props.request.many) toggle(entry);
  else accept(entry);
}
</script>

<template>
  <div class="prompt-pick">
    <input
      ref="input"
      v-model="query"
      class="prompt-field"
      :placeholder="request.placeHolder"
      :aria-label="request.placeHolder ?? request.title ?? 'Filtrar'"
      role="combobox"
      aria-expanded="true"
      aria-controls="prompt-list"
      spellcheck="false"
      autocomplete="off"
      @keydown="onKeydown"
    />
    <ul
      id="prompt-list"
      ref="list"
      class="prompt-list"
      role="listbox"
      :aria-multiselectable="request.many"
    >
      <template v-for="entry in visible" :key="entry.label + (entry.description ?? '')">
        <li v-if="entry.separator" class="prompt-separator" role="separator">{{ entry.label }}</li>
        <li
          v-else
          class="prompt-item"
          role="option"
          :aria-selected="entry === selectable[active]"
          :aria-checked="request.many ? checked.has(entry) : undefined"
          @mousemove="active = selectable.indexOf(entry)"
          @mousedown.prevent
          @click="choose(entry, selectable.indexOf(entry))"
        >
          <Icon
            v-if="request.many"
            :name="checked.has(entry) ? 'lucide:square-check' : 'lucide:square'"
            class="prompt-check"
          />
          <div class="min-w-0 flex-1">
            <div class="prompt-label">
              <span class="truncate">
                <template v-for="(piece, i) in highlight(entry.label, query)" :key="i">
                  <mark v-if="piece.match" class="prompt-match">{{ piece.text }}</mark>
                  <template v-else>{{ piece.text }}</template>
                </template>
              </span>
              <span v-if="entry.description" class="prompt-description">{{
                entry.description
              }}</span>
            </div>
            <div v-if="entry.detail" class="prompt-detail">{{ entry.detail }}</div>
          </div>
        </li>
      </template>
      <li v-if="request.loading" class="prompt-empty">
        <Icon name="lucide:loader-circle" class="animate-spin" /> Carregando…
      </li>
      <li v-else-if="!selectable.length" class="prompt-empty">Nenhum resultado.</li>
    </ul>
    <div v-if="request.many" class="prompt-footer">
      <span class="text-[var(--ide-fg-muted)]">{{ checked.size }} selecionado(s)</span>
      <button class="ext-btn ext-btn-primary" @mousedown.prevent @click="accept()">OK</button>
    </div>
  </div>
</template>
