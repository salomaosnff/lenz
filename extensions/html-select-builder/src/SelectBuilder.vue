<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { HtmlEditorApi } from "html-visual-editor/api";
import ItemsEditor, { type Row } from "./ItemsEditor.vue";
import {
  defaultOptions,
  group,
  option,
  parseLines,
  renderSelect,
  slug,
  toLines,
  withValues,
  type SelectOptions,
} from "./select";
import {
  addGroup,
  addOption,
  applyStyle,
  closestSelect,
  describeSelect,
  moveItem,
  readItems,
  removeItem,
  setAttr,
  setDisabled,
  setFlag,
  setLabel,
  setSelected,
  setValue,
} from "./selectDom";

const props = defineProps<{ api: HtmlEditorApi }>();
const session = computed(() => props.api.session.value);

const options = reactive<SelectOptions>(defaultOptions());
const look = reactive({ styled: true, fullWidth: false });
const tab = ref<"new" | "edit">("new");

// ---- The select in the page ------------------------------------------------------------------------

/** The select the selected element belongs to. Re-read after every edit. */
const select = computed(() => {
  const current = session.value;
  const el = current?.selected.value;
  if (!current || !el) return null;
  void current.version.value;
  return closestSelect(el);
});
// The select is the same element after an edit, so what depends on it would not be told that its
// content changed: these read the version too, which goes up after every edit.
const version = computed(() => session.value?.version.value ?? 0);
const info = computed(() => {
  void version.value;
  return select.value ? describeSelect(select.value) : null;
});
const domItems = computed(() => {
  void version.value;
  return select.value ? readItems(select.value) : [];
});

// Selecting a select in the page opens its tab, and leaving it goes back to the new one.
watch(select, (now, before) => {
  if (now && !before) tab.value = "edit";
  else if (!now && before) tab.value = "new";
});

// ---- New select -----------------------------------------------------------------------------------

const html = computed(() => renderSelect({ ...options, ...look }));
const preview = computed(
  () =>
    `<!doctype html><meta charset="utf-8"><body style="margin:12px;font:14px system-ui,sans-serif;color:#18181b;background:#fff">${html.value}`,
);

const newRows = computed<Row[]>(() =>
  options.items.map((item, i) => ({
    kind: item.kind,
    label: item.label,
    value: item.kind === "option" ? item.value : "",
    selected: item.kind === "option" && item.selected,
    disabled: item.disabled,
    canUp: i > 0,
    canDown: i < options.items.length - 1,
  })),
);

function updateNew(
  index: number,
  patch: Partial<Pick<Row, "label" | "value" | "selected" | "disabled">>,
) {
  const item = options.items[index];
  if (!item) return;
  Object.assign(item, patch);
  // One chosen option in a single choice: choosing one takes the mark off the others.
  if (patch.selected && !options.multiple) {
    options.items.forEach(
      (other, i) => i !== index && other.kind === "option" && (other.selected = false),
    );
  }
}
function addNew(after: number | null, kind: "option" | "group") {
  const next =
    kind === "group"
      ? group("Novo grupo")
      : option(`Opção ${options.items.filter((i) => i.kind === "option").length + 1}`);
  const at = kind === "group" || after === null ? options.items.length : after + 1;
  options.items.splice(at, 0, next);
}
const removeNew = (index: number) => void options.items.splice(index, 1);
function moveNew(index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= options.items.length) return;
  const [item] = options.items.splice(index, 1);
  options.items.splice(target, 0, item!);
}

/** The list as text, to be edited all at once. */
const lines = computed(() => toLines(options.items));
const readLines = (event: Event) => {
  options.items = parseLines((event.target as HTMLTextAreaElement).value);
};
const fillValues = () => void (options.items = withValues(options.items));

function insert() {
  session.value?.insert(html.value);
  // The new select is the selection now: its tab opens by itself.
}

// ---- The select in the page ----------------------------------------------------------------------

