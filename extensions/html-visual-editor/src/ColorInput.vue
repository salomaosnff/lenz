<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import {
  colorFormats,
  colorName,
  convertColor,
  detectFormat,
  formatChannels,
  formatColor,
  formatSpace,
  hsvToSrgb,
  parseColor,
  srgbToHsv,
  toSrgbInGamut,
  type Color,
  type ColorFormat,
  type Hsv,
} from "./colorModel";
import { namedColors } from "./cssNamedColors";
import { resolveColor, type ColorResolver, type CssVariable } from "./cssColorResolve";

const props = defineProps<{
  /** Any CSS color, including `var(--name)`. */
  modelValue: string;
  placeholder?: string;
  /** CSS variables offered in the popup (only the ones that hold a color are shown). */
  variables?: CssVariable[];
  /** Resolves what the browser has to compute: var(), color-mix(), currentcolor... */
  resolver?: ColorResolver;
  disabled?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

// ---- Text and the color it stands for ------------------------------------------------------

const text = ref(props.modelValue);
watch(
  () => props.modelValue,
  (value) => {
    if (value !== text.value) text.value = value;
  },
);

const resolved = computed(() =>
  text.value.trim() ? resolveColor(text.value, props.resolver) : null,
);
const invalid = computed(() => text.value.trim() !== "" && !resolved.value);
const isVariable = computed(() => /^var\(/i.test(text.value.trim()));

/** The swatch is painted from the resolved color, so var() and color-mix() show their result. */
const swatch = computed(() =>
  resolved.value ? formatColor(resolved.value, "srgb") : "transparent",
);
const swatchStyle = computed(() => ({ "--hve-swatch": swatch.value }));

function onInput(e: Event) {
  text.value = (e.target as HTMLInputElement).value;
  const value = text.value.trim();
  if (value === "") emit("update:modelValue", "");
  else if (resolveColor(value, props.resolver)) emit("update:modelValue", text.value);
}

function onBlur() {
  if (invalid.value) text.value = props.modelValue;
}

// ---- Popup state ------------------------------------------------------------------------------------

const open = ref(false);
const anchor = ref<HTMLElement>();
const panel = ref<HTMLElement>();
const position = ref({ left: 0, top: 0 });

const PANEL_WIDTH = 252;

/** What the popup edits. `current` keeps the space the user last worked in. */
const current = ref<Color>({ space: "srgb", coords: [0, 0, 0], alpha: 1 });
const hsv = ref<Hsv>({ h: 0, s: 0, v: 0 });
const format = ref<ColorFormat>("hex");

const alpha = computed(() => current.value.alpha);

function syncFrom(color: Color, keepHue = true) {
  current.value = color;
  const srgb = toSrgbInGamut(color);
  hsv.value = srgbToHsv(srgb.coords, keepHue ? hsv.value.h : 0);
}

async function openPopup() {
  if (props.disabled) return;
  const base = resolved.value ?? parseColor("#000000")!;
  format.value = detectFormat(text.value);
  hsv.value = { h: 0, s: 0, v: 0 };
  syncFrom(base, false);
  open.value = true;
  await nextTick();
  place();
}

function place() {
  const a = anchor.value?.getBoundingClientRect();
  const height = panel.value?.offsetHeight ?? 0;
  if (!a) return;
  const left = Math.min(Math.max(8, a.left), window.innerWidth - PANEL_WIDTH - 8);
  let top = a.bottom + 6;
  if (top + height > window.innerHeight - 8) top = Math.max(8, a.top - height - 6);
  position.value = { left, top };
}

function close(refocus = false) {
  open.value = false;
  if (refocus) anchor.value?.querySelector("input")?.focus();
}

function toggle() {
  if (open.value) close();
  else openPopup();
}

/** Writes the current color, in the chosen format, to the text and to the parent. */
function commit() {
  const out = formatColor(current.value, format.value);
  text.value = out;
  emit("update:modelValue", out);
}

function fromHsv(next: Hsv) {
  hsv.value = next;
  current.value = { space: "srgb", coords: hsvToSrgb(next), alpha: alpha.value };
  commit();
}

function fromAlpha(value: number) {
  current.value = { ...current.value, alpha: Math.min(1, Math.max(0, value)) };
  commit();
}

function fromColor(color: Color) {
  syncFrom(color);
  commit();
}

function changeFormat(next: ColorFormat) {
  format.value = next;
  commit();
}

// ---- Dragging: color area, hue and alpha ------------------------------------------------------

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function drag(e: PointerEvent, apply: (x: number, y: number) => void) {
  const el = e.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  const move = (event: PointerEvent) =>
    apply(
      clamp01((event.clientX - rect.left) / rect.width),
      clamp01((event.clientY - rect.top) / rect.height),
    );
  el.setPointerCapture(e.pointerId);
  move(e);
  const onMove = (event: PointerEvent) => move(event);
  const onUp = () => {
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerup", onUp);
    el.removeEventListener("pointercancel", onUp);
  };
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onUp);
}

const dragArea = (e: PointerEvent) =>
  drag(e, (x, y) => fromHsv({ h: hsv.value.h, s: x, v: 1 - y }));
const dragHue = (e: PointerEvent) => drag(e, (x) => fromHsv({ ...hsv.value, h: x * 360 }));
const dragAlpha = (e: PointerEvent) => drag(e, (x) => fromAlpha(x));

function keyArea(e: KeyboardEvent) {
  const step = e.shiftKey ? 0.1 : 0.01;
  const { h, s, v } = hsv.value;
  const moves: Record<string, Hsv> = {
    ArrowLeft: { h, s: clamp01(s - step), v },
    ArrowRight: { h, s: clamp01(s + step), v },
    ArrowUp: { h, s, v: clamp01(v + step) },
    ArrowDown: { h, s, v: clamp01(v - step) },
  };
  const next = moves[e.key];
  if (!next) return;
  e.preventDefault();
  fromHsv(next);
}

function keySlider(e: KeyboardEvent, value: number, max: number, apply: (v: number) => void) {
  const step = (e.shiftKey ? 0.1 : 0.01) * max;
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") apply(value - step);
  else if (e.key === "ArrowRight" || e.key === "ArrowUp") apply(value + step);
  else return;
  e.preventDefault();
}

// ---- Fields of the current format ---------------------------------------------------------------------

const channels = computed(() => formatChannels(format.value));
/** rgb is edited as 0..255 although sRGB is stored as 0..1. */
const scale = computed(() => (format.value === "rgb" ? 255 : 1));

const precision = computed(() => {
  switch (format.value) {
    case "hsl":
    case "hwb":
      return 1;
    case "lab":
    case "lch":
      return 2;
    case "rgb":
      return 0;
    default:
      return 4;
  }
});

const round = (v: number, places: number) => {
  const p = 10 ** places;
  const r = Math.round(v * p) / p;
  return Object.is(r, -0) ? 0 : r;
};

const channelValues = computed(() => {
  const space = formatSpace(format.value);
  return convertColor(current.value, space).coords.map((v) =>
    round(v * scale.value, precision.value),
  );
});

function setChannel(index: number, e: Event) {
  const value = (e.target as HTMLInputElement).valueAsNumber;
  if (!Number.isFinite(value)) return;
  const space = formatSpace(format.value);
  const coords = [...convertColor(current.value, space).coords] as Color["coords"];
  coords[index] = value / scale.value;
  fromColor({ space, coords, alpha: alpha.value });
}

const hexText = computed(() => formatColor(current.value, "hex"));

/** Every CSS color name, for the "Nome" format. */
const colorNames = ["transparent", ...Object.keys(namedColors)];
// Several names share one color (aqua/cyan, gray/grey...): remember which one was picked.
const pickedName = ref<string>();
/** The name of the current color, or `''` when it has none (the select then shows "personalizada"). */
const nameValue = computed(() => {
  if (current.value.alpha === 0) return "transparent";
  const picked = pickedName.value;
  const opaque = { ...current.value, alpha: 1 };
  if (picked && namedColors[picked] === formatColor(opaque, "hex")) return picked;
  return colorName(opaque) ?? "";
});

function setName(e: Event) {
  const name = (e.target as HTMLSelectElement).value;
  const parsed = parseColor(name);
  if (!parsed) return;
  pickedName.value = name;
  // A named color is opaque, except `transparent`; the alpha field keeps working for the others.
  fromColor(name === "transparent" ? parsed : { ...parsed, alpha: alpha.value || 1 });
}

function setHex(e: Event) {
  const parsed = parseColor((e.target as HTMLInputElement).value.trim());
  if (parsed) fromColor(parsed);
  else (e.target as HTMLInputElement).value = hexText.value;
}

// ---- Variables ---------------------------------------------------------------------------------------------

const colorVariables = computed(() => {
  if (!open.value) return [];
  return (props.variables ?? [])
    .map((variable) => ({
      ...variable,
      color: resolveColor(variable.value, props.resolver),
    }))
    .filter((variable): variable is typeof variable & { color: Color } => !!variable.color);
});

const swatchOf = (color: Color) => formatColor(color, "srgb");

function useVariable(name: string, color: Color) {
  // The text keeps pointing at the variable; the popup shows its color. Moving anything in the
  // popup afterwards replaces the variable with a plain color.
  syncFrom(color);
  text.value = `var(${name})`;
  emit("update:modelValue", text.value);
}

const variableName = computed(() => /^var\(\s*(--[^,\s)]+)/i.exec(text.value.trim())?.[1]);

// ---- Eyedropper ------------------------------------------------------------------------------------------------

const hasEyeDropper = typeof window !== "undefined" && "EyeDropper" in window;

async function pickFromScreen() {
  try {
    const result = await new (
      window as unknown as { EyeDropper: new () => { open(): Promise<{ sRGBHex: string }> } }
    ).EyeDropper().open();
    const picked = parseColor(result.sRGBHex);
    if (picked) fromColor({ ...picked, alpha: alpha.value });
  } catch {
    // The user cancelled.
  }
}

// ---- Closing the popup ---------------------------------------------------------------------------------------

function onDocumentPointerDown(e: PointerEvent) {
  const target = e.target as Node;
  if (panel.value?.contains(target) || anchor.value?.contains(target)) return;
  close();
}
function onDocumentKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.stopPropagation();
    close(true);
  }
}
function onScrollOrResize(e: Event) {
  if (e.target instanceof Node && panel.value?.contains(e.target)) return;
  close();
}

