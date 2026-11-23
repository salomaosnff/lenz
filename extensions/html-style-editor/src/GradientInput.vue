<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { HtmlEditorApi } from "html-visual-editor/api";
import CssBlock from "./CssBlock.vue";
import { canonicalCss, readInline } from "./inline";
import { dataUrlSize, elideDataUrls, formatImage, isDataUrl, parseImage } from "./image";
import { backgroundOptionFields } from "./model";
import StyleGroupView from "./StyleGroupView.vue";
import {
  barGradient,
  defaultGradient,
  formatGradient,
  gradientPresets,
  matchGradientPreset,
  nearestColor,
  parseGradient,
  reverseStops,
  sortStops,
  type Gradient,
  type GradientType,
  type RadialSize,
  type Stop,
} from "./gradient";

const props = defineProps<{
  /** `background-image`, or `text-gradient` for a gradient painted on the letters. */
  prop: string;
  /** The inline gradient (or any other `background-image`). */
  modelValue: string;
  api: HtmlEditorApi;
}>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const isText = computed(() => props.prop === "text-gradient");
const session = computed(() => props.api.session.value);
const isEmpty = computed(() => ["", "none"].includes(props.modelValue.trim()));

const selected = ref(0);

/** A single `url(...)`; the widget then edits an image instead of a gradient. */
const imageUrl = computed(() => parseImage(props.modelValue));
/** "Imagem" was chosen but no image was set yet. */
const wantsImage = ref(false);
const imageMode = computed(() => !isText.value && (imageUrl.value !== null || wantsImage.value));
/** The gradient that was being edited when the user switched to an image, to switch back to it. */
const remembered = ref<Gradient | null>(null);
const error = ref("");

/**
 * The gradient being edited. It is the source of truth while editing (a drag fires faster than
 * the document is re-read), and follows the value again when it changes from outside.
 */
const gradient = ref<Gradient | null>(parseGradient(props.modelValue));
watch(
  () => props.modelValue,
  (value) => {
    if (gradient.value && formatGradient(gradient.value) === value) return;
    gradient.value = parseGradient(value);
    selected.value = Math.min(selected.value, (gradient.value?.stops.length ?? 1) - 1);
  },
);

function write(next: Gradient) {
  gradient.value = next;
  wantsImage.value = false;
  emit("update:modelValue", formatGradient(next));
}
const patch = (changes: Partial<Gradient>) =>
  gradient.value && write({ ...gradient.value, ...changes });

function create(type: GradientType = "linear") {
  selected.value = 0;
  write(defaultGradient(type));
}

type Mode = GradientType | "image";

function changeType(type: Mode) {
  const g = gradient.value;
  if (type === "image") {
    // The gradient is kept aside, so going back to it does not lose the colors.
    if (g) remembered.value = g;
    wantsImage.value = true;
    gradient.value = null;
    if (g) emit("update:modelValue", "");
    return;
  }
  const base = g ?? remembered.value;
  if (!base) return create(type);
  // Keep the colors; the angle means something else for each type.
  selected.value = Math.min(selected.value, base.stops.length - 1);
  write({ ...defaultGradient(type), stops: base.stops, repeating: base.repeating });
}

/** What the type select shows. */
const mode = computed<Mode | "">(() => gradient.value?.type ?? (imageMode.value ? "image" : ""));

function clear() {
  gradient.value = null;
  wantsImage.value = false;
  error.value = "";
  emit("update:modelValue", "");
}

/** The select keeps showing the preset while the gradient still is that preset. */
const matchedPreset = computed(() =>
  matchGradientPreset(props.modelValue, (value) => canonicalCss("background-image", value)),
);

function applyPreset(event: Event) {
  const label = (event.target as HTMLSelectElement).value;
  const parsed = parseGradient(gradientPresets.find((p) => p.label === label)?.value ?? "");
  if (!parsed) return;
  selected.value = 0;
  write(parsed);
}

// ---- Stops -----------------------------------------------------------------------------------------

const bar = ref<HTMLElement>();
const stop = computed(() => gradient.value?.stops[selected.value]);
const positionAt = (event: PointerEvent) => {
  const rect = bar.value!.getBoundingClientRect();
  return (
    Math.round(Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100)) * 10) /
    10
  );
};