/** Runs a change of the selected select and records it, with a name for the history. */
function edit(label: string, change: (select: HTMLSelectElement) => unknown) {
  const target = select.value;
  if (!target) return;
  change(target);
  session.value?.commit(label);
}

function updateDom(
  index: number,
  patch: Partial<Pick<Row, "label" | "value" | "selected" | "disabled">>,
) {
  const item = domItems.value[index];
  if (!item) return;
  edit("Editar opção do select", (s) => {
    const el = item.el;
    if (patch.label !== undefined) setLabel(el, patch.label);
    if (patch.value !== undefined && el.tagName === "OPTION")
      setValue(el as HTMLOptionElement, patch.value);
    if (patch.selected !== undefined && el.tagName === "OPTION")
      setSelected(s, el as HTMLOptionElement, patch.selected);
    if (patch.disabled !== undefined) setDisabled(el, patch.disabled);
  });
}
function addDom(after: number | null, kind: "option" | "group") {
  edit(kind === "group" ? "Adicionar grupo" : "Adicionar opção", (s) => {
    if (kind === "group") addGroup(s);
    else addOption(s, after === null ? null : (domItems.value[after]?.el ?? null));
  });
}
const removeDom = (index: number) => {
  const item = domItems.value[index];
  if (item) edit("Remover opção", (s) => removeItem(s, item.el));
};
const moveDom = (index: number, direction: -1 | 1) => {
  const item = domItems.value[index];
  if (item) edit("Mover opção", () => moveItem(item.el, direction));
};
const fillValuesDom = () =>
  edit("Valores das opções", () => {
    for (const item of domItems.value) {
      if (item.kind === "option" && !item.value.trim())
        setValue(item.el as HTMLOptionElement, slug(item.label));
    }
  });

const attr = (name: "name" | "id" | "size", event: Event) =>
  edit("Editar select", (s) => setAttr(s, name, (event.target as HTMLInputElement).value));
const flag = (name: "multiple" | "required" | "disabled", event: Event) =>
  edit("Editar select", (s) => setFlag(s, name, (event.target as HTMLInputElement).checked));

/** A change of look, in either tab: the preview follows it, and the select in the page gets it. */
function changeLook(patch: Partial<typeof look>) {
  Object.assign(look, patch);
  if (tab.value === "edit") edit("Estilo do select", (s) => applyStyle(s, look));
}
const checked = (event: Event) => (event.target as HTMLInputElement).checked;
</script>

