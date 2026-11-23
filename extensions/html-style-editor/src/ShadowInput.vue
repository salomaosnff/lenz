<script setup lang="ts">
import { computed, ref } from "vue";
import type { HtmlEditorApi } from "html-visual-editor/api";
import CssBlock from "./CssBlock.vue";
import { canonicalCss } from "./inline";
import {
  defaultShadow,
  formatShadows,
  matchPreset,
  parseShadows,
  presets,
  summarize,
  type Shadow,
  type ShadowKind,
} from "./shadow";

const props = defineProps<{
  prop: string;
  /** The inline value of the property. */
  modelValue: string;
  api: HtmlEditorApi;
}>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const kind = computed<ShadowKind>(() => (props.prop === "text-shadow" ? "text" : "box"));
const session = computed(() => props.api.session.value);

/** `null` when the value uses something the widget cannot edit; only the raw text is offered. */
const layers = computed(() => parseShadows(props.modelValue, kind.value));

const openLayer = ref(0);

function write(next: Shadow[]) {
  emit("update:modelValue", formatShadows(next, kind.value));
}
const edit = (index: number, patch: Partial<Shadow>) =>
  write((layers.value ?? []).map((layer, i) => (i === index ? { ...layer, ...patch } : layer)));

function add() {
  const current = layers.value ?? [];
  write([...current, defaultShadow(kind.value)]);
  openLayer.value = current.length;
}
function remove(index: number) {
  write((layers.value ?? []).filter((_, i) => i !== index));
  openLayer.value = Math.max(0, Math.min(openLayer.value, (layers.value?.length ?? 1) - 2));
}
function duplicate(index: number) {
  const list = [...(layers.value ?? [])];
  list.splice(index + 1, 0, { ...list[index]! });
  write(list);
  openLayer.value = index + 1;
}
function move(index: number, direction: -1 | 1) {
  const list = [...(layers.value ?? [])];
  const target = index + direction;
  if (target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target]!, list[index]!];
  write(list);
  openLayer.value = target;
}

function number(index: number, key: "x" | "y" | "blur" | "spread", event: Event) {
  const value = (event.target as HTMLInputElement).valueAsNumber;
  if (!Number.isFinite(value)) return;
  edit(index, { [key]: key === "blur" ? Math.max(0, value) : value });
}

/** The select keeps showing the preset while the value still is that preset. */
const matchedPreset = computed(() =>
  matchPreset(props.modelValue, kind.value, (value) => canonicalCss(props.prop, value)),
);

function applyPreset(event: Event) {
  const preset = presets[kind.value].find(
    (p) => p.label === (event.target as HTMLSelectElement).value,
  );
  if (!preset) return;
  emit("update:modelValue", preset.value);
  openLayer.value = -1; // the layers come in closed; open one to edit it
}

/** The value as the widget writes it, for the CSS block. */
const cssValue = computed(() => {
  const parsed = parseShadows(props.modelValue, kind.value);
  return parsed ? formatShadows(parsed, kind.value) : props.modelValue;
});

const fields = computed(() => [
  { key: "x" as const, label: "X", min: -100, max: 100 },
  { key: "y" as const, label: "Y", min: -100, max: 100 },
  { key: "blur" as const, label: "Desfoque", min: 0, max: 100 },
  ...(kind.value === "box"
    ? [{ key: "spread" as const, label: "Expansão", min: -50, max: 100 }]
    : []),
]);

/** What the preview shows: the layers being edited, or the raw text. */
const previewStyle = computed(() => ({ [props.prop]: props.modelValue }));
</script>

<template>
  <div class="hse-shadow-editor">
    <div class="hse-shadow-stage">
      <div v-if="kind === 'box'" class="hse-shadow-box" :style="previewStyle" />
      <span v-else class="hse-shadow-sample" :style="previewStyle">Aa</span>
    </div>

    <div class="hse-shadow-toolbar">
      <select aria-label="Predefinições" :value="matchedPreset" @change="applyPreset">
        <option value="">Predefinições…</option>
        <option v-for="preset in presets[kind]" :key="preset.label" :value="preset.label">
          {{ preset.label }}
        </option>
      </select>
      <button v-if="layers" class="hse-shadow-add" @click="add">
        <Icon name="lucide:plus" class="size-3.5" /> Camada
      </button>
    </div>

    <template v-if="layers">
      <div
        v-for="(layer, index) in layers"
        :key="index"
        class="hse-shadow-layer"
        :class="{ active: openLayer === index }"
      >
        <div class="hse-shadow-layer-head">
          <button
            class="hse-shadow-layer-title"
            :aria-expanded="openLayer === index"
            @click="openLayer = openLayer === index ? -1 : index"
          >
            <Icon
              name="lucide:chevron-right"
              class="hse-shadow-chevron size-3"
              :class="{ open: openLayer === index }"
            />
            <span class="hse-shadow-chip" :style="{ [prop]: formatShadows([layer], kind) }" />
            <span class="hse-shadow-text">{{ summarize(layer, kind) }}</span>
          </button>
          <button
            class="hse-icon-button"
            title="Mover para cima"
            aria-label="Mover para cima"
            :disabled="index === 0"
            @click="move(index, -1)"
          >
            <Icon name="lucide:arrow-up" class="size-3" />
          </button>
          <button
            class="hse-icon-button"
            title="Mover para baixo"
            aria-label="Mover para baixo"
            :disabled="index === layers.length - 1"
            @click="move(index, 1)"
          >
            <Icon name="lucide:arrow-down" class="size-3" />
          </button>
          <button
            class="hse-icon-button"
            title="Duplicar"
            aria-label="Duplicar camada"
            @click="duplicate(index)"
          >
            <Icon name="lucide:copy" class="size-3" />
          </button>
          <button
            class="hse-icon-button"
            title="Remover"
            aria-label="Remover camada"
            @click="remove(index)"
          >
            <Icon name="lucide:trash-2" class="size-3" />
          </button>
        </div>

        <div v-if="openLayer === index" class="hse-shadow-layer-body">
          <label v-for="field in fields" :key="field.key" class="hse-shadow-slider">
            <span>{{ field.label }}</span>
            <input
              type="range"
              :min="field.min"
              :max="field.max"
              :value="layer[field.key]"
              :aria-label="field.label"
              @input="number(index, field.key, $event)"
            />
            <input
              type="number"
              :min="field.key === 'blur' ? 0 : undefined"
              :value="layer[field.key]"
              :aria-label="`${field.label} (px)`"
              @input="number(index, field.key, $event)"
            />
          </label>
          <div class="hse-shadow-color">
            <span>Cor</span>
            <component
              :is="api.ColorInput"
              :model-value="layer.color"
              :variables="session?.cssVariables.value"
              :resolver="session?.colorResolver.value"
              @update:model-value="edit(index, { color: $event })"
            />
          </div>
          <label v-if="kind === 'box'" class="hse-check">
            <input
              type="checkbox"
              :checked="layer.inset"
              @change="edit(index, { inset: ($event.target as HTMLInputElement).checked })"
            />
            Interna (inset)
          </label>
        </div>
      </div>
      <p v-if="!layers.length" class="hse-hint hse-shadow-empty">
        Sem sombra. Adicione uma camada ou escolha uma predefinição.
      </p>
    </template>
    <p v-else class="hse-hint hse-shadow-empty">
      Este valor usa unidades ou funções que o editor visual não edita. Edite o valor no campo de
      texto do painel.
    </p>

    <CssBlock :prop="prop" :value="cssValue" :api="api" />
  </div>
</template>