watch(open, (isOpen, _, onCleanup) => {
  if (!isOpen) return;
  document.addEventListener("pointerdown", onDocumentPointerDown, true);
  document.addEventListener("keydown", onDocumentKeydown, true);
  window.addEventListener("resize", onScrollOrResize);
  window.addEventListener("scroll", onScrollOrResize, true);
  onCleanup(() => {
    document.removeEventListener("pointerdown", onDocumentPointerDown, true);
    document.removeEventListener("keydown", onDocumentKeydown, true);
    window.removeEventListener("resize", onScrollOrResize);
    window.removeEventListener("scroll", onScrollOrResize, true);
  });
});
onBeforeUnmount(() => (open.value = false));

const hueColor = computed(() => `hsl(${hsv.value.h} 100% 50%)`);
const opaqueColor = computed(() => {
  const [r, g, b] = hsvToSrgb(hsv.value);
  return `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)})`;
});
</script>

<template>
  <div ref="anchor" class="hve-color" :class="{ invalid }">
    <button
      type="button"
      class="hve-color-swatch"
      :style="swatchStyle"
      :disabled="disabled"
      :aria-expanded="open"
      aria-label="Abrir seletor de cor"
      title="Abrir seletor de cor"
      @click="toggle"
    />
    <input
      class="hve-color-text"
      :value="text"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-invalid="invalid"
      spellcheck="false"
      @input="onInput"
      @blur="onBlur"
    />

    <Teleport to="body">
      <div
        v-if="open"
        ref="panel"
        class="hve-color-popup"
        role="dialog"
        aria-label="Seletor de cor"
        :style="{ left: `${position.left}px`, top: `${position.top}px`, width: `${PANEL_WIDTH}px` }"
      >
        <div
          class="hve-color-area"
          role="slider"
          tabindex="0"
          aria-label="Saturação e brilho"
          :style="{ '--hue': hueColor }"
          @pointerdown="dragArea"
          @keydown="keyArea"
        >
          <span
            class="hve-color-handle"
            :style="{
              left: `${hsv.s * 100}%`,
              top: `${(1 - hsv.v) * 100}%`,
              background: opaqueColor,
            }"
          />
        </div>

        <div class="hve-color-controls">
          <button
            v-if="hasEyeDropper"
            type="button"
            class="hve-icon"
            title="Pegar cor da tela"
            aria-label="Pegar cor da tela"
            @click="pickFromScreen"
          >
            <Icon name="lucide:pipette" class="size-3.5" />
          </button>
          <span class="hve-color-preview" :style="swatchStyle" />
          <div class="hve-color-sliders">
            <div
              class="hve-color-hue"
              role="slider"
              tabindex="0"
              aria-label="Matiz"
              :aria-valuenow="Math.round(hsv.h)"
              aria-valuemin="0"
              aria-valuemax="360"
              @pointerdown="dragHue"
              @keydown="
                keySlider($event, hsv.h, 360, (h) =>
                  fromHsv({ ...hsv, h: Math.min(360, Math.max(0, h)) }),
                )
              "
            >
              <span
                class="hve-color-thumb"
                :style="{ left: `${(hsv.h / 360) * 100}%`, background: hueColor }"
              />
            </div>
            <div
              class="hve-color-alpha"
              role="slider"
              tabindex="0"
              aria-label="Transparência"
              :aria-valuenow="Math.round(alpha * 100)"
              aria-valuemin="0"
              aria-valuemax="100"
              :style="{ '--color': opaqueColor }"
              @pointerdown="dragAlpha"
              @keydown="keySlider($event, alpha, 1, fromAlpha)"
            >
              <span class="hve-color-thumb" :style="{ left: `${alpha * 100}%` }" />
            </div>
          </div>
        </div>

        <div class="hve-color-fields">
          <template v-if="format === 'hex'">
            <label class="hve-color-field wide">
              <input :value="hexText" spellcheck="false" @change="setHex" />
              <span>HEX</span>
            </label>
          </template>
          <template v-else-if="format === 'name'">
            <label class="hve-color-field wide">
              <select :value="nameValue" aria-label="Nome da cor" @change="setName">
                <option v-if="!nameValue" value="" disabled>Cor personalizada</option>
                <option v-for="name in colorNames" :key="name" :value="name">{{ name }}</option>
              </select>
              <span>Nome</span>
            </label>
          </template>
          <template v-else>
            <label
              v-for="(channel, index) in channels"
              :key="channel.label"
              class="hve-color-field"
            >
              <input
                type="number"
                :min="channel.min !== undefined ? channel.min * scale : undefined"
                :max="channel.max !== undefined ? channel.max * scale : undefined"
                :step="channel.step"
                :value="channelValues[index]"
                @change="setChannel(index, $event)"
              />
              <span>{{ channel.label }}</span>
            </label>
          </template>
          <label class="hve-color-field">
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              :value="round(alpha, 3)"
              @change="fromAlpha(($event.target as HTMLInputElement).valueAsNumber)"
            />
            <span>A</span>
          </label>
        </div>

        <select
          class="hve-color-format"
          aria-label="Formato da cor"
          :value="format"
          @change="changeFormat(($event.target as HTMLSelectElement).value as ColorFormat)"
        >
          <option v-for="item in colorFormats" :key="item.id" :value="item.id">
            {{ item.label }}
          </option>
        </select>

        <div v-if="colorVariables.length || isVariable" class="hve-color-vars">
          <h6>Variáveis CSS</h6>
          <p v-if="isVariable" class="hve-color-varnote">
            Usando <code>{{ variableName ?? text }}</code
            >. Mexer no seletor troca a variável por uma cor fixa.
          </p>
          <div class="hve-color-swatches">
            <button
              v-for="variable in colorVariables"
              :key="variable.name"
              type="button"
              class="hve-color-var"
              :class="{ selected: variableName === variable.name }"
              :style="{ '--hve-swatch': swatchOf(variable.color) }"
              :title="`${variable.name}: ${variable.value}`"
              :aria-label="`${variable.name}: ${variable.value}`"
              @click="useVariable(variable.name, variable.color)"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
