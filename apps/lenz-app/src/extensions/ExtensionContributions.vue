<script setup lang="ts">
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from "reka-ui";
import { computed } from "vue";
import type { ExtensionManifest } from "lenz-sdk";

const props = defineProps<{ manifest?: ExtensionManifest }>();

const contributes = computed(() => props.manifest?.contributes ?? {});
const commands = computed(() => contributes.value.commands ?? []);
const keybindings = computed(() => contributes.value.keybindings ?? []);
const editors = computed(() => contributes.value.editors ?? []);
const containers = computed(() => contributes.value.viewsContainers?.activitybar ?? []);
const views = computed(() =>
  Object.entries(contributes.value.views ?? {}).flatMap(([container, list]) =>
    list.map((view) => ({ ...view, container })),
  ),
);

const total = computed(
  () =>
    commands.value.length +
    keybindings.value.length +
    editors.value.length +
    containers.value.length +
    views.value.length,
);

const commandTitle = (id: string) => commands.value.find((c) => c.command === id)?.title;
/** The panel's title when the view goes into one of this extension's own; else the container id. */
const containerTitle = (id: string) => containers.value.find((c) => c.id === id)?.title ?? id;

/** "when" in plain words, so a condition is readable without knowing the syntax. */
const whenText = (when?: string) => (when ? `Disponível quando ${when}` : "Sempre disponível");

const keyLabel = (key: string) =>
  key
    .split("+")
    .map((part) => (part === "Mod" ? "Ctrl/⌘" : part))
    .join(" + ");
</script>

<template>
  <p v-if="!total" class="text-[var(--ide-fg-muted)]">Esta extensão não contribui com nada.</p>

  <div v-else class="contrib">
    <CollapsibleRoot
      v-if="commands.length"
      as="section"
      :default-open="false"
      class="contrib-section"
      v-slot="{ open }"
    >
      <CollapsibleTrigger class="contrib-header">
        <Icon name="lucide:chevron-right" class="contrib-chevron" :class="{ 'rotate-90': open }" />
        <Icon name="lucide:terminal" />
        Comandos
        <span class="contrib-count">{{ commands.length }}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p class="contrib-intro">
          Ações que aparecem na paleta de comandos e podem receber atalhos.
        </p>
        <ul>
          <li v-for="command in commands" :key="command.command">
            <Icon :name="command.icon ?? 'lucide:terminal'" class="contrib-icon" />
            <div class="min-w-0 flex-1">
              <div class="contrib-label">
                <span v-if="command.category" class="contrib-category"
                  >{{ command.category }}:</span
                >
                {{ command.title }}
              </div>
              <code class="contrib-id">{{ command.command }}</code>
              <p class="contrib-description">
                Comando da paleta{{
                  command.category ? ` na categoria “${command.category}”` : ""
                }}. {{ whenText(command.when) }}.
              </p>
            </div>
          </li>
        </ul>
      </CollapsibleContent>
    </CollapsibleRoot>

    <CollapsibleRoot
      v-if="keybindings.length"
      as="section"
      :default-open="false"
      class="contrib-section"
      v-slot="{ open }"
    >
      <CollapsibleTrigger class="contrib-header">
        <Icon name="lucide:chevron-right" class="contrib-chevron" :class="{ 'rotate-90': open }" />
        <Icon name="lucide:keyboard" />
        Atalhos de teclado
        <span class="contrib-count">{{ keybindings.length }}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p class="contrib-intro">
          Teclas que executam um comando. “Ctrl/⌘” é Ctrl no Windows e Linux, e Cmd no Mac.
        </p>
        <ul>
          <li v-for="(binding, i) in keybindings" :key="i">
            <Icon name="lucide:keyboard" class="contrib-icon" />
            <div class="min-w-0 flex-1">
              <div class="contrib-label">
                <kbd class="contrib-kbd">{{ keyLabel(binding.key) }}</kbd>
                {{ commandTitle(binding.command) ?? binding.command }}
              </div>
              <code class="contrib-id">{{ binding.command }}</code>
              <p class="contrib-description">
                {{ whenText(binding.when) }}.
                <template v-if="binding.args?.length">
                  Argumentos: <code>{{ JSON.stringify(binding.args) }}</code
                  >.
                </template>
              </p>
            </div>
          </li>
        </ul>
      </CollapsibleContent>
    </CollapsibleRoot>

    <CollapsibleRoot
      v-if="editors.length"
      as="section"
      :default-open="false"
      class="contrib-section"
      v-slot="{ open }"
    >
      <CollapsibleTrigger class="contrib-header">
        <Icon name="lucide:chevron-right" class="contrib-chevron" :class="{ 'rotate-90': open }" />
        <Icon name="lucide:file-pen-line" />
        Editores
        <span class="contrib-count">{{ editors.length }}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p class="contrib-intro">
          Maneiras de abrir e editar arquivos, escolhidas pelo nome do arquivo.
        </p>
        <ul>
          <li v-for="editor in editors" :key="editor.id">
            <Icon :name="editor.icon ?? 'lucide:file-pen-line'" class="contrib-icon" />
            <div class="min-w-0 flex-1">
              <div class="contrib-label">
                {{ editor.label }}
                <span class="ext-badge">{{
                  editor.priority === "default" ? "Padrão" : "Opcional"
                }}</span>
              </div>
              <code class="contrib-id">{{ editor.id }}</code>
              <p class="contrib-description">
                Abre arquivos que combinam com
                <template v-for="(pattern, i) in editor.selector" :key="pattern"
                  ><code>{{ pattern }}</code
                  >{{ i < editor.selector.length - 1 ? ", " : "" }}</template
                >.
                {{
                  editor.priority === "default"
                    ? "É o editor com que esses arquivos abrem."
                    : "Fica como alternativa no seletor de editores do arquivo."
                }}
              </p>
            </div>
          </li>
        </ul>
      </CollapsibleContent>
    </CollapsibleRoot>

    <CollapsibleRoot
      v-if="containers.length"
      as="section"
      :default-open="false"
      class="contrib-section"
      v-slot="{ open }"
    >
      <CollapsibleTrigger class="contrib-header">
        <Icon name="lucide:chevron-right" class="contrib-chevron" :class="{ 'rotate-90': open }" />
        <Icon name="lucide:panel-left" />
        Painéis da barra de atividades
        <span class="contrib-count">{{ containers.length }}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p class="contrib-intro">
          Ícones na barra de atividades, cada um abrindo um painel com views.
        </p>
        <ul>
          <li v-for="container in containers" :key="container.id">
            <Icon :name="container.icon" class="contrib-icon" />
            <div class="min-w-0 flex-1">
              <div class="contrib-label">{{ container.title }}</div>
              <code class="contrib-id">{{ container.id }}</code>
              <p class="contrib-description">
                Painel com o ícone <code>{{ container.icon }}</code
                >.
                {{
                  views.filter((v) => v.container === container.id).length
                    ? `Contém ${views.filter((v) => v.container === container.id).length} view(s) desta extensão.`
                    : "Não tem views desta extensão."
                }}
              </p>
            </div>
          </li>
        </ul>
      </CollapsibleContent>
    </CollapsibleRoot>

    <CollapsibleRoot
      v-if="views.length"
      as="section"
      :default-open="false"
      class="contrib-section"
      v-slot="{ open }"
    >
      <CollapsibleTrigger class="contrib-header">
        <Icon name="lucide:chevron-right" class="contrib-chevron" :class="{ 'rotate-90': open }" />
        <Icon name="lucide:layout-panel-top" />
        Views
        <span class="contrib-count">{{ views.length }}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p class="contrib-intro">Seções dentro de um painel, cujo conteúdo a extensão fornece.</p>
        <ul>
          <li v-for="view in views" :key="view.id">
            <Icon name="lucide:layout-panel-top" class="contrib-icon" />
            <div class="min-w-0 flex-1">
              <div class="contrib-label">{{ view.name }}</div>
              <code class="contrib-id">{{ view.id }}</code>
              <p class="contrib-description">
                Fica no painel “{{ containerTitle(view.container) }}”.
                {{ view.collapsed ? "Começa recolhida." : "Começa expandida." }}
                {{ whenText(view.when) }}.
              </p>
            </div>
          </li>
        </ul>
      </CollapsibleContent>
    </CollapsibleRoot>
  </div>
