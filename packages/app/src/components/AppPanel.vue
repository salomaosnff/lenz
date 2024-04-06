<script setup lang="ts">
import { computed } from 'vue';
import { useViewStore } from '../store/views';
import AppView from './AppView.vue';

const props = defineProps<{
  panelId: string;
}>();

const viewStore = useViewStore();
const views = computed(() => Array.from(viewStore.viewMap.values()).filter(v => v.panelId === props.panelId));
</script>
<template>
  <div class="flex flex-col">
    <AppView
      v-for="view in views"
      :key="view.meta.id"
      :view-id="view.meta.id"
    />
  </div>
</template>