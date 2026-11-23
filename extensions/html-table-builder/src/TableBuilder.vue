<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { HtmlEditorApi } from "html-visual-editor/api";
import {
  applyStyle,
  closestTable,
  describeTable,
  insertColumn,
  insertRow,
  positionOf,
  removeColumn,
  removeRow,
  setCaption,
  setFooterRow,
  setHeaderColumn,
  setHeaderRow,
} from "./tableDom";
import {
  LIMITS,
  defaultOptions,
  normalize,
  renderTable,
  type Borders,
  type TableOptions,
} from "./table";

const props = defineProps<{ api: HtmlEditorApi }>();
const session = computed(() => props.api.session.value);

// ---- What the window is working on ------------------------------------------------------------

/** The new table being set up. */
const options = reactive<TableOptions>(defaultOptions());
/** The look, shared by a new table and by the table being edited. */
const look = reactive({
  borders: "grid" as Borders,
  striped: false,
  compact: false,
  fullWidth: true,
});
/** Whether the changes of kind (header, footer...) give the cells the builder's look. */
const keepLook = ref(true);

const tab = ref<"new" | "edit">("new");

/** The table the selected element is in, and what it is like now. Re-read after every edit. */
const table = computed(() => {
  const current = session.value;
  const el = current?.selected.value;
  if (!current || !el) return null;
  void current.version.value;
  return closestTable(el);
});
// The table is the same element after an edit, so `info` would not be told that its content changed
// (the size on the tab, the header and footer boxes): it reads the version too.
const info = computed(() => {
  void session.value?.version.value;
  return table.value ? describeTable(table.value) : null;
});
const position = computed(() => {
  const current = session.value;
  const el = current?.selected.value;
  void current?.version.value;
  return table.value && el ? positionOf(table.value, el) : null;
});

// Selecting a table in the page opens its tab, and leaving it goes back to the new one.
watch(table, (now, before) => {
  if (now && !before) tab.value = "edit";
  else if (!now && before) tab.value = "new";
});

const styleOptions = (): TableOptions => ({ ...options, ...look });
const styleFor = () => (keepLook.value ? styleOptions() : null);

// ---- New table ------------------------------------------------------------------------------------

const html = computed(() => renderTable(styleOptions()));
const preview = computed(
  () =>
    `<!doctype html><meta charset="utf-8"><body style="margin:12px;font:14px system-ui,sans-serif;color:#18181b;background:#fff">${html.value}`,
);

const hover = ref<{ rows: number; columns: number } | null>(null);
const GRID = { rows: 8, columns: 10 };
const lit = computed(() => hover.value ?? { rows: options.rows, columns: options.columns });

function setSize(rows: number, columns: number) {
  options.rows = rows;
  options.columns = columns;
}
/** A number box: kept inside the limits as it is typed. */
function setNumber(key: "rows" | "columns", event: Event) {
  const value = (event.target as HTMLInputElement).valueAsNumber;
  if (Number.isFinite(value)) options[key] = normalize({ ...options, [key]: value })[key];
}

function insert() {
  session.value?.insert(html.value);
  // The new table is the selection now: its tab opens by itself.
}

// ---- The table in the page ----------------------------------------------------------------------

/** Runs a change of the selected table and records it, with a name for the history. */
function edit(label: string, change: (table: HTMLTableElement) => unknown) {
  const target = table.value;
  if (!target) return;
  change(target);
  session.value?.commit(label);
}

const rowAt = () => position.value?.row ?? (info.value ? info.value.rows - 1 : 0);
const columnAt = () => position.value?.column ?? (info.value ? info.value.columns - 1 : 0);

const addRow = (where: "above" | "below") =>
  edit("Adicionar linha", (t) => insertRow(t, rowAt(), where));
const addColumn = (where: "left" | "right") =>
  edit("Adicionar coluna", (t) => insertColumn(t, columnAt(), where));
/**
 * Removing a row or column takes away the cell that is selected, and with it the table the window
 * works on: the selection moves to the cell that took its place.
 */
function dropRow() {
  const at = position.value;
  if (!at) return;
  edit("Remover linha", (t) => {
    if (!removeRow(t, at.row)) return;
    const row = t.rows[Math.min(at.row, t.rows.length - 1)];
    const cell = row?.cells[Math.min(at.column, row.cells.length - 1)];
    if (cell) session.value?.select(cell);
  });
}
function dropColumn() {
  const at = position.value;
  if (!at) return;
  edit("Remover coluna", (t) => {
    if (!removeColumn(t, at.column)) return;
    const row = t.rows[Math.min(at.row, t.rows.length - 1)];
    const cell = row?.cells[Math.min(at.column, row.cells.length - 1)];
    if (cell) session.value?.select(cell);
  });
}

