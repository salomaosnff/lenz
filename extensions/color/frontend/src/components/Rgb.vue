<script setup lang="ts">
import { computed } from "vue";

const modelValue = defineModel<string>();

const format = computed(() => {
  if (!modelValue.value) return "";

  if (/^rgba\(.+?\)$/.test(modelValue.value)) return "rgba";
  if (/^rgb\(.+?\)$/.test(modelValue.value)) return "rgb";
  if (
    /^#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})$/.test(
      modelValue.value
    )
  )
    return "hex";

  return "";
});

const parts = computed(() => {
  if (!modelValue.value) return [0, 0, 0, 1];

  const matchRgba = modelValue.value.match(/^rgba\((.+?),(.+?),(.+?),(.+?)\)$/);

  if (matchRgba) {
    return matchRgba.slice(1).map((v) => parseFloat(v));
  }

  const matchRgb = modelValue.value.match(/^rgb\((.+?),(.+?),(.+?)\)$/);

  if (matchRgb) {
    return [...matchRgb.slice(1).map((v) => parseFloat(v)), 1];
  }

  const matchHex8 = modelValue.value.match(
    /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
  );

  if (matchHex8) {
    let [r, g, b, a] = matchHex8.slice(1).map((v) => parseInt(v, 16));

    return [r, g, b, a / 255];
  }

  const matchHex6 = modelValue.value.match(
    /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i
  );

  if (matchHex6) {
    let [r, g, b] = matchHex6.slice(1).map((v) => parseInt(v, 16));

    return [r, g, b, 1];
  }

  const matchHex4 = modelValue.value.match(
    /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/
  );

  if (matchHex4) {
    let [r, g, b, a] = matchHex4.slice(1).map((v) => parseInt(v + v, 16));

    return [r, g, b, a / 255];
  }

  const matchHex3 = modelValue.value.match(
    /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/
  );

  if (matchHex3) {
    let [r, g, b] = matchHex3.slice(1).map((v) => parseInt(v + v, 16));

    return [r, g, b, 1];
  }

  return [0, 0, 0, 1];
});

function setColor(red: number, green: number, blue: number, alpha: number) {
  if (format.value === "rgba") {
    modelValue.value = `rgba(${red},${green},${blue},${alpha})`;
  } else if (format.value === "rgb") {
    modelValue.value = `rgb(${red},${green},${blue})`;
  } else {
    alpha = Math.round(alpha * 255);

    const toString = (v: string | number) => v.toString(16).padStart(2, "0");

    modelValue.value = [
      "#",
      toString(red),
      toString(green),
      toString(blue),
      toString(alpha),
    ].join("");
  }
}

const red = computed({
  get: () => parts.value[0],
  set: (v: number) => {
    const [_, g, b, a] = parts.value;

    setColor(v, g, b, a);
  },
});

const green = computed({
  get: () => parts.value[1],
  set: (v: number) => {
    const [r, _, b, a] = parts.value;

    setColor(r, v, b, a);
  },
});

const blue = computed({
  get: () => parts.value[2],
  set: (v: number) => {
    const [r, g, _, a] = parts.value;

    setColor(r, g, v, a);
  },
});

const alpha = computed({
  get: () => parts.value[3],
  set: (v: number) => {
    const [r, g, b, _] = parts.value;

    setColor(r, g, b, v);
  },
});

function toHsl() {
  const [r, g, b] = parts.value.slice(0, 3).map((v) => v / 255);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;

    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h *= 60;
  }

  if (alpha.value === 1) {
    return `hsl(${h},${s * 100}%,${l * 100}%)`;
  }

  return `hsla(${h},${s * 100}%,${l * 100}%,${alpha.value})`;
}
</script>
<template>
  <div>
    <div class="flex gap-2 items-start mb-2">
      <div class="color-rgb-grid flex-1">
        <span>Vermelho</span>
        <input
          class="block"
          v-model.number="red"
          type="range"
          min="0"
          max="255"
        />
        <span>Verde</span>
        <input
          class="block"
          v-model.number="green"
          type="range"
          min="0"
          max="255"
        />
        <span>Azul</span>
        <input
          class="block"
          v-model.number="blue"
          type="range"
          min="0"
          max="255"
        />
        <span>Transparência</span>
        <input
          class="block"
          v-model.number="alpha"
          type="range"
          min="0"
          max="1"
          step="0.001"
        />
      </div>
      <div
        class="aspect-ratio-1 w-20"
        :style="{
          backgroundColor: modelValue,
        }"
      ></div>
    </div>

    <button @click="modelValue = toHsl()">Converter para HSL</button>
  </div>
</template>

<style scoped>
.color-rgb-grid {
  display: grid;
  grid-template-columns: auto 1fr;
}
</style>