</template>

<style>
.contrib-section {
  @apply mb-4;
}
.contrib-header {
  @apply flex w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-1 py-1.5 text-left text-base font-semibold text-[var(--ide-fg)] outline-none hover:bg-[var(--ide-hover)] focus-visible:bg-[var(--ide-hover)];
}
.contrib-chevron {
  @apply size-4 shrink-0 text-[var(--ide-fg-muted)] transition-transform;
}
.contrib-count {
  @apply rounded-full bg-[var(--ide-hover)] px-2 text-[11px] font-normal text-[var(--ide-fg-muted)];
}
.contrib-intro {
  @apply mt-1 mb-2 text-[13px] text-[var(--ide-fg-muted)];
}
.contrib li {
  @apply flex gap-3 border-t border-[var(--ide-border)] py-2.5;
}
.contrib-icon {
  @apply mt-0.5 size-5 shrink-0 text-[var(--ide-fg-muted)];
}
.contrib-label {
  @apply flex flex-wrap items-center gap-1.5 text-[14px] font-medium;
}
.contrib-category {
  @apply text-[var(--ide-fg-muted)];
}
.contrib-id {
  @apply font-mono text-[12px] text-[var(--ide-fg-muted)];
}
.contrib-description {
  @apply mt-0.5 text-[13px] text-[var(--ide-fg-muted)];
}
.contrib-description code {
  @apply rounded bg-[var(--ide-hover)] px-1 font-mono text-[12px];
}
.contrib-kbd {
  @apply rounded border border-[var(--ide-border)] bg-[var(--ide-hover)] px-1.5 py-px font-mono text-[12px];
}
</style>