<template>
  <div class="hsb">
    <div class="hsb-tabs" role="tablist">
      <button
        role="tab"
        :aria-selected="tab === 'new'"
        :class="{ active: tab === 'new' }"
        @click="tab = 'new'"
      >
        <Icon name="lucide:square-chevron-down" class="size-3.5" /> Novo select
      </button>
      <button
        role="tab"
        :aria-selected="tab === 'edit'"
        :class="{ active: tab === 'edit' }"
        :disabled="!select"
        :title="select ? '' : 'Selecione um select na página'"
        @click="tab = 'edit'"
      >
        <Icon name="lucide:list-checks" class="size-3.5" />
        Select selecionado<template v-if="info"> ({{ info.options }})</template>
      </button>
    </div>

    <!-- ---- A new select ---- -->
    <template v-if="tab === 'new'">
      <section class="hsb-section">
        <h4>Campo</h4>
        <label class="hsb-field"
          >Rótulo <input v-model="options.label" placeholder="Texto acima do campo (opcional)"
        /></label>
        <label class="hsb-field"
          >Nome <input v-model="options.name" placeholder="name" spellcheck="false"
        /></label>
        <label class="hsb-field"
          >Id <input v-model="options.id" placeholder="Igual ao nome, se vazio" spellcheck="false"
        /></label>
        <label class="hsb-field">
          Texto inicial
          <input
            v-model="options.placeholder"
            :disabled="options.multiple"
            placeholder="Ex.: Selecione…"
          />
        </label>
        <label class="hsb-check"
          ><input v-model="options.multiple" type="checkbox" /> Permitir escolher várias
          opções</label
        >
        <label v-if="options.multiple" class="hsb-field">
          Linhas visíveis
          <input v-model.number="options.size" type="number" min="0" max="20" class="hsb-small" />
        </label>
        <label class="hsb-check"
          ><input v-model="options.required" type="checkbox" /> Obrigatório</label
        >
        <label class="hsb-check"
          ><input v-model="options.disabled" type="checkbox" /> Desativado</label
        >
      </section>

      <section class="hsb-section">
        <h4>Opções</h4>
        <ItemsEditor
          :rows="newRows"
          @update="updateNew"
          @add="addNew"
          @remove="removeNew"
          @move="moveNew"
        />
        <div class="hsb-tools">
          <button type="button" @click="fillValues">Gerar os valores a partir dos rótulos</button>
        </div>
        <details class="hsb-text">
          <summary>Editar como texto</summary>
          <p class="hsb-hint">
            Uma opção por linha: <code>Rótulo | valor</code>. <code>*</code> no começo marca como
            padrão, <code>!</code> desativa, e <code>## Nome</code> começa um grupo.
          </p>
          <textarea rows="7" :value="lines" spellcheck="false" @change="readLines" />
        </details>
      </section>
    </template>

    <!-- ---- The select in the page ---- -->
    <template v-else-if="select && info">
      <section class="hsb-section">
        <h4>Campo</h4>
        <label class="hsb-field"
          >Nome <input :value="info.name" spellcheck="false" @change="attr('name', $event)"
        /></label>
        <label class="hsb-field"
          >Id <input :value="info.id" spellcheck="false" @change="attr('id', $event)"
        /></label>
        <label class="hsb-check"
          ><input type="checkbox" :checked="info.multiple" @change="flag('multiple', $event)" />
          Permitir escolher várias opções</label
        >
        <label v-if="info.multiple" class="hsb-field">
          Linhas visíveis
          <input
            type="number"
            min="0"
            max="20"
            class="hsb-small"
            :value="info.size"
            @change="attr('size', $event)"
          />
        </label>
        <label class="hsb-check"
          ><input type="checkbox" :checked="info.required" @change="flag('required', $event)" />
          Obrigatório</label
        >
        <label class="hsb-check"
          ><input type="checkbox" :checked="info.disabled" @change="flag('disabled', $event)" />
          Desativado</label
        >
      </section>

      <section class="hsb-section">
        <h4>Opções</h4>
        <ItemsEditor
          :rows="domItems"
          @update="updateDom"
          @add="addDom"
          @remove="removeDom"
          @move="moveDom"
        />
        <div class="hsb-tools">
          <button type="button" @click="fillValuesDom">
            Gerar os valores a partir dos rótulos
          </button>
        </div>
      </section>
    </template>

    <!-- ---- The look: the same in both ---- -->
    <section class="hsb-section">
      <h4>Estilo</h4>
      <label class="hsb-check">
        <input
          type="checkbox"
          :checked="look.styled"
          @change="changeLook({ styled: checked($event) })"
        />
        Aparência básica (borda e cantos arredondados)
      </label>
      <label class="hsb-check">
        <input
          type="checkbox"
          :checked="look.fullWidth"
          @change="changeLook({ fullWidth: checked($event) })"
        />
        Largura total
      </label>
    </section>

    <section v-if="tab === 'new'" class="hsb-section hsb-grow">
      <h4>Prévia</h4>
      <iframe class="hsb-preview" sandbox="" :srcdoc="preview" title="Prévia do select" />
    </section>

    <!-- Always in view, whatever the size of the window: it is what the whole tab is for. -->
    <div v-if="tab === 'new'" class="hsb-footer">
      <button class="hsb-primary" @click="insert">
        <Icon name="lucide:square-chevron-down" class="size-4" /> Inserir na página
      </button>
    </div>
  </div>
</template>
