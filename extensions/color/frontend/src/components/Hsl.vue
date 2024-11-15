<script setup lang="ts">
import { computed } from "vue";

const modelValue = defineModel<string>();

const parts = computed(() => {
  if (!modelValue.value) return [0, 100, 50, 100];

  const matchHsl = modelValue.value.match(/^hsl\((.+?),\s*(.+?)%,\s*(.+?)%\)$/);

  if (matchHsl) {
    return matchHsl
      .slice(1)
      .map((v) => parseFloat(v))
      .concat(100);
  }

  const matchHsla = modelValue.value.match(
    /^hsla\((.+?),\s*(.+?)%,\s*(.+?)%,\s*(.+?)\)$/
  );

  if (matchHsla) {
    return matchHsla.slice(1).map((v) => parseFloat(v));
  }

  return [0, 100, 50, 100];
});

function setColor(
  hue: number,
  saturation: number,
  lightness: number,
  alpha: number
) {
  if (alpha === 1) {
    modelValue.value = `hsl(${hue},${saturation}%,${lightness}%)`;
  } else {
    modelValue.value = `hsla(${hue},${saturation}%,${lightness}%,${alpha})`;
  }
}

const hue = computed({
  get: () => parts.value[0],
  set: (v: number) => {
    const [, s, l, a] = parts.value;

    setColor(v, s, l, a);
  },
});

const saturation = computed({
  get: () => parts.value[1],
  set: (v: number) => {
    const [h, , l, a] = parts.value;

    setColor(h, v, l, a);
  },
});

const lightness = computed({
  get: () => parts.value[2],
  set: (v: number) => {
    const [h, s, , a] = parts.value;

    setColor(h, s, v, a);
  },
});

const alpha = computed({
  get: () => parts.value[3],
  set: (v: number) => {
    const [h, s, l] = parts.value;

    setColor(h, s, l, v);
  },
});

function toRgb() {
  let [h, s, l, a] = parts.value;

  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  // Converter para valores de 0 a 255
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  if (a === 1) {
    return `rgb(${r},${g},${b})`;
  }

  return `rgba(${r},${g},${b},${a})`;
}
</script>
<template>
  <div>
    <div class="flex gap-2 items-start mb-2">
      <div class="color-rgb-grid flex-1">
        <span>Matiz</span>
        <input
          class="block"
          v-model.number="hue"
          type="range"
          min="0"
          max="360"
        />
        <span>Saturação</span>
        <input
          class="block"
          v-model.number="saturation"
          type="range"
          min="0"
          max="100"
        />
        <span>Luminosidade</span>
        <input
          class="block"
          v-model.number="lightness"
          type="range"
          min="0"
          max="100"
        />
        <span>Transparência</span>
        <input
          class="block"
          v-model.number="alpha"
          type="range"
          min="0"
          max="1"
          step="0.01"
        />
      </div>
      <div
        class="aspect-ratio-1 w-20"
        :style="{
          backgroundColor: modelValue,
        }"
      ></div>
    </div>

    <button @click="modelValue = toRgb()">Converter para RGB</button>
  </div>
</template>

<style scoped>
.color-rgb-grid {
  display: grid;
  grid-template-columns: auto 1fr;
}
</style>
