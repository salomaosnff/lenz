<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import type { HtmlEditorApi } from "html-visual-editor/api";
import { LIMITS, createLibrary, renderSvg, safeColor, searchNames, type Library } from "./icons";

const props = defineProps<{ api: HtmlEditorApi }>();
const session = computed(() => props.api.session.value);

// ---- The icons -----------------------------------------------------------------------------------
// The set is big (hundreds of KB), so it is only loaded when this window first opens.
const library = ref<Library>();
const failed = ref(false);
onMounted(async () => {
  try {
    const { default: set } = await import("@iconify-json/lucide/icons.json");
    library.value = createLibrary(set);
  } catch (error) {
    console.error("[lenz] the icons could not be loaded", error);
    failed.value = true;
  }
});

const query = ref("");
const matches = computed(() =>
  library.value ? searchNames(library.value.names, query.value) : [],
);
/** The grid shows a page at a time, so the window stays light. */
const PAGE = 96;
const shown = ref(PAGE);
watch(query, () => (shown.value = PAGE));
const visible = computed(() => matches.value.slice(0, shown.value));

// ---- How the icon will be ------------------------------------------------------------------------
const options = reactive({
  size: 24,
  strokeWidth: 2,
  color: "#e63946",
  ownColor: false,
  label: "",
});
const svgOptions = computed(() => ({
  size: options.size,
  strokeWidth: options.strokeWidth,
  color: options.ownColor ? safeColor(options.color) : undefined,
  label: options.label,
}));

const selected = ref<string>();
const icon = computed(() => (selected.value ? library.value?.get(selected.value) : undefined));
const svg = computed(() => (icon.value ? renderSvg(icon.value, svgOptions.value) : ""));
/** The grid shows every icon the same way, whatever the options. */
const thumb = (name: string) => {
  const found = library.value?.get(name);
  return found ? renderSvg(found, { size: 24, strokeWidth: 2 }) : "";
};

// ---- Recent ---------------------------------------------------------------------------------------
const RECENT_KEY = "lenz.html-icon-library.recent";
const recent = ref<string[]>([]);
try {
  const stored = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  if (Array.isArray(stored))
    recent.value = stored.filter((n): n is string => typeof n === "string").slice(0, 12);
} catch {
  // blocked storage: the list just starts empty
}
function remember(name: string) {
  recent.value = [name, ...recent.value.filter((n) => n !== name)].slice(0, 12);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.value));
  } catch {
    // full or blocked storage: nothing to do
  }
}
const recentIcons = computed(() => recent.value.filter((n) => library.value?.get(n)));

// ---- What it does -----------------------------------------------------------------------------------
const message = ref("");
let timer: ReturnType<typeof setTimeout> | undefined;
function say(text: string) {
  message.value = text;
  clearTimeout(timer);
  timer = setTimeout(() => (message.value = ""), 2500);
}

function insert(name = selected.value) {
  const found = name ? library.value?.get(name) : undefined;
  if (!found || !name) return;
  selected.value = name;
  if (!session.value) return say("Abra uma página no editor visual para inserir.");
  session.value.insert(renderSvg(found, svgOptions.value));
  remember(name);
  say(`Ícone "${name}" inserido.`);
}

async function copy() {
  if (!svg.value) return;
  try {
    await navigator.clipboard.writeText(svg.value);
    say("SVG copiado.");
  } catch {
    say("Não foi possível copiar.");
  }
}

const canInsert = computed(() => !!icon.value && !!session.value);
</script>

<template>
  <div class="hil">
    <input
      v-model="query"
      class="hil-search"
      type="search"
      placeholder="Buscar ícone (ex.: seta, home, user, heart...)"
      spellcheck="false"
      autocomplete="off"
      aria-label="Buscar ícone"
    />

    <p v-if="failed" class="hil-note bad">Não foi possível carregar os ícones.</p>
    <p v-else-if="!library" class="hil-note">Carregando os ícones...</p>

    <template v-else>
      <section v-if="!query && recentIcons.length" class="hil-recent">
        <h4>Recentes</h4>
        <div class="hil-row">
          <button
            v-for="name in recentIcons"
            :key="name"
            type="button"
            class="hil-icon"
            :class="{ active: name === selected }"
            :title="name"
            :aria-label="name"
            @click="selected = name"
            @dblclick="insert(name)"
            v-html="thumb(name)"
          />
        </div>
      </section>

      <section class="hil-grid-wrap">
        <h4>
          {{ query ? "Resultados" : "Todos os ícones" }}
          <span class="hil-count">{{ matches.length }}</span>
        </h4>
        <div v-if="matches.length" class="hil-grid" role="listbox" aria-label="Ícones">
          <button
            v-for="name in visible"
            :key="name"
            type="button"
            role="option"
            class="hil-icon"
            :class="{ active: name === selected }"
            :aria-selected="name === selected"
            :title="name"
            :aria-label="name"
            @click="selected = name"
            @dblclick="insert(name)"
            v-html="thumb(name)"
          />
        </div>
        <p v-else class="hil-note">Nenhum ícone para "{{ query }}".</p>
        <button v-if="matches.length > shown" type="button" class="hil-more" @click="shown += PAGE">
          Mostrar mais ({{ matches.length - shown }})
        </button>
      </section>
    </template>

    <section class="hil-panel">
      <div class="hil-preview" :class="{ empty: !icon }">
        <span v-if="icon" class="hil-big" v-html="svg" />
        <span v-else>Selecione um ícone</span>
      </div>
      <div class="hil-fields">
        <p class="hil-name">{{ selected ?? "—" }}</p>
        <label>
          Tamanho (px)
          <input
            v-model.number="options.size"
            type="number"
            :min="LIMITS.minSize"
            :max="LIMITS.maxSize"
            step="2"
          />
        </label>
        <label>
          Espessura do traço: {{ options.strokeWidth }}
          <input
            v-model.number="options.strokeWidth"
            type="range"
            :min="LIMITS.minStroke"
            :max="LIMITS.maxStroke"
            step="0.25"
          />
        </label>
        <div class="hil-color">
          <label class="hil-check">
            <input v-model="options.ownColor" type="checkbox" />
            Cor própria
          </label>
          <input
            v-model="options.color"
            type="color"
            :disabled="!options.ownColor"
            aria-label="Cor do ícone"
          />
          <span class="hil-hint">{{
            options.ownColor ? options.color : "herda a cor do texto"
          }}</span>
        </div>
        <label>
          Descrição para leitores de tela (opcional)
          <input
            v-model="options.label"
            type="text"
            placeholder="Sem descrição, o ícone é decorativo"
          />
        </label>
      </div>
    </section>

    <footer class="hil-footer">
      <span class="hil-message" aria-live="polite">{{ message }}</span>
      <button type="button" :disabled="!icon" @click="copy">Copiar SVG</button>
      <button type="button" class="primary" :disabled="!canInsert" @click="insert()">
        Inserir na página
      </button>
    </footer>
  </div>
</template>
