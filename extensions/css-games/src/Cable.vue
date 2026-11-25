<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { COLORS, cableLevels as levels, type CableLevel } from "./cable";
import { CABLE_KEY, clearProgress, loadProgress, saveProgress } from "./progress";
import { specificity, weakestFirst } from "./specificity";
import { splitCode } from "./text";

const props = defineProps<{ signal: { resets: number } }>();

const saved = loadProgress(CABLE_KEY);
const solved = ref(new Set(saved.solved));
const index = ref(
  Math.max(
    0,
    levels.findIndex((l) => l.id === saved.current),
  ),
);
const level = computed<CableLevel>(() => levels[index.value]!);
const done = computed(() => solved.value.has(level.value.id));
/** The player gave up and looked at the answer: it shows, but the level does not count as solved. */
const revealed = ref(false);
const shown = computed(() => done.value || revealed.value);
const finished = computed(() => solved.value.size === levels.length);

const showHint = ref(false);
/** Colours already tried in this level. */
const wrong = ref(new Set<string>());
/** The selectors picked so far in an ordering level, by their position. */
const sequence = ref<number[]>([]);
const wrongOrder = ref(false);

const lessonParts = computed(() => splitCode(level.value.lesson));
const hintParts = computed(() => splitCode(level.value.hint));
const explanationParts = computed(() => splitCode(level.value.explanation));

function solve() {
  solved.value = new Set(solved.value).add(level.value.id);
  persist();
}

function persist() {
  saveProgress(CABLE_KEY, { solved: [...solved.value], current: level.value.id });
}

function go(to: number) {
  index.value = Math.min(Math.max(to, 0), levels.length - 1);
}

function pickColor(value: string) {
  const current = level.value;
  if (current.kind !== "pick" || shown.value) return;
  if (value === current.answer) solve();
  else wrong.value = new Set(wrong.value).add(value);
}

function pickSelector(position: number) {
  const current = level.value;
  if (current.kind !== "order" || shown.value || sequence.value.includes(position)) return;
  wrongOrder.value = false;
  sequence.value = [...sequence.value, position];
  if (sequence.value.length < current.selectors.length) return;
  const right = weakestFirst(current.selectors);
  if (right.every((p, i) => p === sequence.value[i])) solve();
  else {
    wrongOrder.value = true;
    sequence.value = [];
  }
}

watch(
  level,
  () => {
    showHint.value = false;
    revealed.value = false;
    wrong.value = new Set();
    sequence.value = [];
    wrongOrder.value = false;
    persist();
  },
  { immediate: true },
);

watch(
  () => props.signal.resets,
  () => {
    clearProgress(CABLE_KEY);
    solved.value = new Set();
    go(0);
    wrong.value = new Set();
    sequence.value = [];
  },
);

// ---- The check: the browser draws the case for real ---------------------------------------------
const preview = ref<HTMLElement>();
watch(
  [shown, level, preview],
  async () => {
    await nextTick();
    const current = level.value;
    if (!shown.value || !preview.value || current.kind !== "pick") return;
    const root = preview.value.shadowRoot ?? preview.value.attachShadow({ mode: "open" });
    const css = current.rules.map((r) => `${r.selector} { ${r.css} }`).join("\n");
    // Fixed text written in cable.ts, not typed by the player.
    root.innerHTML = `<style>${css}</style>${current.html}`;
  },
  { flush: "post" },
);

/** The weight of a selector as the three numbers the lesson talks about. */
const weight = (selector: string) => specificity(selector).join(",");
</script>

