<script setup lang="ts">
import { computed } from "vue";
import type { Controller } from "./controller";
import { duration, type RecordingMeta } from "./recording";

const props = defineProps<{
  controller: Controller;
  /** What the host of the panel can do with a recording. */
  actions: {
    start(): void;
    stop(): void;
    play(id: string): void;
    download(id: string): void;
    /** Asks for the new name. */
    rename(id: string): void;
    /** Asks for confirmation before deleting. */
    remove(id: string): void;
    load(): void;
  };
}>();

const active = computed(() => props.controller.active.value);
const recordings = computed(() => props.controller.recordings.value);
// The one being recorded is shown on top, from its own state: the saved list lags behind it.
const saved = computed(() => recordings.value.filter((m) => m.id !== active.value?.meta.id));
const frameCount = computed(() => active.value?.recorder.frames.value.length ?? 0);

const when = (ms: number) =>
  new Date(ms).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
const files = (n: number) => (n === 1 ? "1 arquivo" : `${n} arquivos`);
const frames = (n: number) => (n === 1 ? "1 quadro" : `${n} quadros`);
const details = (m: RecordingMeta) =>
  [
    when(m.startedAt),
    duration((m.endedAt ?? m.startedAt) - m.startedAt),
    frames(m.frameCount),
    files(m.files.length),
  ].join(" · ");
</script>

<template>
  <div class="hpp">
    <div class="hpp-bar">
      <button v-if="!active" class="hpp-record" @click="actions.start()">
        <Icon name="lucide:circle" class="size-3.5" /> Gravar
      </button>
      <button v-else class="hpp-record recording" @click="actions.stop()">
        <Icon name="lucide:square" class="size-3.5" /> Parar
      </button>
      <button
        class="hpp-secondary"
        title="Carregar uma gravação de um arquivo"
        @click="actions.load()"
      >
        <Icon name="lucide:upload" class="size-3.5" /> Carregar
      </button>
    </div>

    <ul class="hpp-list">
      <li v-if="active" class="hpp-item live">
        <div class="hpp-main">
          <span class="hpp-name"><span class="hpp-dot" />{{ active.meta.name }}</span>
          <span class="hpp-details">Gravando · {{ frames(frameCount) }}</span>
        </div>
        <div class="hpp-actions">
          <button
            class="hpp-icon"
            title="Assistir ao vivo"
            aria-label="Assistir ao vivo"
            @click="actions.play(active.meta.id)"
          >
            <Icon name="lucide:play" class="size-3.5" />
          </button>
        </div>
      </li>

      <li v-for="meta in saved" :key="meta.id" class="hpp-item">
        <div class="hpp-main">
          <span class="hpp-name" :title="meta.name">{{ meta.name }}</span>
          <span class="hpp-details">{{ details(meta) }}</span>
        </div>
        <div class="hpp-actions">
          <button
            class="hpp-icon"
            title="Reproduzir"
            aria-label="Reproduzir"
            @click="actions.play(meta.id)"
          >
            <Icon name="lucide:play" class="size-3.5" />
          </button>
          <button
            class="hpp-icon"
            title="Baixar em um arquivo"
            aria-label="Baixar em um arquivo"
            @click="actions.download(meta.id)"
          >
            <Icon name="lucide:download" class="size-3.5" />
          </button>
          <button
            class="hpp-icon"
            title="Renomear"
            aria-label="Renomear"
            @click="actions.rename(meta.id)"
          >
            <Icon name="lucide:pencil" class="size-3.5" />
          </button>
          <button
            class="hpp-icon"
            title="Excluir"
            aria-label="Excluir"
            @click="actions.remove(meta.id)"
          >
            <Icon name="lucide:trash-2" class="size-3.5" />
          </button>
        </div>
      </li>

      <li v-if="!active && !saved.length" class="hpp-empty">
        Nenhuma gravação ainda. Clique em Gravar, edite seus arquivos e pare quando quiser: ela fica
        guardada aqui.
      </li>
    </ul>
  </div>
</template>