function setStops(stops: Stop[], track?: Stop) {
  const sorted = sortStops(stops, track);
  selected.value = sorted.index;
  patch({ stops: sorted.stops });
}

function updateStop(changes: Partial<Stop>) {
  const g = gradient.value;
  const current = stop.value;
  if (!g || !current) return;
  const next = { ...current, ...changes };
  setStops(
    g.stops.map((s) => (s === current ? next : s)),
    next,
  );
}

function addStop(event: PointerEvent) {
  const g = gradient.value;
  if (!g || event.target !== bar.value) return;
  const position = positionAt(event);
  const added: Stop = { color: nearestColor(g.stops, position), position };
  setStops([...g.stops, added], added);
}

function removeStop(index = selected.value) {
  const g = gradient.value;
  if (!g || g.stops.length <= 2) return;
  selected.value = Math.max(0, Math.min(index, g.stops.length - 2));
  patch({ stops: g.stops.filter((_, i) => i !== index) });
}

function startDrag(index: number, event: PointerEvent) {
  selected.value = index;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}
function drag(event: PointerEvent) {
  if (!(event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId)) return;
  updateStop({ position: positionAt(event) });
}

function keyStop(index: number, event: KeyboardEvent) {
  const step = event.shiftKey ? 10 : 1;
  const current = gradient.value?.stops[index];
  if (!current) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    selected.value = index;
    const delta = event.key === "ArrowLeft" ? -step : step;
    updateStop({ position: Math.min(100, Math.max(0, current.position + delta)) });
  } else if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    removeStop(index);
  }
}

const reverse = () => gradient.value && patch({ stops: reverseStops(gradient.value.stops) });

// ---- Other controls --------------------------------------------------------------------------------

const num = (event: Event) => (event.target as HTMLInputElement).valueAsNumber;
function setNumber(key: "angle" | "x" | "y", event: Event) {
  const value = num(event);
  if (Number.isFinite(value)) patch({ [key]: value });
}
function setStopPosition(event: Event) {
  const value = num(event);
  if (Number.isFinite(value)) updateStop({ position: Math.min(100, Math.max(0, value)) });
}

const types: { id: Mode; label: string; css: string }[] = [
  { id: "linear", label: "Linear", css: "linear-gradient" },
  { id: "radial", label: "Radial", css: "radial-gradient" },
  { id: "conic", label: "Cônico", css: "conic-gradient" },
  { id: "image", label: "Imagem", css: "url()" },
];
const directions = [
  { angle: 315, icon: "lucide:arrow-up-left" },
  { angle: 0, icon: "lucide:arrow-up" },
  { angle: 45, icon: "lucide:arrow-up-right" },
  { angle: 270, icon: "lucide:arrow-left" },
  { angle: null, icon: "" },
  { angle: 90, icon: "lucide:arrow-right" },
  { angle: 225, icon: "lucide:arrow-down-left" },
  { angle: 180, icon: "lucide:arrow-down" },
  { angle: 135, icon: "lucide:arrow-down-right" },
];
const availableTypes = computed(() => types.filter((type) => !isText.value || type.id !== "image"));
const sizes: { id: RadialSize; label: string }[] = [
  { id: "closest-side", label: "Lado mais próximo" },
  { id: "closest-corner", label: "Canto mais próximo" },
  { id: "farthest-side", label: "Lado mais distante" },
  { id: "farthest-corner", label: "Canto mais distante" },
];

// ---- Raw text ---------------------------------------------------------------------------------------

// ---- Image -------------------------------------------------------------------------------------------

const MAX_IMAGE = 3 * 1024 * 1024;
const fileInput = ref<HTMLInputElement>();

/** Embeds the file in the CSS as a data URL: there is no place to store uploads yet. */
function upload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  error.value = "";
  if (!file.type.startsWith("image/")) return void (error.value = "Escolha um arquivo de imagem.");
  if (file.size > MAX_IMAGE)
    return void (error.value = "A imagem passa de 3 MB; use uma menor ou um endereço (URL).");
  const reader = new FileReader();
  reader.onload = () => emit("update:modelValue", formatImage(String(reader.result)));
  reader.onerror = () => (error.value = "Não foi possível ler o arquivo.");
  reader.readAsDataURL(file);
}

function setUrl(event: Event) {
  const url = (event.target as HTMLInputElement).value.trim();
  error.value = "";
  emit("update:modelValue", url ? formatImage(url) : "");
}

