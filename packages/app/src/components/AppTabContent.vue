<script setup lang="ts">
import { useViewStore } from '@/store/views';
import AppView from './AppView.vue';
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    tabId: string;
  }>(),
  { tabId: 'default' },
);

const viewStore = useViewStore();
const views = computed(() => {
  if (props.tabId === 'default') {
    return viewStore.views.filter((view) => view.meta.tab === 'default' || !view.meta.tab);
  }

  return viewStore.views.filter((view) => view.meta.tab === props.tabId);
});
</script>
<template>
  <div class="flex flex-col">
    <AppView
      v-for="view in views"
      :key="view.meta.id"
      :view="view"
    />
  </div>
</template>