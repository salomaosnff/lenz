<script setup lang="ts">
import {
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRoot,
  MenubarSeparator,
  MenubarTrigger,
} from "reka-ui";
import { useEventListener } from "@vueuse/core";
import { computed } from "vue";
import PromptHost from "./prompts/PromptHost.vue";
import KeyHint from "./keybindings/KeyHint.vue";
import NotificationHost from "./notifications/NotificationHost.vue";
import EditorArea from "./editor/EditorArea.vue";
import { useEditorStore } from "./editor/store";
import EditorLayout from "./layout/EditorLayout.vue";
import { useLayoutStore } from "./layout/store";
import { registerDefaultViews } from "./layout/views";
import { registerBuiltinCommands } from "./commands/builtin";
import { executeCommand } from "./commands";
import { aboutOpen } from "./commands/dialogs";
import { keybindingsFor } from "./keybindings";

registerDefaultViews();
registerBuiltinCommands();

const layout = useLayoutStore();
const editor = useEditorStore();

// The browser can close the page whatever the shortcuts do (Ctrl+W, the tab's close button):
// with unsaved changes, it is asked to confirm first.
useEventListener(window, "beforeunload", (event) => {
  if (editor.tabs.some((tab) => editor.isDirty(tab))) {
    event.preventDefault();
    event.returnValue = "";
  }
});

/** An item runs a command (and shows its shortcut) or, for the panels, a plain action. */
type MenuEntry = { label: string; action?: () => void; command?: string } | "separator";

const shortcutOf = (item: Exclude<MenuEntry, "separator">) =>
  item.command ? keybindingsFor(item.command)[0] : undefined;
const runItem = (item: Exclude<MenuEntry, "separator">) =>
  item.command ? executeCommand(item.command) : item.action?.();

const menus = computed<{ label: string; items: MenuEntry[] }[]>(() => [
  {
    label: "Arquivo",
    items: [
      { label: "Novo arquivo", command: "file.new" },
      { label: "Abrir arquivo…", command: "file.open" },
      "separator",
      { label: "Salvar", command: "file.save" },
      { label: "Salvar tudo", command: "file.saveAll" },
      "separator",
      { label: "Fechar o editor", command: "file.close" },
      { label: "Fechar todos os editores", command: "file.closeAll" },
    ],
  },
  {
    label: "Editar",
    items: [
      { label: "Desfazer", command: "edit.undo" },
      { label: "Refazer", command: "edit.redo" },
    ],
  },
  {
    label: "Visualizar",
    items: [
      { label: "Paleta de comandos…", command: "workbench.commandPalette" },
      { label: "Atalhos de teclado", command: "workbench.keybindings" },
      "separator",
      { label: "Alternar a barra lateral", command: "view.toggleSidebar" },
      { label: "Alternar o painel de propriedades", command: "view.toggleSecondarySidebar" },
      { label: "Restaurar o layout das views", command: "view.resetViews" },
      "separator",
      ...layout.orderedContainers
        .filter((c) => (c.location ?? "top") === "top")
        .map<MenuEntry>((c) => ({
          label: c.title,
          action: () => layout.toggleContainer(c.id),
        })),
    ],
  },
  {
    label: "Ajuda",
    items: [{ label: "Sobre o Lenz", command: "help.about" }],
  },
]);
</script>

<template>
  <div class="h-screen flex flex-col bg-[var(--ide-frame-bg)] text-[var(--ide-fg)]">
    <MenubarRoot class="menubar">
      <img src="/favicon.ico" alt="" class="menubar-logo" />
      <MenubarMenu v-for="menu in menus" :key="menu.label">
        <MenubarTrigger class="menubar-trigger">{{ menu.label }}</MenubarTrigger>
        <MenubarContent class="menubar-content" align="start" :side-offset="2" :align-offset="0">
          <template v-for="(item, i) in menu.items" :key="i">
            <MenubarSeparator v-if="item === 'separator'" class="menubar-separator" />
            <MenubarItem v-else class="menubar-item" @select="runItem(item)">
              <span>{{ item.label }}</span>
              <span v-if="shortcutOf(item)" class="menubar-shortcut">{{ shortcutOf(item) }}</span>
            </MenubarItem>
          </template>
        </MenubarContent>
      </MenubarMenu>
    </MenubarRoot>

    <EditorLayout class="!h-auto min-h-0 flex-1">
      <EditorArea />
    </EditorLayout>

    <NotificationHost />
    <PromptHost />
    <KeyHint />

    <Window v-model:open="aboutOpen" title="Sobre o Lenz" :height="200">
      <p class="font-semibold">Lenz</p>
      <p class="mt-1 text-[var(--ide-fg-muted)]">
        Editor visual de páginas HTML, extensível por extensões.
      </p>
    </Window>
  </div>
</template>

<style>
.menubar {
  @apply flex h-9 shrink-0 items-center border-b border-[var(--ide-border)] bg-[var(--ide-titlebar-bg)] px-3 text-[13px] text-[var(--ide-fg)] select-none;
}
.menubar-logo {
  @apply mr-2 size-4;
}
.menubar-trigger {
  @apply flex h-7 cursor-default items-center rounded-md border-0 bg-transparent px-2 text-inherit outline-none hover:bg-[var(--ide-hover)] data-[state=open]:bg-white/10;
}
.menubar-content {
  @apply z-50 min-w-56 rounded-lg border border-[var(--ide-menu-border)] bg-[var(--ide-menu-bg)] p-1.5 text-[13px] text-[var(--ide-fg)] shadow-[0_8px_24px_rgba(0,0,0,0.45)];
}
.menubar-item {
  @apply flex h-7 cursor-default items-center justify-between gap-8 rounded-md px-3 outline-none select-none data-[highlighted]:bg-[var(--ide-accent)] data-[highlighted]:text-white;
}
.menubar-shortcut {
  @apply text-[var(--ide-fg-muted)];
}
.menubar-item[data-highlighted] .menubar-shortcut {
  @apply text-white/80;
}
.menubar-separator {
  @apply mx-2 my-1 h-px bg-[var(--ide-border)];
}
</style>
