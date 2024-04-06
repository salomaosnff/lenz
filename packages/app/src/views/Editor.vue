<script setup lang="ts">
import AppPanel from '@/components/AppPanel.vue';
import AppPanelGroup from '@/components/AppPanelGroup.vue';
import CommandPalete from '@/components/CommandPalete.vue';
import EditorToolbar from '@/components/EditorToolbar.vue';
import { useInternal } from '@/composables/lenz';
import type { ExtensionItem } from 'lenz/internal';
import type { Window as NwWindow } from 'nw.gui';
import { nextTick } from 'vue';

const lenz = useInternal();

const win = nw.Window.get(window);

(nw.Window as any).open(
  'splash.html',
  {
    width: 480,
    height: 200,
    frame: false,
    position: 'center',
  },
  (w: NwWindow) => {
    w.setPosition('center');
    w.setResizable(false);
    w.setAlwaysOnTop(true);
    w.setShowInTaskbar(false);

    w.on('loaded', () => {
      w.show();

      function onExtensionLoad(e: ExtensionItem) {
        window.postMessage(
          {
            type: 'load',
            extension: e.meta.name ?? e.meta.id,
          },
          '*',
        );
      }

      function onStarted() {
        lenz.extensions.off('prepare', onExtensionLoad);

        w.close();
        win.show();
      }

      lenz.extensions.on('prepare', onExtensionLoad);
      lenz.extensions.once('start', onStarted);

      nextTick(() => lenz.extensions.start());
    });
  },
);
</script>

<template>
  <div
    class="flex w-full h-full overflow-hidden"
    :class="$style['app']"
  >
    <EditorToolbar />

    <AppPanel
      panel-id="main"
      :class="[$style['app-pattern'], $style['app-panel-main']]"
    />

    <AppPanelGroup
      group="right"
      :class="$style['app-panel-right']"
    />

    <CommandPalete class="theme-vars--dark" />
  </div>
</template>

<style module lang="scss">
.app {
  display: grid;
  grid-template-areas: 'toolbar right'
                       'main right';

  grid-template-columns: 1fr 300px;
  grid-template-rows: 48px 1fr;

  &-pattern {
    background-color: var(--color-background);
    opacity: 0.8;
    background-image: repeating-linear-gradient(
        45deg,
        var(--color-surface) 25%,
        transparent 25%,
        transparent 75%,
        var(--color-surface) 75%,
        var(--color-surface)
      ),
      repeating-linear-gradient(
        45deg,
        var(--color-surface) 25%,
        var(--color-background) 25%,
        var(--color-background) 75%,
        var(--color-surface) 75%,
        var(--color-surface)
      );
    background-position: 0 0, 16px 16px;
    background-size: 32px 32px;
  }

  &-panel {
    &-right {
      grid-area: right;
    }
  }

  &-panel-main {
    grid-area: main;
  }
}

::-webkit-scrollbar {
  width: 0.5rem;
  height: 0.5rem;

  &-thumb {
    background-color: var(--color-scroll-thumb);
    border-radius: 4px;
  }
}
</style>
