<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { parseComputed, type Rgba } from "./color";
import { MAX_COLOR, evaluate, paletteLevels as levels, type PaletteLevel } from "./palette";
import { COLORS_KEY, clearProgress, loadProgress, saveProgress } from "./progress";
import { splitCode } from "./text";

const props = defineProps<{ signal: { resets: number } }>();

const saved = loadProgress(COLORS_KEY);
const solved = ref(new Set(saved.solved));
const index = ref(
  Math.max(
    0,
    levels.findIndex((l) => l.id === saved.current),
  ),
);
const level = computed<PaletteLevel>(() => levels[index.value]!);
const done = computed(() => solved.value.has(level.value.id));
const finished = computed(() => solved.value.size === levels.length);

const text = ref("");
const showHint = ref(false);

// ---- The browser is what knows the colours ----------------------------------------------------
// Names, `hsl()` and the rest are read by setting the colour on an element and asking for the
// computed one. What is typed only ever goes into `style.color` of this element.
const probe = ref<HTMLElement>();
const ready = ref(false);
onMounted(() => (ready.value = true));

function resolve(css: string): Rgba | undefined {
  const el = probe.value;
  if (!el) return undefined;
  el.style.color = "";
  el.style.color = css;
  if (!el.style.color) return undefined; // the browser did not accept it
  return parseComputed(getComputedStyle(el).color);
}

const evaluation = computed(() => {
  void ready.value;
  return evaluate(level.value, text.value, resolve);
});

const css = (c: Rgba) => `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
const playerColor = computed(() =>
  evaluation.value.player ? css(evaluation.value.player) : undefined,
);

watch(
  () => evaluation.value.solved,
  (ok) => {
    if (!ok || solved.value.has(level.value.id)) return;
    solved.value = new Set(solved.value).add(level.value.id);
    persist();
  },
);

function persist() {
  saveProgress(COLORS_KEY, { solved: [...solved.value], current: level.value.id });
}

function go(to: number) {
  index.value = Math.min(Math.max(to, 0), levels.length - 1);
}

watch(
  level,
  () => {
    text.value = "";
    showHint.value = false;
    persist();
  },
  { immediate: true },
);

watch(
  () => props.signal.resets,
  async () => {
    clearProgress(COLORS_KEY);
    solved.value = new Set();
    go(0);
    text.value = "";
    await nextTick();
  },
);

const lessonParts = computed(() => splitCode(level.value.lesson));
const hintParts = computed(() => splitCode(level.value.hint));

const ARROW = { ok: "✓", up: "↑ mais", down: "↓ menos" } as const;

const STATUS = {
  invalid: "Essa não é uma cor que o navegador entenda.",
  format: "A cor é válida, mas o desafio pede outro jeito de escrever. Veja a lição.",
} as const;
const statusMessage = computed(() => {
  const status = evaluation.value.status;
  return status === "invalid" || status === "format" ? STATUS[status] : "";
});
</script>

<template>
  <div class="fgg pal">
    <span ref="probe" class="pal-probe" aria-hidden="true" />

    <header class="fgg-top">
      <div class="fgg-levels" role="tablist" aria-label="Fases">
        <button
          v-for="(l, i) in levels"
          :key="l.id"
          type="button"
          role="tab"
          :class="['fgg-dot', { active: i === index, solved: solved.has(l.id) }]"
          :aria-selected="i === index"
          :title="`${i + 1}. ${l.title}`"
          @click="go(i)"
        >
          {{ i + 1 }}
        </button>
      </div>
      <span class="fgg-count">{{ solved.size }}/{{ levels.length }}</span>
    </header>

    <section class="fgg-lesson">
      <h3>
        <span class="fgg-badge pal-badge">{{ level.kind === "match" ? "Cor" : "Contraste" }}</span>
        {{ level.title }}
      </h3>
      <p>
        <template v-for="(part, i) in lessonParts" :key="i">
          <code v-if="part.code">{{ part.text }}</code>
          <template v-else>{{ part.text }}</template>
        </template>
      </p>
      <p class="fgg-goal"><strong>Desafio:</strong> {{ level.goal }}</p>
    </section>

    <section v-if="level.kind === 'match'" class="fgg-boards">
      <figure>
        <figcaption>Sua cor</figcaption>
        <div class="pal-checker" :class="{ ok: evaluation.solved }">
          <div class="pal-swatch" :style="{ background: playerColor }" />
        </div>
      </figure>
      <figure>
        <figcaption>Objetivo</figcaption>
        <div class="pal-checker goal">
          <div class="pal-swatch" :style="{ background: level.target }" />
        </div>
      </figure>
    </section>

    <section v-else class="pal-contrast" :style="{ background: level.background }">
      <p class="pal-sample" :style="{ color: playerColor }">Texto de exemplo: Aa Bb Cc 123</p>
      <p class="pal-sample small" :style="{ color: playerColor }">
        O contraste mede se dá para ler este texto sobre o fundo.
      </p>
    </section>

    <section class="fgg-editor sel-editor">
      <label class="fgg-selector" for="pal-input"><code>color:</code></label>
      <input
        id="pal-input"
        v-model="text"
        type="text"
        spellcheck="false"
        autocomplete="off"
        :maxlength="MAX_COLOR"
        placeholder="ex.: #ff8800"
        aria-label="Cor em CSS"
      />
      <p v-if="statusMessage" class="sel-feedback bad">{{ statusMessage }}</p>
      <p
        v-else-if="level.kind === 'contrast' && evaluation.ratio !== undefined"
        class="sel-feedback"
      >
        Contraste: <strong>{{ evaluation.ratio.toFixed(2) }}:1</strong> (o mínimo é
        {{ level.min }}:1)
      </p>
      <ul v-else-if="evaluation.hints.length" class="pal-hints">
        <li v-for="hint in evaluation.hints" :key="hint.label" :class="hint.state">
          <span>{{ hint.label }}</span>
          <strong>{{ ARROW[hint.state] }}</strong>
        </li>
      </ul>
      <p
        v-else-if="
          level.kind === 'match' && level.feedback === 'none' && evaluation.status === 'ok'
        "
        class="sel-feedback"
      >
        Ainda não é essa cor.
      </p>
    </section>

    <div class="fgg-actions">
      <button type="button" :disabled="index === 0" @click="go(index - 1)">← Anterior</button>
      <button type="button" @click="showHint = !showHint">Dica</button>
      <button type="button" @click="text = level.solution">Ver solução</button>
      <button
        type="button"
        class="primary"
        :disabled="index === levels.length - 1 || !done"
        @click="go(index + 1)"
      >
        Próxima →
      </button>
    </div>

    <section class="fgg-status" aria-live="polite">
      <p v-if="finished && evaluation.solved" class="fgg-win">
        🏆 Você terminou todas as fases! Que tal rever alguma?
      </p>
      <p v-else-if="evaluation.solved" class="fgg-win">✅ Cor certa!</p>
      <p v-else-if="showHint" class="fgg-hint">
        Dica:
        <template v-for="(part, i) in hintParts" :key="i">
          <code v-if="part.code">{{ part.text }}</code>
          <template v-else>{{ part.text }}</template>
        </template>
      </p>
    </section>
  </div>
</template>