const canAddAbove = computed(
  () => !(position.value && info.value?.headerRow && position.value.row === 0),
);
const canDropRow = computed(() => !!position.value && (info.value?.rows ?? 0) > 1);
const canDropColumn = computed(() => !!position.value && (info.value?.columns ?? 0) > 1);

const toggle = (key: "header" | "footer" | "headerColumn", event: Event) => {
  const on = (event.target as HTMLInputElement).checked;
  if (key === "header") edit("Cabeçalho da tabela", (t) => setHeaderRow(t, on, styleFor()));
  else if (key === "footer") edit("Rodapé da tabela", (t) => setFooterRow(t, on, styleFor()));
  else edit("Coluna de títulos", (t) => setHeaderColumn(t, on, styleFor()));
};
const caption = (event: Event) =>
  edit("Legenda da tabela", (t) =>
    setCaption(t, (event.target as HTMLInputElement).value, styleFor()),
  );

/** A change of look, in either tab: the new table's preview follows it, and the table in the page gets it. */
function changeLook(patch: Partial<typeof look>) {
  Object.assign(look, patch);
  if (tab.value === "edit") edit("Estilo da tabela", (t) => applyStyle(t, styleOptions()));
}

const borderChoices: { id: Borders; label: string }[] = [
  { id: "grid", label: "Todas (grid)" },
  { id: "rows", label: "Só entre linhas (rows)" },
  { id: "none", label: "Nenhuma (none)" },
];
</script>

