<script setup lang="ts">
import { computed, ref } from "vue";
import type { HtmlEditorApi } from "html-visual-editor/api";
import { readInline, writeInline } from "./inline";
import { openWidget } from "./widgets";
import { mdnUrl } from "./docs";
import { optionLabel } from "./labels";
import type { StyleField, StyleGroup } from "./model";

const props = defineProps<{ group: StyleGroup; api: HtmlEditorApi }>();

const value = (e: Event) => (e.target as HTMLInputElement).value;
const session = computed(() => props.api.session.value);

/** Shorthands the user opened or closed; the rest follow `hasValue` below. */
const expanded = ref<Record<string, boolean>>({});

interface Row {
  field: StyleField & { value: string; placeholder: string };
  child: boolean;
  /** Shorthand with longhands: whether they are shown. */
  open?: boolean;
}

/** Rows to show: each field, followed by its longhands while the shorthand is expanded. */
const rows = computed<Row[]>(() => {
  const current = session.value;
  const el = current?.selected.value;
  if (!current || !el) return [];
  void current.version.value; // the DOM is not reactive: re-read after each edit
  const computedStyle = el.ownerDocument.defaultView!.getComputedStyle(el);
  const read = (field: StyleField) => ({
    ...field,
    value: readInline(el, field.prop),
    placeholder: computedStyle.getPropertyValue(field.prop),
  });
  return props.group.fields.flatMap((field): Row[] => {
    const own = read(field);
    if (!field.children) return [{ field: own, child: false }];
    const children = field.children.map(read);
    // Longhands that were set on their own would be hidden by a collapsed row: open it.
    const open = expanded.value[field.prop] ?? children.some((c) => c.value);
    return [
      { field: own, child: false, open },
      ...(open ? children.map((c): Row => ({ field: c, child: true })) : []),
    ];
  });
});

/**
 * What the user is typing, by property. Half-typed values (`10p`, `1`) are not valid CSS, so
 * the element keeps its old value; without a draft the field would be reset on every key.
 */
const drafts = ref<Record<string, string>>({});
const shown = (row: Row) => drafts.value[row.field.prop] ?? row.field.value;
const isInvalid = (row: Row) => {
  const draft = drafts.value[row.field.prop];
  return !!draft && !CSS.supports(row.field.prop, draft);
};
function type(row: Row, event: Event) {
  const text = value(event);
  drafts.value[row.field.prop] = text;
  setStyle(row.field.prop, text);
}
/** Back to what the element really has, e.g. after leaving a value that was never valid. */
const settle = (row: Row) => delete drafts.value[row.field.prop];

const toggle = (row: Row) => (expanded.value[row.field.prop] = !row.open);
const setStyle = (prop: string, next: string) => writeInline(session.value, prop, next);
/** Shadows and gradients: the text field stays, and a gear opens the advanced editor. */
const isWidget = (row: Row) => row.field.type === "shadow" || row.field.type === "gradient";
</script>

<template>
  <div class="hse-group">
    <div
      v-for="row in rows"
      :key="row.field.prop"
      class="hse-field"
      :class="{ child: row.child }"
      :title="row.field.prop"
    >
      <span
        class="hse-label"
        :class="{ expandable: row.open !== undefined }"
        @click="row.open !== undefined && toggle(row)"
      >
        <button
          v-if="row.open !== undefined"
          class="hse-toggle"
          :class="{ open: row.open }"
          :title="row.open ? 'Recolher' : 'Expandir'"
          :aria-expanded="row.open"
          :aria-label="`${row.open ? 'Recolher' : 'Expandir'} ${row.field.label}`"
        >
          <Icon name="lucide:chevron-right" class="size-3" />
        </button>
        <span class="hse-label-text">{{ row.field.label }}</span>
        <a
          class="hse-help"
          :href="mdnUrl(row.field.prop)"
          target="_blank"
          rel="noopener noreferrer"
          :title="`Documentação do MDN: ${row.field.prop}`"
          :aria-label="`Documentação do MDN de ${row.field.prop}`"
          @click.stop
        >
          <Icon name="lucide:circle-help" class="size-3.5" />
        </a>
      </span>
      <component
        :is="api.ColorInput"
        v-if="row.field.type === 'color'"
        :model-value="row.field.value"
        :placeholder="row.field.placeholder"
        :variables="session?.cssVariables.value"
        :resolver="session?.colorResolver.value"
        @update:model-value="setStyle(row.field.prop, $event)"
      />
      <div v-else-if="isWidget(row)" class="hse-widget-row">
        <input
          :value="shown(row)"
          :class="{ invalid: isInvalid(row) }"
          :placeholder="row.field.placeholder"
          :aria-label="row.field.label"
          spellcheck="false"
          @input="type(row, $event)"
          @blur="settle(row)"
        />
        <button
          class="hse-icon-button"
          :title="`Editor avançado: ${row.field.label}`"
          :aria-label="`Abrir o editor avançado de ${row.field.label}`"
          @click="openWidget(row.field.prop, row.field.label)"
        >
          <Icon name="lucide:settings" class="size-3.5" />
        </button>
      </div>
      <select
        v-else-if="row.field.options"
        :value="row.field.value"
        :aria-label="row.field.label"
        @change="setStyle(row.field.prop, value($event))"
      >
        <option v-for="option in row.field.options" :key="option" :value="option">
          {{ optionLabel(row.field.prop, option) }}
        </option>
      </select>
      <template v-else>
        <input
          :value="shown(row)"
          :class="{ invalid: isInvalid(row) }"
          :placeholder="row.field.placeholder"
          :aria-label="row.field.label"
          :list="row.field.suggestions ? `hse-list-${row.field.prop}` : undefined"
          @input="type(row, $event)"
          @blur="settle(row)"
        />
        <datalist v-if="row.field.suggestions" :id="`hse-list-${row.field.prop}`">
          <option v-for="s in row.field.suggestions" :key="s" :value="s" />
        </datalist>
      </template>
    </div>
  </div>
</template>
