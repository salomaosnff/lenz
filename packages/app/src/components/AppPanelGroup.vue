<script setup lang="ts">
import { useViewStore } from '@/store/views';
import { computed, ref } from 'vue';
import AppIcon from './AppIcon.vue';
import AppPanel from './AppPanel.vue';

const props = withDefaults(
  defineProps<{
    group: string;
  }>(),
  { group: 'right' },
);

const viewStore = useViewStore();
const panels = computed(() => viewStore.panelGroups[props.group] ?? []);
const activePanel = ref(panels.value[0]);
</script>
<template>
  <div>
    <div class="flex">
      <button
        v-for="panel in panels"
        :key="panel.id"
        class="w-12 h-12 flex items-center justify-center block"
        :title="panel.name"
        @click="activePanel = panel"
      >
        <AppIcon
          v-if="panel.icon"
          class="w-6 h-6"
          :icon="panel.icon"
          :fill="activePanel.id === panel.id ? 'yellow' : 'white'"
        />
      </button>
    </div>
    <p class="uppercase opacity-50 pa-2">
      {{ activePanel.name }}
    </p>
    <AppPanel :panel-id="activePanel.id" />
  </div>
</template>