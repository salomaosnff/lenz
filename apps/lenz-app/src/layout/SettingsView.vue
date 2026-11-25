<script setup lang="ts">
import { computed } from "vue";
import { SwitchRoot, SwitchThumb } from "reka-ui";
import { DEFAULT_PORT } from "lenz-mcp/protocol";
import { mcpEnabled, mcpStatus } from "../agent-tools";
import { autosaveEnabled } from "../editor/autosave";
import { notifications } from "../notifications";
import { openKeybindingsPage } from "../keybindings/page";

const enabled = computed({
  get: () => mcpEnabled.value,
  set: (value: boolean) => (mcpEnabled.value = value),
});

const autosave = computed({
  get: () => autosaveEnabled.value,
  set: (value: boolean) => (autosaveEnabled.value = value),
});

const STATUS: Record<string, string> = {
  off: "Desativado",
  connecting: `Aguardando o lenz-mcp em 127.0.0.1:${DEFAULT_PORT}…`,
  connected: "Conectado ao lenz-mcp",
};

/** Pages from this machine are accepted as they are; any other origin has to be allowed. */
const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
const command = computed(
  () => `claude mcp add lenz -- npx lenz-mcp${isLocal ? "" : ` --allow-origin ${location.origin}`}`,
);

async function copyCommand() {
  try {
    await navigator.clipboard.writeText(command.value);
    void notifications.showInformationMessage("Comando copiado.");
  } catch {
    void notifications.showWarningMessage("Não foi possível copiar o comando.");
  }
}
</script>

<template>
  <div class="settings">
    <section class="settings-group" aria-labelledby="settings-general">
      <h2 id="settings-general" class="settings-title">Geral</h2>
      <div class="settings-item">
        <div class="settings-row">
          <div class="settings-text">
            <h3 id="settings-keybindings" class="settings-label">Atalhos de teclado</h3>
            <p class="settings-hint">Veja e personalize os atalhos de cada comando.</p>
          </div>
          <button
            class="settings-button"
            aria-labelledby="settings-keybindings"
            @click="openKeybindingsPage()"
          >
            <Icon name="lucide:keyboard" class="size-3.5" />
            Abrir
          </button>
        </div>
      </div>
      <div class="settings-item">
        <div class="settings-row">
          <div class="settings-text">
            <h3 id="settings-autosave" class="settings-label">Salvar automaticamente</h3>
            <p class="settings-hint">
              Salva os arquivos do projeto logo depois de cada alteração, e ao sair da janela.
            </p>
          </div>
          <SwitchRoot
            v-model="autosave"
            class="settings-switch"
            aria-labelledby="settings-autosave"
          >
            <SwitchThumb class="settings-thumb" />
          </SwitchRoot>
        </div>
      </div>
    </section>

    <section class="settings-group" aria-labelledby="settings-agents">
      <h2 id="settings-agents" class="settings-title">Agentes</h2>
      <div class="settings-item">
        <div class="settings-row">
          <div class="settings-text">
            <h3 id="settings-mcp" class="settings-label">Servidor MCP</h3>
            <p class="settings-hint">
              Deixa agentes, como o Claude Code, usar as ferramentas do Lenz enquanto esta aba
              estiver aberta.
            </p>
          </div>
          <SwitchRoot v-model="enabled" class="settings-switch" aria-labelledby="settings-mcp">
            <SwitchThumb class="settings-thumb" />
          </SwitchRoot>
        </div>

        <template v-if="enabled">
          <p class="settings-status" :data-status="mcpStatus" role="status">
            <span class="settings-dot" aria-hidden="true" />
            {{ STATUS[mcpStatus] }}
          </p>
          <p class="settings-hint">
            Precisa do programa <code>lenz-mcp</code> em execução. Para o Claude Code:
          </p>
          <div class="settings-command">
            <code>{{ command }}</code>
            <button
              class="settings-copy"
              title="Copiar o comando"
              aria-label="Copiar o comando"
              @click="copyCommand"
            >
              <Icon name="lucide:copy" class="size-3.5" />
            </button>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<style>
.settings {
  @apply flex flex-col gap-1 pb-3 text-[13px];
}
.settings-title {
  @apply m-0 px-3 pt-3 pb-1 text-[11px] font-semibold tracking-wide text-[var(--ide-fg-muted)] uppercase;
}
.settings-item {
  @apply flex flex-col gap-2 border-b border-[var(--ide-border)] px-3 py-2.5;
}
.settings-row {
  @apply flex items-start justify-between gap-3;
}
.settings-text {
  @apply flex min-w-0 flex-col gap-0.5;
}
.settings-label {
  @apply m-0 text-[13px] font-medium;
}
.settings-hint {
  @apply m-0 text-[12px] leading-snug text-[var(--ide-fg-muted)];
}
.settings-button {
  @apply flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-[var(--ide-border)] bg-transparent px-2.5 py-1 text-[12px] text-inherit outline-none hover:bg-[var(--ide-hover)] focus-visible:ring-2 focus-visible:ring-[var(--ide-accent)];
}
.settings-switch {
  @apply relative mt-0.5 h-5 w-9 shrink-0 cursor-pointer rounded-full border-0 bg-white/20 p-0 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ide-accent)] data-[state=checked]:bg-[var(--ide-accent)];
}
.settings-thumb {
  @apply block size-4 translate-x-0.5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-[18px];
}
.settings-status {
  @apply m-0 flex items-center gap-2 text-[12px];
}
.settings-dot {
  @apply size-2 shrink-0 rounded-full bg-[var(--ide-fg-muted)];
}
.settings-status[data-status="connected"] .settings-dot {
  @apply bg-green-500;
}
.settings-status[data-status="connecting"] .settings-dot {
  @apply bg-amber-500;
}
.settings-command {
  @apply flex items-start gap-1 rounded-md border border-[var(--ide-border)] bg-black/20 p-2;
}
.settings-command code {
  @apply flex-1 text-[12px] break-all;
}
.settings-copy {
  @apply flex cursor-pointer items-center justify-center rounded border-0 bg-transparent p-1 text-inherit outline-none hover:bg-white/10;
}
</style>
