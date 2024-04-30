<script setup lang="ts">
import { useViewStore } from '@/store/views';
import type { ViewState } from '@editor/core';
import { ref, watchEffect } from 'vue';

const props = defineProps<{
  view: ViewState;
}>();

const expanded = ref(true);

const viewStore = useViewStore();

watchEffect(() => {
  expanded.value = props.view.visible
})
</script>
<template>
  <div :class="$style['app-view']">
    <div
      class="uppercase text-3 px-2 py-1 cursor-pointer hover:bg--surface"
      :style="$style['app-view__header']"
      @click="viewStore.toggleView(view.meta.id)"
    >
      {{ view.meta.title ?? 'Sem título' }}
    </div>
    <div
      v-show="expanded"
      :ref="(el: any) => viewStore.setViewRef(view.meta.id, el)"
      class="px-2"
      :class="$style['app-view__content']"
    />
  </div>
</template>

<style module lang="scss">
.app-view {
  border-bottom: 1px solid var(--color-surface);
}
</style>