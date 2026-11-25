<script setup lang="ts">
import { computed, ref, watch as watchValue } from "vue";
import { SPEEDS, type Player } from "./player";

const props = defineProps<{ player: Player }>();

const frames = computed(() => props.player.frames);
const paths = computed(() => {
  void frames.value.length; // grows while a recording is live
  return props.player.recorder.paths();
});
const frame = computed(() => props.player.frame.value);
const shown = computed(() => props.player.shown.value);
const closed = computed(() => shown.value?.frame?.kind === "close");

/** `m:ss` since the first frame of the recording. */
function clock(time: number) {
  const seconds = Math.max(0, Math.round((time - (frames.value[0]?.time ?? time)) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

const KIND: Record<string, string> = {
  open: "Aberto",
  close: "Fechado",
  undo: "Desfazer",
  redo: "Refazer",
  goto: "Ir para",
  clear: "Histórico limpo",
};
const caption = computed(() => {
  const f = frame.value;
  if (!f) return "";
  return KIND[f.kind] && f.kind !== "open" && f.kind !== "close"
    ? `${KIND[f.kind]}: ${f.label}`
    : f.label;
});

const isHtml = (path: string) => /\.html?$/i.test(path);
/** What the preview shows: an HTML file as a page, anything else as text. */
const page = computed(() => {
  const content = shown.value?.frame?.content ?? "";
  if (/<html[\s>]/i.test(content)) return content;
  return `<!doctype html><meta charset="utf-8"><body style="margin:16px;font-family:system-ui,sans-serif;color:#18181b">${content}`;
});

const frameEl = ref<HTMLIFrameElement>();
/** Where each file was scrolled to the last time it was on screen. */
const scrolls = new Map<string, { x: number; y: number }>();
let drawn: { el: HTMLIFrameElement; path: string } | undefined;

/**
 * Puts the frame on the page, keeping the scroll: the new content is written into the same
 * document instead of loading another one, and the position the page was at goes back at once.
 * (Setting `srcdoc` would reload it from the top on every frame.) The iframe is same-origin but
 * runs no scripts, so what was recorded cannot act on the app.
 */
function draw() {
  const el = frameEl.value;
  const path = shown.value?.path;
  const doc = el?.contentDocument;
  const win = el?.contentWindow;
  if (!el || !path || !doc || !win) {
    drawn = undefined;
    return;
  }
  // Where the page on screen is now, including what the user scrolled while it was paused.
  if (drawn?.el === el) scrolls.set(drawn.path, { x: win.scrollX, y: win.scrollY });
  doc.open();
  doc.write(page.value);
  doc.close();
  const at = scrolls.get(path);
  if (at) win.scrollTo(at.x, at.y);
  drawn = { el, path };
}
watchValue([frameEl, page, () => shown.value?.path], draw, { flush: "post" });

const seek = (event: Event) => props.player.seek((event.target as HTMLInputElement).valueAsNumber);
const speed = (event: Event) =>
  props.player.setSpeed(Number((event.target as HTMLSelectElement).value));
const watch = (event: Event) =>
  (props.player.watching.value = (event.target as HTMLSelectElement).value || null);
</script>

<template>
  <div class="hp">
    <p v-if="!frames.length" class="hp-empty">
      <Icon name="lucide:clapperboard" class="size-8" />
      <template v-if="player.title.value">Esta gravação ainda não tem quadros.</template>
      <template v-else>Escolha uma gravação no painel Gravações para reproduzi-la.</template>
    </p>

    <template v-else>
      <div class="hp-title">
        <Icon name="lucide:clapperboard" class="size-3.5" />
        <span class="hp-name">{{ player.title.value }}</span>
        <span v-if="player.live.value" class="hp-live">● gravando</span>
      </div>
      <div class="hp-top">
        <label class="hp-field">
          <span>Arquivo</span>
          <select :value="player.watching.value ?? ''" aria-label="Arquivo" @change="watch">
            <option value="">Seguir o que muda</option>
            <option v-for="path in paths" :key="path" :value="path">{{ path }}</option>
          </select>
        </label>
      </div>

      <div class="hp-stage">
        <div class="hp-caption">
          <span class="hp-file">{{ shown?.path }}</span>
          <span v-if="closed" class="hp-badge">fechado</span>
          <span v-else-if="!shown?.frame" class="hp-badge">ainda não existia</span>
        </div>
        <iframe
          v-if="shown?.frame && isHtml(shown.path)"
          ref="frameEl"
          class="hp-frame"
          sandbox="allow-same-origin"
          title="Arquivo no momento da gravação"
        />
        <pre v-else-if="shown?.frame" class="hp-code"><code>{{ shown.frame.content }}</code></pre>
        <p v-else class="hp-empty">Este arquivo ainda não tinha sido aberto neste momento.</p>
      </div>

      <div class="hp-what" aria-live="polite">
        <span class="hp-time">{{ frame ? clock(frame.time) : "0:00" }}</span>
        <span class="hp-label">{{ caption }}</span>
        <span class="hp-count">{{ player.index.value + 1 }} / {{ frames.length }}</span>
      </div>

      <input
        class="hp-seek"
        type="range"
        min="0"
        :max="player.last.value"
        :value="player.index.value"
        aria-label="Posição da gravação"
        @input="seek"
      />

      <div class="hp-controls">
        <button
          class="hp-button"
          title="Anterior"
          aria-label="Anterior"
          :disabled="player.index.value === 0"
          @click="player.previous()"
        >
          <Icon name="lucide:skip-back" class="size-4" />
        </button>
        <button
          class="hp-button hp-play"
          :title="player.playing.value ? 'Pausar' : 'Reproduzir'"
          :aria-label="player.playing.value ? 'Pausar' : 'Reproduzir'"
          @click="player.toggle()"
        >
          <Icon :name="player.playing.value ? 'lucide:pause' : 'lucide:play'" class="size-4" />
        </button>
        <button
          class="hp-button"
          title="Próximo"
          aria-label="Próximo"
          :disabled="player.atEnd.value"
          @click="player.next()"
        >
          <Icon name="lucide:skip-forward" class="size-4" />
        </button>

        <label class="hp-speed">
          <Icon name="lucide:gauge" class="size-3.5" />
          <select :value="player.speed.value" aria-label="Velocidade" @change="speed">
            <option v-for="value in SPEEDS" :key="value" :value="value">{{ value }}×</option>
          </select>
        </label>
      </div>
    </template>
  </div>
</template>
