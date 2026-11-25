<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { QUIZ_KEY, clearProgress, loadJson, saveJson } from "./progress";
import {
  DIFFICULTY_LABEL,
  WEAK_BELOW,
  choicesOf,
  grade,
  ordered,
  parseSaved,
  questions as allQuestions,
  verdict,
  type Answer,
  type Question,
  type Saved,
} from "./quiz";
import { splitCode } from "./text";

const props = defineProps<{
  signal: { resets: number };
  /** The other games, so a suggestion of what to study can take the player to the right one. */
  games: { id: string; title: string }[];
  open: (gameId: string) => void;
}>();

const screen = ref<"start" | "playing" | "result">("start");
const saved = ref<Saved | undefined>(parseSaved(loadJson(QUIZ_KEY)));

// ---- Playing -------------------------------------------------------------------------------------
const queue = ref<Question[]>([]);
const position = ref(0);
const answers = ref<Answer[]>([]);
const picked = ref<number>();

const question = computed(() => queue.value[position.value]);
/** The four answers of the question on screen, in the order drawn for it. */
const choices = ref<{ text: string; correct: boolean }[]>([]);
const answered = computed(() => picked.value !== undefined);
const last = computed(() => position.value === queue.value.length - 1);

watch(
  question,
  (q) => {
    picked.value = undefined;
    choices.value = q ? choicesOf(q) : [];
  },
  { immediate: true },
);

function start() {
  queue.value = ordered();
  position.value = 0;
  answers.value = [];
  screen.value = "playing";
}

function choose(index: number) {
  const q = question.value;
  if (!q || answered.value) return;
  picked.value = index;
  answers.value = [...answers.value, { id: q.id, ok: choices.value[index]!.correct }];
}

const result = computed(() => grade(answers.value));

function next() {
  if (!last.value) {
    position.value++;
    return;
  }
  const g = result.value;
  const best = Math.max(g.score, saved.value?.best ?? 0);
  saved.value = { score: g.score, correct: g.correct, total: g.total, best, at: Date.now() };
  saveJson(QUIZ_KEY, saved.value);
  screen.value = "result";
}

watch(
  () => props.signal.resets,
  () => {
    clearProgress(QUIZ_KEY);
    saved.value = undefined;
    screen.value = "start";
  },
);

// ---- What is shown ----------------------------------------------------------------------------------
const pct = (ratio: number) => `${Math.round(ratio * 100)}%`;
const note = (score: number) => score.toFixed(1).replace(".", ",");
const textParts = computed(() => splitCode(question.value?.text ?? ""));
const explainParts = computed(() => splitCode(question.value?.explain ?? ""));
const verdictOf = computed(() => verdict(result.value.score));
const gameTitle = (id: string) => props.games.find((g) => g.id === id)?.title;
const date = (at: number) => new Date(at).toLocaleDateString("pt-BR");
const weakPercent = Math.round(WEAK_BELOW * 100);
const tone = (ratio: number) => (ratio >= WEAK_BELOW ? "good" : ratio >= 0.4 ? "mid" : "low");
/** A bar for each topic, in the order of the grade: weakest first. */
const levelCount = (level: 1 | 2 | 3) => allQuestions.filter((q) => q.level === level).length;

/** The wrong answers worth reading again, in the order they were asked. */
const optionLetter = (i: number) => "ABCD"[i];
</script>

