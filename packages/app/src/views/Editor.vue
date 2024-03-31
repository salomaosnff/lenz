<script setup lang="ts">
import AppPanel from '@/components/AppPanel.vue';
import AppTabs from '@/components/AppTabs.vue';
import CommandPalete from '@/components/CommandPalete.vue';
import EditorToolbar from '@/components/EditorToolbar.vue';
import { useInternal } from '@/composables/lenz';
import type { Window as NwWindow } from 'nw.gui'
import { nextTick } from 'vue';
import type { ExtensionItem } from 'lenz/internal';

const lenz = useInternal()

const win = nw.Window.get(window);

nw.Window.open('splash.html', {
  width: 480,
  height: 200,
  frame: false,
  position: 'center',
}, (w: NwWindow) => {
  w.setPosition('center')
  w.setResizable(false)
  w.setAlwaysOnTop(true)
  w.setShowInTaskbar(false)

  w.on('loaded', () => {
    w.show()

    function onExtensionLoad(e: ExtensionItem) {
      window.postMessage({
        type: 'load',
        extension: e.meta.name ?? e.meta.id,
      }, '*');
    }

    function onStarted() {
      lenz.extensions.off('prepare', onExtensionLoad);

      w.close();
      win.show();
    }

    lenz.extensions.on('prepare', onExtensionLoad);
    lenz.extensions.once('start', onStarted);

    nextTick(() => lenz.extensions.start())
  });
})


</script>

<template>
  <div class="flex w-full h-full overflow-hidden" :class="$style['app']">
    <EditorToolbar />
    <AppTabs />

    <AppPanel panel-id="main" class="app-pattern" />

    <AppPanel panel-id="properties" class="bg--background" />
    <CommandPalete class="theme-vars--dark" />
  </div>
</template>

<style module lang="scss">
.app {
  display: grid;
  grid-template-columns: 1fr 320px;
  grid-template-rows: 48px 1fr;

  &-pattern {
    background-color: var(--color-background);
    opacity: 0.8;
    background-image: repeating-linear-gradient(45deg, var(--color-surface) 25%, transparent 25%, transparent 75%, var(--color-surface) 75%, var(--color-surface)), repeating-linear-gradient(45deg, var(--color-surface) 25%, var(--color-background) 25%, var(--color-background) 75%, var(--color-surface) 75%, var(--color-surface));
    background-position: 0 0, 16px 16px;
    background-size: 32px 32px;
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
</style>./components/AppTabContent.vue