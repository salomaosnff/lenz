<script setup lang="ts">
import CommandPalette from "../commands/CommandPalette.vue";
import ActivityBar from "./ActivityBar.vue";
import ExtensionWindows from "./ExtensionWindows.vue";
import FloatingViews from "./FloatingViews.vue";
import SideBar from "./SideBar.vue";
import StatusBar from "./StatusBar.vue";
import { useLayoutStore } from "./store";

const layout = useLayoutStore();

let start = { x: 0, width: 0 };

function onSashDown(e: PointerEvent) {
  start = { x: e.clientX, width: layout.sidebarWidth };
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
}

function onSashMove(e: PointerEvent) {
  if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) return;
  layout.setSidebarWidth(start.width + e.clientX - start.x);
}

// The right side bar grows to the left, so dragging left widens it.
function onSecondarySashDown(e: PointerEvent) {
  start = { x: e.clientX, width: layout.secondaryWidth };
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
}

function onSecondarySashMove(e: PointerEvent) {
  if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) return;
  layout.setSecondaryWidth(start.width - (e.clientX - start.x));
}
</script>

<template>
  <div class="editor-layout">
    <div class="editor-layout-main">
      <ActivityBar />
      <template v-if="layout.sidebarVisible">
        <div class="editor-layout-sidebar" :style="{ width: `${layout.sidebarWidth}px` }">
          <SideBar v-if="layout.activeContainer" :container="layout.activeContainer" />
        </div>
        <div
          class="sash"
          role="separator"
          aria-orientation="vertical"
          @pointerdown="onSashDown"
          @pointermove="onSashMove"
          @dblclick="layout.setSidebarWidth(260)"
        />
      </template>
      <main class="editor-layout-editor">
        <slot />
      </main>
      <template v-if="layout.secondaryVisible && layout.secondaryContainer">
        <div
          class="sash"
          role="separator"
          aria-orientation="vertical"
          @pointerdown="onSecondarySashDown"
          @pointermove="onSecondarySashMove"
          @dblclick="layout.setSecondaryWidth(280)"
        />
        <div class="editor-layout-secondary" :style="{ width: `${layout.secondaryWidth}px` }">
          <SideBar :container="layout.secondaryContainer" label="Secondary Side Bar" />
        </div>
      </template>
    </div>
    <StatusBar />
    <FloatingViews />
    <CommandPalette />
    <ExtensionWindows />
  </div>
</template>

<style>
:root {
  --ide-frame-bg: #191a1b;
  --ide-bg: #121314;
  --ide-fg: #bfbfbf;
  --ide-fg-muted: #8c8c8c;
  --ide-border: #2a2b2c;
  --ide-hover: #ffffff0f;
  --ide-accent: var(--color-primary);
  --ide-radius: 8px;
  --ide-activitybar-bg: var(--ide-frame-bg);
  --ide-activitybar-fg: #ededed;
  --ide-activitybar-fg-inactive: #8c8c8c;
  --ide-sidebar-bg: var(--ide-frame-bg);
  --ide-statusbar-bg: var(--ide-frame-bg);
  --ide-tooltip-bg: #202122;
  --ide-titlebar-bg: var(--ide-frame-bg);
  --ide-menu-bg: #202122;
  --ide-menu-border: #333536;
}
body {
  @apply m-0 bg-[var(--ide-frame-bg)] text-[var(--ide-fg)];
}
.editor-layout {
  @apply flex h-screen w-screen flex-col overflow-hidden bg-[var(--ide-frame-bg)] text-[var(--ide-fg)];
}
.editor-layout-main {
  @apply flex min-h-0 flex-1;
}
.editor-layout-sidebar {
  @apply h-full shrink-0 overflow-hidden bg-[var(--ide-sidebar-bg)];
}
.editor-layout-secondary {
  @apply h-full shrink-0 overflow-hidden border-l border-[var(--ide-border)] bg-[var(--ide-sidebar-bg)];
}
.editor-layout-editor {
  @apply min-w-0 flex-1 overflow-auto;
}
/* Só quando a sidebar está visível; senão a borda da activity bar já separa. */
.sash + .editor-layout-editor {
  @apply border-l border-[var(--ide-border)];
}
.sash {
  @apply relative z-10 -mx-0.5 w-1 shrink-0 cursor-col-resize after:absolute after:inset-0 after:bg-transparent after:transition-colors after:delay-150 hover:after:bg-[var(--ide-accent)] active:after:bg-[var(--ide-accent)];
}
</style>
