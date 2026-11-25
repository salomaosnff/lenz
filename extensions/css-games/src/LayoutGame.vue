<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { parseDeclarations, sameLayout, toStyle, type Box } from "./css";
import { MODE_LABEL, type Level } from "./levels";
import { splitCode } from "./text";
import { clearProgress, loadProgress, saveProgress } from "./progress";

const props = defineProps<{
  signal: { resets: number };
  levels: Level[];
  /** Where this game keeps its progress. */
  storageKey: string;
}>();
// A game never swaps its levels while it is open.
const { levels, storageKey } = props;

const saved = loadProgress(storageKey);
const solved = ref(new Set(saved.solved));
const index = ref(
  Math.max(
    0,
    levels.findIndex((l) => l.id === saved.current),
  ),
);
const level = computed<Level>(() => levels[index.value]!);

const code = ref("");
const showHint = ref(false);
const done = computed(() => solved.value.has(level.value.id));
const finished = computed(() => solved.value.size === levels.length);

const player = ref<HTMLElement>();
const goal = ref<HTMLElement>();
const matches = ref(false);

const parsed = computed(() => parseDeclarations(code.value, level.value.allowed));
const goalStyle = computed(() =>
  toStyle(parseDeclarations(level.value.solution, level.value.allowed).accepted),
);

const target = computed(() => level.value.target ?? "container");
const selector = computed(() =>
  target.value === "container" ? ".container" : `.bloco-${(target.value as number) + 1}`,
);

/** The style of the container and of box `i`, with the player's (or the solution's) CSS where it applies. */
function containerStyle(extra: string) {
  return `${level.value.container ?? ""} ${target.value === "container" ? extra : ""}`;
}
function itemStyle(i: number, extra: string) {
  return `${level.value.item ?? ""} ${target.value === i ? extra : ""}`;
}
const playerContainer = computed(() => containerStyle(toStyle(parsed.value.accepted)));
const goalContainer = computed(() => containerStyle(goalStyle.value));

function measure(board: HTMLElement | undefined): Box[] {
  if (!board) return [];
  const origin = board.getBoundingClientRect();
  return Array.from(board.children, (child) => {
    const r = child.getBoundingClientRect();
    return { x: r.x - origin.x, y: r.y - origin.y, width: r.width, height: r.height };
  });
}

async function check() {
  await nextTick();
  matches.value = sameLayout(measure(player.value), measure(goal.value));
  if (matches.value && !solved.value.has(level.value.id)) {
    solved.value = new Set(solved.value).add(level.value.id);
    persist();
  }
}

function persist() {
  saveProgress(storageKey, { solved: [...solved.value], current: level.value.id });
}

function go(to: number) {
  index.value = Math.min(Math.max(to, 0), levels.length - 1);
}

watch(
  level,
  (next) => {
    code.value = next.start ?? "";
    showHint.value = false;
    persist();
    void check();
  },
  { immediate: true },
);
watch(code, () => void check());
onMounted(() => void check());

watch(
  () => props.signal.resets,
  () => {
    clearProgress(storageKey);
    solved.value = new Set();
    go(0);
    code.value = "";
    void check();
  },
);

function showSolution() {
  code.value = level.value.solution.replace(/; /g, ";\n");
}

const REASONS = {
  "not-allowed": "não existe, ou não vale nesta fase",
  unsafe: "tem um valor não permitido",
  invalid: "não é uma declaração válida",
} as const;

/** Declarations whose value the browser does not understand (it drops them, so the player must be told). */
const misunderstood = computed(() =>
  typeof CSS === "undefined" || !CSS.supports
    ? []
    : parsed.value.accepted.filter((d) => !CSS.supports(d.property, d.value)),
);
const problems = computed(() => [
  ...parsed.value.rejected.map((r) => `"${r.property}" ${REASONS[r.reason]}`),
  ...misunderstood.value.map(
    (d) =>
      `"${d.property}: ${d.value.replace(/\s+/g, " ")}" tem um valor que o navegador não entende`,
  ),
]);

const lessonParts = computed(() => splitCode(level.value.lesson));
const hintParts = computed(() => splitCode(level.value.hint));
</script>

<template>
  <div class="fgg">
    <header class="fgg-top">
      <div class="fgg-levels" role="tablist" aria-label="Fases">
        <button
          v-for="(l, i) in levels"
          :key="l.id"
          type="button"
          role="tab"
          :class="['fgg-dot', l.mode, { active: i === index, solved: solved.has(l.id) }]"
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
        <span :class="['fgg-badge', level.mode]">{{ MODE_LABEL[level.mode] }}</span>
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

    <section class="fgg-boards">
      <figure>
        <figcaption>Seu layout</figcaption>
        <div
          ref="player"
          class="fgg-board"
          :class="[level.mode, { ok: matches }]"
          :style="playerContainer"
        >
          <div
            v-for="n in level.items"
            :key="n"
            class="fgg-item"
            :class="{ target: target === n - 1 }"
            :style="itemStyle(n - 1, toStyle(parsed.accepted))"
          >
            {{ n }}
          </div>
        </div>
      </figure>
      <figure>
        <figcaption>Objetivo</figcaption>
        <div ref="goal" class="fgg-board goal" :class="level.mode" :style="goalContainer">
          <div
            v-for="n in level.items"
            :key="n"
            class="fgg-item"
            :class="{ target: target === n - 1 }"
            :style="itemStyle(n - 1, goalStyle)"
          >
            {{ n }}
          </div>
        </div>
      </figure>
    </section>

    <section class="fgg-editor">
      <div class="fgg-selector">
        <code>{{ selector }} {</code>
        <span v-if="level.container && target === 'container'" class="fgg-fixed">
          {{ level.container }}
        </span>
      </div>
      <textarea
        v-model="code"
        spellcheck="false"
        autocomplete="off"
        rows="4"
        placeholder="propriedade: valor;"
        aria-label="CSS"
      />
      <div class="fgg-selector"><code>}</code></div>
      <ul v-if="problems.length" class="fgg-problems">
        <li v-for="p in problems" :key="p">{{ p }}</li>
      </ul>
    </section>

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
      <p v-if="finished && matches" class="fgg-win">
        🏆 Você terminou todas as fases! Que tal rever alguma?
      </p>
      <p v-else-if="matches" class="fgg-win">✅ Layout certo!</p>
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