const embedded = computed(() =>
  imageUrl.value && isDataUrl(imageUrl.value) ? imageUrl.value : null,
);

// ---- Background options ----------------------------------------------------------------------------

const optionsGroup = {
  id: "background-options",
  label: "Opções do fundo",
  fields: backgroundOptionFields,
};
/** The options that are set on the element, to show them in the preview and in the CSS. */
const options = computed(() => {
  const current = session.value;
  const el = current?.selected.value;
  if (!current || !el) return [];
  void current.version.value; // the DOM is not reactive: re-read after each edit
  return backgroundOptionFields
    .map((field): [string, string] => [field.prop, readInline(el, field.prop)])
    .filter(([, value]) => value);
});

/** The value as the widget writes it, for the CSS block. */
const cssValue = computed(() =>
  elideDataUrls(gradient.value ? formatGradient(gradient.value) : props.modelValue),
);
const cssExtra = computed(() => (isText.value ? [] : options.value));

const stage = computed(() =>
  isText.value
    ? {
        backgroundImage: props.modelValue,
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }
    : {
        backgroundImage: props.modelValue,
        // The same options the element has, so the preview shows how the image is placed.
        ...Object.fromEntries(options.value),
      },
);
</script>

<template>
  <div class="hse-shadow-editor">
    <div class="hse-shadow-toolbar">
      <select aria-label="Predefinições" :value="matchedPreset" @change="applyPreset">
        <option value="">Predefinições…</option>
        <option v-for="preset in gradientPresets" :key="preset.label" :value="preset.label">
          {{ preset.label }}
        </option>
      </select>
      <button v-if="gradient" class="hse-shadow-add" title="Inverter as cores" @click="reverse">
        <Icon name="lucide:arrow-left-right" class="size-3.5" />
      </button>
      <button v-if="!isEmpty" class="hse-shadow-add" title="Remover" @click="clear">
        <Icon name="lucide:trash-2" class="size-3.5" />
      </button>
    </div>

    <div class="hse-shadow-stage">
      <span v-if="isText" class="hse-grad-sample" :style="stage">Texto</span>
      <div v-else class="hse-grad-box" :style="stage" />
    </div>

    <label class="hse-shadow-color">
      <span>Tipo</span>
      <select
        :value="mode"
        aria-label="Tipo"
        @change="changeType(($event.target as HTMLSelectElement).value as Mode)"
      >
        <option v-if="!mode" value="" disabled>Escolha um tipo…</option>
        <option v-for="type in availableTypes" :key="type.id" :value="type.id">
          {{ type.label }} ({{ type.css }})
        </option>
      </select>
    </label>

    <!-- Editable: a single linear, radial or conic gradient. -->
    <template v-if="gradient">
      <div ref="bar" class="hse-grad-bar" @pointerdown="addStop">
        <div class="hse-grad-track" :style="{ backgroundImage: barGradient(gradient.stops) }" />
        <button
          v-for="(item, index) in gradient.stops"
          :key="index"
          class="hse-grad-stop"
          :class="{ active: index === selected }"
          :style="{ left: `${item.position}%`, '--stop': item.color }"
          :aria-label="`Cor ${index + 1} em ${item.position}%`"
          :title="`${item.color} · ${item.position}%`"
          @pointerdown.stop="startDrag(index, $event)"
          @pointermove="drag"
          @keydown="keyStop(index, $event)"
        />
      </div>

      <div v-if="stop" class="hse-grad-stopfields">
        <component
          :is="api.ColorInput"
          :model-value="stop.color"
          :variables="session?.cssVariables.value"
          :resolver="session?.colorResolver.value"
          @update:model-value="updateStop({ color: $event })"
        />
        <label class="hse-grad-pos">
          <input
            type="number"
            min="0"
            max="100"
            :value="stop.position"
            aria-label="Posição da cor (%)"
            @input="setStopPosition"
          />
          <span>%</span>
        </label>
        <button
          class="hse-icon-button"
          title="Remover cor"
          aria-label="Remover cor"
          :disabled="gradient.stops.length <= 2"
          @click="removeStop()"
        >
          <Icon name="lucide:trash-2" class="size-3.5" />
        </button>
      </div>
      <p class="hse-hint hse-shadow-empty">
        Clique na barra para adicionar uma cor. Arraste, ou use as setas, para movê-la.
      </p>

      <label v-if="gradient.type !== 'radial'" class="hse-shadow-slider">
        <span>{{ gradient.type === "linear" ? "Ângulo" : "Início" }}</span>
        <input
          type="range"
          min="0"
          max="360"
          :value="gradient.angle"
          aria-label="Ângulo"
          @input="setNumber('angle', $event)"
        />
        <input
          type="number"
          :value="gradient.angle"
          aria-label="Ângulo (graus)"
          @input="setNumber('angle', $event)"
        />
      </label>
      <div
        v-if="gradient.type === 'linear'"
        class="hse-grad-directions"
        role="group"
        aria-label="Direção"
      >
        <template v-for="(direction, index) in directions" :key="index">
          <button
            v-if="direction.angle !== null"
            :class="{ active: gradient.angle === direction.angle }"
            :aria-label="`${direction.angle} graus`"
            @click="patch({ angle: direction.angle })"
          >
            <Icon :name="direction.icon" class="size-3.5" />
          </button>
          <span v-else />
        </template>
      </div>

      <template v-if="gradient.type === 'radial'">
        <label class="hse-shadow-color">
          <span>Formato</span>
          <select
            :value="gradient.shape"
            @change="
              patch({ shape: ($event.target as HTMLSelectElement).value as Gradient['shape'] })
            "
          >
            <option value="ellipse">Elipse (ellipse)</option>
            <option value="circle">Círculo (circle)</option>
          </select>
        </label>
        <label class="hse-shadow-color">
          <span>Tamanho</span>
          <select
            :value="gradient.size"
            @change="patch({ size: ($event.target as HTMLSelectElement).value as RadialSize })"
          >
            <option v-for="size in sizes" :key="size.id" :value="size.id">
              {{ size.label }} ({{ size.id }})
            </option>
          </select>
        </label>
      </template>
      <div v-if="gradient.type !== 'linear'" class="hse-grad-center">
        <span>Centro</span>
        <label>
          X
          <input
            type="number"
            :value="gradient.x"
            aria-label="Centro X (%)"
            @input="setNumber('x', $event)"
          />
          %
        </label>
        <label>
          Y
          <input
            type="number"
            :value="gradient.y"
            aria-label="Centro Y (%)"
            @input="setNumber('y', $event)"
          />
          %
        </label>
      </div>

      <label class="hse-check">
        <input
          type="checkbox"
          :checked="gradient.repeating"
          @change="patch({ repeating: ($event.target as HTMLInputElement).checked })"
        />
        Repetir (repeating)
      </label>
    </template>

    <!-- An image: uploaded (embedded in the CSS) or from an address. -->
    <template v-else-if="imageMode">
      <div class="hse-img-source">
        <input
          v-if="embedded"
          :value="`Imagem enviada (${dataUrlSize(embedded)})`"
          readonly
          aria-label="Imagem"
        />
        <input
          v-else
          :value="imageUrl ?? ''"
          placeholder="https://… ou caminho da imagem"
          spellcheck="false"
          aria-label="Endereço da imagem"
          @change="setUrl"
        />
        <button class="hse-shadow-add" @click="fileInput?.click()">
          <Icon name="lucide:upload" class="size-3.5" /> Enviar
        </button>
        <input ref="fileInput" type="file" accept="image/*" hidden @change="upload" />
      </div>
      <p v-if="error" class="hse-error">{{ error }}</p>
      <p class="hse-hint hse-shadow-empty">
        Uma imagem enviada fica embutida no CSS, o que aumenta o arquivo: prefira imagens pequenas
        ou um endereço.
      </p>
    </template>

    <p v-else-if="!isEmpty" class="hse-hint hse-shadow-empty">
      Este valor não é um degradê que o editor visual edite (uma imagem, várias camadas ou unidades
      em px). Edite o valor no campo de texto do painel, ou substitua por um degradê.
    </p>

    <template v-if="!isText && (gradient || imageMode)">
      <h5 class="hse-subhead hse-shadow-sub">Opções do fundo</h5>
      <StyleGroupView :group="optionsGroup" :api="api" />
    </template>

    <CssBlock :prop="prop" :value="cssValue" :extra="cssExtra" :api="api" />
  </div>
</template>
