<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { HUNT_KEY, clearProgress, loadProgress, saveProgress } from "./progress";
import { MAX_SELECTOR, pick, sameSelection, selectorLevels as levels } from "./selectors";
import { splitCode } from "./text";

const props = defineProps<{ signal: { resets: number } }>();

const saved = loadProgress(HUNT_KEY);
const solved = ref(new Set(saved.solved));
const index = ref(
  Math.max(
    0,
    levels.findIndex((l) => l.id === saved.current),
  ),
);
const level = computed(() => levels[index.value]!);

const selector = ref("");
const showHint = ref(false);
const done = computed(() => solved.value.has(level.value.id));
const finished = computed(() => solved.value.size === levels.length);

const stage = ref<HTMLElement>();
const goalStage = ref<HTMLElement>();
const picked = ref<number[] | undefined>();
const wanted = ref<number[]>([]);
const matches = ref(false);

/** What the selector says about itself, for the line under the field. */
const feedback = computed(() => {
  if (!selector.value.trim()) return "";
  if (picked.value === undefined)
    return selector.value.length > MAX_SELECTOR ? "Seletor longo demais." : "Seletor inválido.";
  const n = picked.value.length;
  return `${n} ${n === 1 ? "elemento selecionado" : "elementos selecionados"} (o objetivo tem ${wanted.value.length}).`;
});

/** Marks, in a stage, the elements at these positions. */
function mark(root: HTMLElement | undefined, attribute: string, positions: readonly number[]) {
  if (!root) return;
  const all = Array.from(root.querySelectorAll("*"));
  all.forEach((el, i) => el.toggleAttribute(attribute, positions.includes(i)));
}

async function check() {
  await nextTick(); // the stages are redrawn when the level changes
  const goalPick = goalStage.value ? (pick(goalStage.value, level.value.solution) ?? []) : [];
  wanted.value = goalPick;
  picked.value = stage.value ? pick(stage.value, selector.value) : undefined;
  mark(goalStage.value, "data-goal", goalPick);
  mark(stage.value, "data-hit", picked.value ?? []);
  matches.value = !!picked.value && sameSelection(picked.value, goalPick);
  if (matches.value && !solved.value.has(level.value.id)) {
    solved.value = new Set(solved.value).add(level.value.id);
    persist();
  }
}

function persist() {
  saveProgress(HUNT_KEY, { solved: [...solved.value], current: level.value.id });
}

function go(to: number) {
  index.value = Math.min(Math.max(to, 0), levels.length - 1);
}

watch(
  level,
  () => {
    selector.value = "";
    showHint.value = false;
    persist();
    void check();
  },
  { immediate: true },
);
watch(selector, () => void check());
onMounted(() => void check());

watch(
  () => props.signal.resets,
  () => {
    clearProgress(HUNT_KEY);
    solved.value = new Set();
    go(0);
    selector.value = "";
    void check();
  },
);

const lessonParts = computed(() => splitCode(level.value.lesson));
const hintParts = computed(() => splitCode(level.value.hint));
</script>

<template>
  <div class="fgg sel">
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
        <span class="fgg-badge sel-badge">Seletor</span>
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

    <section class="fgg-boards sel-stages">
      <figure>
        <figcaption>Sua seleção</figcaption>
        <div ref="stage" class="sel-stage" :class="{ ok: matches }" v-html="level.html" />
      </figure>
      <figure>
        <figcaption>Objetivo</figcaption>
        <div ref="goalStage" class="sel-stage goal" v-html="level.html" />
      </figure>
    </section>

    <section class="sel-source">
      <h4>HTML</h4>
      <pre>{{ level.html }}</pre>
    </section>

    <section class="fgg-editor sel-editor">
      <label class="fgg-selector" for="sel-input"><code>Seletor CSS</code></label>
      <input
        id="sel-input"
        v-model="selector"
        type="text"
        spellcheck="false"
        autocomplete="off"
        placeholder="ex.: .classe"
        aria-label="Seletor CSS"
      />
      <p class="sel-feedback" :class="{ bad: selector.trim() && picked === undefined }">
        {{ feedback }}
      </p>
    </section>

    <div class="fgg-actions">
      <button type="button" :disabled="index === 0" @click="go(index - 1)">← Anterior</button>
      <button type="button" @click="showHint = !showHint">Dica</button>
      <button type="button" @click="selector = level.solution">Ver solução</button>
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
      <p v-if="finished && matches" class="fgg-win">
        🏆 Você terminou todas as fases! Que tal rever alguma?
      </p>
      <p v-else-if="matches" class="fgg-win">✅ Selecionou os elementos certos!</p>
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
