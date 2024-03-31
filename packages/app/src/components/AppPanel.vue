<script setup lang="ts">
import AppView from './AppView.vue';
import { computed } from 'vue';
import { useViewStore } from '../store/views';

const props = withDefaults(
  defineProps<{
    panelId: string;
  }>(),
  { panelId: 'default' },
);

const viewStore = useViewStore();
const views = computed<any[]>(() => viewStore.getPanel(props.panelId)?.views);
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