<template>
  <div class="fgg quiz">
    <!-- Start -->
    <section v-if="screen === 'start'" class="quiz-start">
      <h2>Prova de Fogo</h2>
      <p>
        {{ allQuestions.length }} perguntas sobre o que mais se usa no CSS, do mais fácil ao mais
        difícil: {{ levelCount(1) }} fáceis, {{ levelCount(2) }} médias e {{ levelCount(3) }}
        difíceis. No final você recebe uma nota e uma lista do que vale a pena estudar.
      </p>
      <ul class="quiz-facts">
        <li>Cada resposta mostra a explicação na hora.</li>
        <li>Perguntas difíceis valem mais na nota.</li>
        <li>Não há limite de tempo.</li>
      </ul>
      <p v-if="saved" class="quiz-last">
        Última nota: <strong>{{ note(saved.score) }}</strong> ({{ saved.correct }}/{{
          saved.total
        }}, {{ date(saved.at) }}) · Melhor: <strong>{{ note(saved.best) }}</strong>
      </p>
      <div class="fgg-actions">
        <button type="button" class="primary quiz-go" @click="start">
          {{ saved ? "Jogar de novo" : "Começar" }}
        </button>
      </div>
    </section>

    <!-- Playing -->
    <template v-else-if="screen === 'playing' && question">
      <header class="quiz-top">
        <span class="quiz-level" :class="`l${question.level}`">{{
          DIFFICULTY_LABEL[question.level]
        }}</span>
        <span class="fgg-count">{{ position + 1 }}/{{ queue.length }}</span>
      </header>
      <div
        class="quiz-progress"
        role="progressbar"
        :aria-valuenow="position + 1"
        :aria-valuemax="queue.length"
      >
        <div :style="{ width: `${(position / queue.length) * 100}%` }" />
      </div>

      <section class="quiz-question">
        <h3>
          <template v-for="(part, i) in textParts" :key="i">
            <code v-if="part.code">{{ part.text }}</code>
            <template v-else>{{ part.text }}</template>
          </template>
        </h3>
        <pre v-if="question.code" class="quiz-code">{{ question.code }}</pre>

        <div class="quiz-options" role="group" aria-label="Respostas">
          <button
            v-for="(choice, i) in choices"
            :key="choice.text"
            type="button"
            class="quiz-option"
            :class="{
              right: answered && choice.correct,
              wrong: answered && picked === i && !choice.correct,
              dim: answered && picked !== i && !choice.correct,
            }"
            :disabled="answered"
            @click="choose(i)"
          >
            <span class="quiz-letter">{{ optionLetter(i) }}</span>
            <span>
              <template v-for="(part, j) in splitCode(choice.text)" :key="j">
                <code v-if="part.code">{{ part.text }}</code>
                <template v-else>{{ part.text }}</template>
              </template>
            </span>
          </button>
        </div>
      </section>

      <section class="fgg-status" aria-live="polite">
        <template v-if="answered">
          <p :class="choices[picked!]!.correct ? 'fgg-win' : 'cab-wrong'">
            {{ choices[picked!]!.correct ? "✅ Certo!" : "❌ Não foi dessa vez." }}
          </p>
          <p class="cab-explain">
            <template v-for="(part, i) in explainParts" :key="i">
              <code v-if="part.code">{{ part.text }}</code>
              <template v-else>{{ part.text }}</template>
            </template>
          </p>
        </template>
      </section>

      <div class="fgg-actions">
        <button type="button" class="primary" :disabled="!answered" @click="next">
          {{ last ? "Ver minha nota" : "Próxima →" }}
        </button>
      </div>
    </template>

    <!-- Result -->
    <template v-else-if="screen === 'result'">
      <section class="quiz-score">
        <div class="quiz-grade" :class="tone(result.score / 10)">
          <strong>{{ note(result.score) }}</strong>
          <span>de 10</span>
        </div>
        <div>
          <h2>{{ verdictOf.title }}</h2>
          <p>{{ verdictOf.text }}</p>
          <p class="quiz-last">
            Você acertou {{ result.correct }} de {{ result.total }} perguntas.
            <template v-if="saved && saved.best > result.score">
              Sua melhor nota é {{ note(saved.best) }}.
            </template>
            <template v-else-if="saved && saved.best === result.score">
              Essa é a sua melhor nota!
            </template>
          </p>
        </div>
      </section>

      <section>
        <h4 class="quiz-heading">Por dificuldade</h4>
        <ul class="quiz-bars">
          <li v-for="l in result.byLevel" :key="l.level">
            <span class="quiz-bar-label">{{ DIFFICULTY_LABEL[l.level] }}</span>
            <span class="quiz-bar"
              ><span :class="tone(l.ratio)" :style="{ width: pct(l.ratio) }"
            /></span>
            <span class="quiz-bar-value">{{ l.correct }}/{{ l.total }}</span>
          </li>
        </ul>
      </section>

      <section>
        <h4 class="quiz-heading">Por assunto</h4>
        <ul class="quiz-bars">
          <li v-for="t in result.byTopic" :key="t.topic.id">
            <span class="quiz-bar-label">{{ t.topic.label }}</span>
            <span class="quiz-bar"
              ><span :class="tone(t.ratio)" :style="{ width: pct(t.ratio) }"
            /></span>
            <span class="quiz-bar-value">{{ t.correct }}/{{ t.total }}</span>
          </li>
        </ul>
      </section>

      <section>
        <h4 class="quiz-heading">O que estudar</h4>
        <p v-if="!result.weak.length" class="quiz-study-ok">
          Nenhum assunto ficou abaixo de {{ weakPercent }}%. Para seguir evoluindo, tente os jogos
          mais difíceis, como o Pixel Perfeito e o Caça-Bugs.
        </p>
        <ol v-else class="quiz-study">
          <li v-for="t in result.weak" :key="t.topic.id" :class="tone(t.ratio)">
            <strong>{{ t.topic.label }}</strong>
            <span class="quiz-study-score">acertou {{ t.correct }} de {{ t.total }}</span>
            <p>
              <template v-for="(part, i) in splitCode(t.topic.study)" :key="i">
                <code v-if="part.code">{{ part.text }}</code>
                <template v-else>{{ part.text }}</template>
              </template>
            </p>
            <button v-if="t.topic.game" type="button" @click="open(t.topic.game)">
              Praticar em {{ gameTitle(t.topic.game) }} →
            </button>
          </li>
        </ol>
      </section>

      <details v-if="result.wrong.length" class="quiz-review">
        <summary>Rever as {{ result.wrong.length }} que você errou</summary>
        <ul>
          <li v-for="q in result.wrong" :key="q.id">
            <p>
              <strong>
                <template v-for="(part, i) in splitCode(q.text)" :key="i">
                  <code v-if="part.code">{{ part.text }}</code>
                  <template v-else>{{ part.text }}</template>
                </template>
              </strong>
            </p>
            <pre v-if="q.code" class="quiz-code">{{ q.code }}</pre>
            <p>
              Resposta:
              <template v-for="(part, i) in splitCode(q.correct)" :key="i">
                <code v-if="part.code">{{ part.text }}</code>
                <template v-else>{{ part.text }}</template>
              </template>
            </p>
            <p class="cab-explain">
              <template v-for="(part, i) in splitCode(q.explain)" :key="i">
                <code v-if="part.code">{{ part.text }}</code>
                <template v-else>{{ part.text }}</template>
              </template>
            </p>
          </li>
        </ul>
      </details>

      <div class="fgg-actions">
        <button type="button" class="primary" @click="start">Jogar de novo</button>
        <button type="button" @click="screen = 'start'">Voltar ao início</button>
      </div>
    </template>
  </div>
</template>
