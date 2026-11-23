<script setup lang="ts">
import Window from "../components/Window.vue";
import { useLayoutStore } from "./store";
import ViewHost from "./ViewHost.vue";

const layout = useLayoutStore();
</script>

<template>
  <!-- Closing the window puts the view back where it came from: its panel. -->
  <Window
    v-for="(view, index) in layout.floatingViews"
    :key="view.id"
    :title="view.title"
    :open="true"
    :offset="index * 32"
    :width="320"
    :height="260"
    flush
    @update:open="!$event && layout.closeFloatingView(view.id)"
  >
    <ViewHost :view="view" location="window" />
  </Window>
</template>
