<script setup lang="ts">
import { useViewStore } from '@/store/views';
import { ref, triggerRef, watch } from 'vue';

const props = defineProps<{
  viewId: string;
}>();

const viewStore = useViewStore();
const view = ref(viewStore.viewMap.get(props.viewId));

watch(() => viewStore.viewMap, () => {
  const v = viewStore.viewMap.get(props.viewId);
  view.value = v;
  triggerRef(view);
});

</script>
<template>
  <div
    v-if="view"
    :class="$style['app-view']"
  >
    <div
      class="uppercase text-3 px-2 py-1 cursor-pointer hover:bg--surface"
      :style="$style['app-view__header']"
      @click="viewStore.toggleView(view.meta.id)"
    >
      {{ view.meta.name ?? 'Sem título' }}
    </div>
    <div
      v-show="view.isVisible"
      :ref="(el: any) => viewStore.setViewRef(viewId, el)"
      class="px-2"
      :class="$style['app-view__content']"
    />
  </div>
  <div
    v-else
    class="text-red"
  >
    View "{{ viewId }}"" not found
  </div>
</template>

<style module lang="scss">
.app-view {
  border-bottom: 1px solid var(--color-surface);
}
</style>