<template>
  <div class="htb">
    <div class="htb-tabs" role="tablist">
      <button
        role="tab"
        :aria-selected="tab === 'new'"
        :class="{ active: tab === 'new' }"
        @click="tab = 'new'"
      >
        <Icon name="lucide:table-2" class="size-3.5" /> Nova tabela
      </button>
      <button
        role="tab"
        :aria-selected="tab === 'edit'"
        :class="{ active: tab === 'edit' }"
        :disabled="!table"
        :title="table ? '' : 'Selecione uma tabela na página'"
        @click="tab = 'edit'"
      >
        <Icon name="lucide:table-properties" class="size-3.5" />
        Tabela selecionada<template v-if="info"> ({{ info.rows }}×{{ info.columns }})</template>
      </button>
    </div>

    <!-- ---- A new table ---- -->
    <template v-if="tab === 'new'">
      <section class="htb-section">
        <h4>Tamanho</h4>
        <div class="htb-size">
          <div
            class="htb-grid"
            role="group"
            aria-label="Escolher o tamanho"
            @mouseleave="hover = null"
          >
            <template v-for="r in GRID.rows" :key="r">
              <button
                v-for="c in GRID.columns"
                :key="c"
                class="htb-cell"
                :class="{ on: r <= lit.rows && c <= lit.columns }"
                :aria-label="`${r} linhas por ${c} colunas`"
                @mouseenter="hover = { rows: r, columns: c }"
                @focus="hover = { rows: r, columns: c }"
                @click="setSize(r, c)"
              />
            </template>
          </div>
          <div class="htb-numbers">
            <label
              >Linhas
              <input
                type="number"
                :min="LIMITS.rows.min"
                :max="LIMITS.rows.max"
                :value="options.rows"
                @input="setNumber('rows', $event)"
              />
            </label>
            <label
              >Colunas
              <input
                type="number"
                :min="LIMITS.columns.min"
                :max="LIMITS.columns.max"
                :value="options.columns"
                @input="setNumber('columns', $event)"
              />
            </label>
            <span class="htb-size-label">{{ lit.rows }} × {{ lit.columns }}</span>
          </div>
        </div>
      </section>

      <section class="htb-section">
        <h4>Estrutura</h4>
        <label class="htb-check"
          ><input v-model="options.headerRow" type="checkbox" /> Linha de cabeçalho</label
        >
        <label class="htb-check"
          ><input v-model="options.headerColumn" type="checkbox" /> Coluna de títulos</label
        >
        <label class="htb-check"
          ><input v-model="options.footerRow" type="checkbox" :disabled="options.rows < 2" /> Linha
          de rodapé</label
        >
        <label class="htb-field"
          >Legenda
          <input v-model="options.caption" placeholder="Opcional" />
        </label>
      </section>
    </template>

    <!-- ---- The table in the page ---- -->
    <template v-else-if="table && info">
      <section class="htb-section">
        <h4>
          {{
            position
              ? `Célula da linha ${position.row + 1}, coluna ${position.column + 1}`
              : "A tabela inteira"
          }}
        </h4>
        <p v-if="info.hasSpans" class="htb-warn">
          Esta tabela tem células mescladas (colspan ou rowspan). Adicionar e remover linhas e
          colunas pode desalinhar a tabela.
        </p>
        <div class="htb-actions">
          <span>Linhas</span>
          <button :disabled="!canAddAbove" @click="addRow('above')">
            <Icon name="lucide:between-horizontal-start" class="size-3.5" /> Acima
          </button>
          <button @click="addRow('below')">
            <Icon name="lucide:between-horizontal-end" class="size-3.5" /> Abaixo
          </button>
          <button class="danger" :disabled="!canDropRow" @click="dropRow">
            <Icon name="lucide:trash-2" class="size-3.5" /> Remover
          </button>
        </div>
        <div class="htb-actions">
          <span>Colunas</span>
          <button @click="addColumn('left')">
            <Icon name="lucide:between-vertical-start" class="size-3.5" /> À esquerda
          </button>
          <button @click="addColumn('right')">
            <Icon name="lucide:between-vertical-end" class="size-3.5" /> À direita
          </button>
          <button class="danger" :disabled="!canDropColumn" @click="dropColumn">
            <Icon name="lucide:trash-2" class="size-3.5" /> Remover
          </button>
        </div>
        <p v-if="!position" class="htb-hint">
          Clique numa célula da página para escolher a linha e a coluna.
        </p>
      </section>

      <section class="htb-section">
        <h4>Estrutura</h4>
        <label class="htb-check"
          ><input type="checkbox" :checked="info.headerRow" @change="toggle('header', $event)" />
          Linha de cabeçalho</label
        >
        <label class="htb-check"
          ><input
            type="checkbox"
            :checked="info.headerColumn"
            @change="toggle('headerColumn', $event)"
          />
          Coluna de títulos</label
        >
        <label class="htb-check"
          ><input
            type="checkbox"
            :checked="info.footerRow"
            :disabled="info.rows < 2"
            @change="toggle('footer', $event)"
          />
          Linha de rodapé</label
        >
        <label class="htb-field"
          >Legenda
          <input :value="info.caption" placeholder="Sem legenda" @change="caption" />
        </label>
      </section>
    </template>

    <!-- ---- The look: the same in both ---- -->
    <section class="htb-section">
      <h4>Estilo</h4>
      <label class="htb-field"
        >Bordas
        <select
          :value="look.borders"
          @change="changeLook({ borders: ($event.target as HTMLSelectElement).value as Borders })"
        >
          <option v-for="b in borderChoices" :key="b.id" :value="b.id">{{ b.label }}</option>
        </select>
      </label>
      <label class="htb-check"
        ><input
          type="checkbox"
          :checked="look.striped"
          @change="changeLook({ striped: ($event.target as HTMLInputElement).checked })"
        />
        Linhas alternadas</label
      >
      <label class="htb-check"
        ><input
          type="checkbox"
          :checked="look.compact"
          @change="changeLook({ compact: ($event.target as HTMLInputElement).checked })"
        />
        Células compactas</label
      >
      <label class="htb-check"
        ><input
          type="checkbox"
          :checked="look.fullWidth"
          @change="changeLook({ fullWidth: ($event.target as HTMLInputElement).checked })"
        />
        Largura total</label
      >
      <label v-if="tab === 'edit'" class="htb-check">
        <input v-model="keepLook" type="checkbox" /> Dar este estilo às células que mudam de tipo
      </label>
    </section>

    <section v-if="tab === 'new'" class="htb-section htb-grow">
      <h4>Prévia</h4>
      <iframe class="htb-preview" sandbox="" :srcdoc="preview" title="Prévia da tabela" />
    </section>

    <!-- Always in view, whatever the size of the window: it is what the whole tab is for. -->
    <div v-if="tab === 'new'" class="htb-footer">
      <button class="htb-primary" @click="insert">
        <Icon name="lucide:table" class="size-4" /> Inserir na página
      </button>
    </div>
  </div>
</template>