<template>
  <div class="fgg cab">
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
        <span class="fgg-badge cab-badge">{{
          level.kind === "pick" ? "Quem vence?" : "Ordene"
        }}</span>
        {{ level.title }}
      </h3>
      <p>
        <template v-for="(part, i) in lessonParts" :key="i">
          <code v-if="part.code">{{ part.text }}</code>
          <template v-else>{{ part.text }}</template>
        </template>
      </p>
    </section>

    <template v-if="level.kind === 'pick'">
      <section class="sel-source">
        <h4>HTML</h4>
        <pre>{{ level.html }}</pre>
      </section>
      <section class="sel-source">
        <h4>CSS (na ordem em que está escrito)</h4>
        <pre>{{ level.rules.map((r) => `${r.selector} { ${r.css} }`).join("\n") }}</pre>
      </section>
      <section class="cab-question">
        <p class="fgg-goal">
          <strong>{{ level.question }}</strong>
        </p>
        <div class="cab-options">
          <button
            v-for="color in COLORS"
            :key="color.value"
            type="button"
            class="cab-color"
            :class="{
              wrong: wrong.has(color.value),
              right: shown && color.value === level.answer,
            }"
            :disabled="shown || wrong.has(color.value)"
            @click="pickColor(color.value)"
          >
            <span class="cab-swatch" :style="{ background: color.value }" />
            {{ color.label }}
          </button>
        </div>
      </section>
    </template>

    <section v-else class="cab-question">
      <p class="fgg-goal">
        <strong>Clique do mais fraco ao mais forte.</strong>
      </p>
      <div class="cab-options">
        <button
          v-for="(selector, position) in level.selectors"
          :key="selector"
          type="button"
          class="cab-selector"
          :class="{ right: shown }"
          :disabled="shown || sequence.includes(position)"
          @click="pickSelector(position)"
        >
          <code>{{ selector }}</code>
          <span v-if="shown" class="cab-rank">{{
            weakestFirst(level.selectors).indexOf(position) + 1
          }}</span>
          <span v-else-if="sequence.includes(position)" class="cab-rank">{{
            sequence.indexOf(position) + 1
          }}</span>
        </button>
      </div>
      <p v-if="shown" class="cab-weights">
        <template v-for="position in weakestFirst(level.selectors)" :key="position">
          <code>{{ level.selectors[position] }}</code>
          <span class="cab-weight">({{ weight(level.selectors[position]!) }})</span>
          <span v-if="position !== weakestFirst(level.selectors).at(-1)"> &lt; </span>
        </template>
      </p>
    </section>

    <div class="fgg-actions">
      <button type="button" :disabled="index === 0" @click="go(index - 1)">← Anterior</button>
      <button type="button" :disabled="shown" @click="showHint = !showHint">Dica</button>
      <button type="button" :disabled="shown" @click="revealed = true">Ver solução</button>
      <button
        type="button"
        class="primary"
        :disabled="index === levels.length - 1 || !shown"
        @click="go(index + 1)"
      >
        Próxima →
      </button>
    </div>

    <section class="fgg-status" aria-live="polite">
      <template v-if="shown">
        <p v-if="done" class="fgg-win">
          {{ finished ? "🏆 Você terminou todas as fases!" : "✅ Certo!" }}
        </p>
        <p v-else class="cab-wrong">Resposta revelada. Esta fase só conta quando você acertar.</p>
        <p class="cab-explain">
          <template v-for="(part, i) in explanationParts" :key="i">
            <code v-if="part.code">{{ part.text }}</code>
            <template v-else>{{ part.text }}</template>
          </template>
        </p>
        <div v-if="level.kind === 'pick'" class="cab-proof">
          <h4>Tira-teima: o navegador desenhou assim</h4>
          <div ref="preview" class="cab-preview" />
        </div>
      </template>
      <p v-else-if="wrongOrder" class="cab-wrong">Não é essa ordem. Tente de novo.</p>
      <p v-else-if="wrong.size" class="cab-wrong">Não foi dessa vez. Tente outra cor.</p>
      <p v-if="showHint && !shown" class="fgg-hint">
        Dica:
        <template v-for="(part, i) in hintParts" :key="i">
          <code v-if="part.code">{{ part.text }}</code>
          <template v-else>{{ part.text }}</template>
        </template>
      </p>
    </section>
  </div>
</template>
