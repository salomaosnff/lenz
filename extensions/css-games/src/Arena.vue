<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { MATCH_GOAL, arenaLevels as levels, type ArenaLevel } from "./arena";
import { HEIGHT, WIDTH, codeSize, compareImages, shownPercent } from "./pixels";
import { ARENA_KEY, clearProgress, loadProgress, saveProgress } from "./progress";
import { buildSvg, rasterize, toUrl } from "./render";
import { splitCode } from "./text";

const props = defineProps<{ signal: { resets: number } }>();

const saved = loadProgress(ARENA_KEY);
const solved = ref(new Set(saved.solved));
const index = ref(
  Math.max(
    0,
    levels.findIndex((l) => l.id === saved.current),
  ),
);
const level = computed<ArenaLevel>(() => levels[index.value]!);
const done = computed(() => solved.value.has(level.value.id));
const finished = computed(() => solved.value.size === levels.length);

const DEFAULT_HTML = "<div></div>";
const html = ref(DEFAULT_HTML);
const css = ref("");
const showHint = ref(false);
const view = ref<"mine" | "diff">("mine");

/** What the player wrote in each level, kept while the game is open so changing level loses nothing. */
const drafts = new Map<string, { html: string; css: string }>();

// ---- The pictures ------------------------------------------------------------------------------------
const targetUrl = computed(() => toUrl(buildSvg(level.value.html, level.value.css).svg));
const mine = ref(toUrl(buildSvg(html.value, css.value).svg));
const notes = ref<string[]>([]);
const percent = ref(0);
const status = ref<"ready" | "blocked" | "error">("ready");
const diffCanvas = ref<HTMLCanvasElement>();

// ---- The comparer: the target shows up to the right of the pointer --------------------------------
const frame = ref<HTMLElement>();
/** Where the divider is, in percent of the width. `undefined` while nobody is pointing at the picture. */
const split = ref<number>();
const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

function point(event: PointerEvent) {
  const rect = frame.value?.getBoundingClientRect();
  if (!rect || !rect.width) return;
  split.value = clampPercent(((event.clientX - rect.left) / rect.width) * 100);
}

function nudge(event: KeyboardEvent) {
  const step = event.key === "ArrowLeft" ? -5 : event.key === "ArrowRight" ? 5 : 0;
  if (!step) return;
  event.preventDefault();
  split.value = clampPercent((split.value ?? 50) + step);
}

const overlayStyle = computed(() => ({ clipPath: `inset(0 0 0 ${split.value ?? 100}%)` }));

let token = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

async function update() {
  const mark = ++token;
  const built = buildSvg(html.value, css.value);
  mine.value = toUrl(built.svg);
  notes.value = built.notes;
  try {
    const [a, b] = await Promise.all([rasterize(mine.value), rasterize(targetUrl.value)]);
    if (mark !== token) return; // the player has already typed something else
    if (!a || !b) {
      status.value = "blocked";
      return;
    }
    status.value = "ready";
    const result = compareImages(a, b);
    percent.value = result.percent;
    diffCanvas.value
      ?.getContext("2d")
      ?.putImageData(new ImageData(new Uint8ClampedArray(result.diff), WIDTH, HEIGHT), 0, 0);
    if (result.percent >= MATCH_GOAL && !solved.value.has(level.value.id)) {
      solved.value = new Set(solved.value).add(level.value.id);
      persist();
    }
  } catch {
    if (mark === token) status.value = "error";
  }
}

/** Typing is not drawn on every key: the picture follows when the player pauses. */
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(() => void update(), 250);
}
onBeforeUnmount(() => clearTimeout(timer));

watch([html, css], () => {
  drafts.set(level.value.id, { html: html.value, css: css.value });
  schedule();
});

function persist() {
  saveProgress(ARENA_KEY, { solved: [...solved.value], current: level.value.id });
}

function go(to: number) {
  index.value = Math.min(Math.max(to, 0), levels.length - 1);
}

watch(
  level,
  () => {
    const draft = drafts.get(level.value.id);
    html.value = draft?.html ?? DEFAULT_HTML;
    css.value = draft?.css ?? "";
    showHint.value = false;
    view.value = "mine";
    percent.value = 0;
    persist();
    schedule();
  },
  { immediate: true },
);

watch(
  () => props.signal.resets,
  () => {
    clearProgress(ARENA_KEY);
    solved.value = new Set();
    drafts.clear();
    go(0);
    html.value = DEFAULT_HTML;
    css.value = "";
  },
);

function showSolution() {
  html.value = level.value.html;
  css.value = level.value.css;
}

const size = computed(() => codeSize(html.value, css.value));
const match = computed(() => percent.value >= MATCH_GOAL);
const lessonParts = computed(() => splitCode(level.value.lesson));
const hintParts = computed(() => splitCode(level.value.hint));
</script>

