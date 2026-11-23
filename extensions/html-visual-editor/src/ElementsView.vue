<script setup lang="ts">
import { computed, ref } from "vue";
import { useElementStore } from "./elementStore";
import { ELEMENT_DRAG_TYPE } from "./api";
import { iconForTag } from "./elementIcons";
import { compareUse, loadUse, saveUse } from "./popularity";
import { session } from "./session";
import { snippetFor } from "./snippets";

const store = useElementStore();

/** Lowercase, without accents: `Ação` matches `acao`. */
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

interface Entry {
  tag: string;
  label: string;
  description: string;
  obsolete: boolean;
  icon: string;
  html: string;
  insertable: boolean;
  reason?: string;
  /** What the search looks at. */
  haystack: string;
}

const baseEntries: Entry[] = store.tags
  .map((tag) => {
    const element = store.getElement(tag)!;
    const snippet = snippetFor(tag, element.void);
    return {
      tag,
      label: element.label,
      description: element.description,
      obsolete: element.status === "obsolete",
      icon: iconForTag(tag),
      ...snippet,
      haystack: fold(`${element.label} ${tag} ${element.description}`),
    };
  })
  // The ones the common order does not mention follow it alphabetically (the sort is stable).
  .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

/** What the user inserted before, so their own favorites rise to the top. */
const counts = ref(loadUse());
const entries = computed(() => {
  const compare = compareUse(counts.value);
  return [...baseEntries].sort((a, b) => compare(a.tag, b.tag));
});

const query = ref("");
const matching = computed(() => {
  const terms = fold(query.value).split(/\s+/).filter(Boolean);
  return entries.value.filter((entry) => terms.every((term) => entry.haystack.includes(term)));
});
/**
 * The list is in groups: the elements to use first, then the obsolete ones, then the ones that
 * cannot be inserted in a page (shown for completeness, each saying why).
 */
const groups = computed(() => [
  { id: "current", title: "", entries: matching.value.filter((e) => e.insertable && !e.obsolete) },
  {
    id: "obsolete",
    title: "Obsoletos",
    entries: matching.value.filter((e) => e.insertable && e.obsolete),
  },
  {
    id: "unavailable",
    title: "Não inserem na página",
    entries: matching.value.filter((e) => !e.insertable),
  },
]);

const canInsert = (entry: Entry) => entry.insertable && !!session.value;

/** Inserts where the editor is now: after the selected element, or inside it if it is a container. */
function insert(entry: Entry) {
  if (!canInsert(entry)) return;
  session.value?.insert(entry.html);
  countUse(entry);
}

/** Dragging carries the HTML; the canvas inserts it where it is dropped. */
function startDrag(event: DragEvent, entry: Entry) {
  if (!canInsert(entry) || !event.dataTransfer) return event.preventDefault();
  event.dataTransfer.setData(ELEMENT_DRAG_TYPE, entry.html);
  event.dataTransfer.effectAllowed = "copy";
}

/** The drop is the insertion: counts as a use, like the click does. */
function countUse(entry: Entry) {
  counts.value = { ...counts.value, [entry.tag]: (counts.value[entry.tag] ?? 0) + 1 };
  saveUse(counts.value);
}

const titleOf = (entry: Entry) =>
  entry.reason ?? (session.value ? `Inserir <${entry.tag}>` : "Abra um arquivo HTML para inserir");
</script>

<template>
  <div class="hve-elements">
    <div class="hve-el-bar">
      <input
        v-model="query"
        class="hve-el-search"
        type="search"
        placeholder="Buscar elemento"
        aria-label="Buscar elemento"
        spellcheck="false"
      />
    </div>

    <template v-for="group in groups" :key="group.id">
      <component
        :is="group.title ? 'details' : 'div'"
        v-if="group.entries.length"
        :class="{ 'hve-el-group': group.title }"
        :open="group.title ? !!query.trim() : undefined"
      >
        <summary v-if="group.title">{{ group.title }} ({{ group.entries.length }})</summary>
        <ul class="hve-el-list">
          <li v-for="entry in group.entries" :key="entry.tag">
            <button
              type="button"
              class="hve-el"
              :disabled="!canInsert(entry)"
              :title="titleOf(entry)"
              :draggable="canInsert(entry)"
              @dragstart="startDrag($event, entry)"
              @dragend="$event.dataTransfer?.dropEffect === 'copy' && countUse(entry)"
              @click="insert(entry)"
            >
              <Icon :name="entry.icon" class="hve-el-icon" />
              <span class="hve-el-body">
                <span class="hve-el-head">
                  <span class="hve-el-label">{{ entry.label }}</span>
                  <code class="hve-el-tag">&lt;{{ entry.tag }}&gt;</code>
                </span>
                <span class="hve-el-description">{{ entry.reason ?? entry.description }}</span>
              </span>
            </button>
          </li>
        </ul>
      </component>
    </template>

    <p v-if="!matching.length" class="hve-el-empty">Nenhum elemento encontrado.</p>
  </div>
</template>