<template>
  <div class="fgg arena">
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
        <span class="fgg-badge arena-badge">Batalha</span>
        {{ level.title }}
      </h3>
      <p>
        <template v-for="(part, i) in lessonParts" :key="i">
          <code v-if="part.code">{{ part.text }}</code>
          <template v-else>{{ part.text }}</template>
        </template>
      </p>
      <p class="fgg-goal"><strong>Desafio:</strong> {{ level.goal }}</p>
      <ul class="arena-colors" aria-label="Cores da imagem">
        <li v-for="color in level.colors" :key="color">
          <span class="arena-chip" :style="{ background: color }" />
          <code>{{ color }}</code>
        </li>
      </ul>
    </section>

    <section class="fgg-boards arena-pictures">
      <figure>
        <figcaption>Objetivo</figcaption>
        <div class="arena-frame goal"><img :src="targetUrl" alt="Imagem a recriar" /></div>
      </figure>
      <figure>
        <figcaption class="arena-tabs">
          <button type="button" :class="{ active: view === 'mine' }" @click="view = 'mine'">
            Seu resultado
          </button>
          <button type="button" :class="{ active: view === 'diff' }" @click="view = 'diff'">
            Diferenças
          </button>
        </figcaption>
        <div
          ref="frame"
          class="arena-frame arena-compare"
          :class="{ ok: match }"
          :tabindex="view === 'mine' ? 0 : -1"
          :aria-label="
            view === 'mine'
              ? 'Passe o mouse ou use as setas para comparar com o objetivo'
              : undefined
          "
          @pointermove="view === 'mine' && point($event)"
          @pointerdown="view === 'mine' && point($event)"
          @pointerleave="split = undefined"
          @focus="view === 'mine' && split === undefined && (split = 50)"
          @blur="split = undefined"
          @keydown="view === 'mine' && nudge($event)"
        >
          <img v-show="view === 'mine'" :src="mine" alt="Seu resultado" draggable="false" />
          <canvas v-show="view === 'diff'" ref="diffCanvas" :width="WIDTH" :height="HEIGHT" />
          <template v-if="view === 'mine' && split !== undefined">
            <img
              class="arena-over"
              :src="targetUrl"
              alt=""
              draggable="false"
              :style="overlayStyle"
            />
            <span class="arena-divider" :style="{ left: `${split}%` }" />
            <span class="arena-tag left">Seu</span>
            <span class="arena-tag right">Objetivo</span>
          </template>
        </div>
      </figure>
    </section>

    <section class="arena-score" aria-live="polite">
      <div class="arena-bar" :class="{ ok: match }">
        <div class="arena-fill" :style="{ width: `${percent}%` }" />
        <span class="arena-goal-mark" :style="{ left: `${MATCH_GOAL}%` }" />
      </div>
      <p>
        <strong>{{ shownPercent(percent).toFixed(1) }}%</strong> igual (precisa de
        {{ MATCH_GOAL }}%) · {{ size }} caracteres
      </p>
      <p v-if="status === 'blocked'" class="sel-feedback bad">
        Este navegador não deixa o jogo comparar a imagem. Tente no Chrome ou no Firefox.
      </p>
      <p v-else-if="status === 'error'" class="sel-feedback bad">
        Não foi possível desenhar a imagem.
      </p>
    </section>

    <section class="arena-editors">
      <label>
        <code>HTML</code>
        <textarea v-model="html" spellcheck="false" autocomplete="off" rows="5" aria-label="HTML" />
      </label>
      <label>
        <code>CSS</code>
        <textarea
          v-model="css"
          spellcheck="false"
          autocomplete="off"
          rows="10"
          placeholder="body { background: ...; }"
          aria-label="CSS"
        />
      </label>
    </section>
    <ul v-if="notes.length" class="fgg-problems">
      <li v-for="note in notes" :key="note">{{ note }}</li>
    </ul>
    <p class="arena-rules">
      Vale só HTML e CSS: sem imagens (<code>url()</code>), <code>&lt;script&gt;</code> ou
      <code>&lt;img&gt;</code>. No CSS, <code>body</code> é a cena de 400×300 px.
    </p>

    <div class="fgg-actions">
      <button type="button" :disabled="index === 0" @click="go(index - 1)">← Anterior</button>
      <button type="button" @click="showHint = !showHint">Dica</button>
      <button type="button" @click="showSolution">Ver solução</button>
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
      <p v-if="finished && match" class="fgg-win">
        🏆 Você venceu todas as batalhas! Agora tente deixar o código mais curto.
      </p>
      <p v-else-if="match" class="fgg-win">✅ Imagem recriada! Dá para fazer com menos código?</p>
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
