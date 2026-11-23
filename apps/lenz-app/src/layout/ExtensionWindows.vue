<script setup lang="ts">
import Window from "../components/Window.vue";
import { extensionWindows } from "../extensions";
import ContentHost from "./ContentHost.vue";
</script>

<template>
  <template v-for="entry in extensionWindows.values()" :key="entry.key">
    <Window
      v-if="entry.open"
      :title="entry.title"
      :open="true"
      :x="entry.x"
      :y="entry.y"
      :width="entry.width"
      :height="entry.height"
      @update:open="!$event && entry.close()"
    >
      <ContentHost :content="entry.content" />
    </Window>
  </template>
</template>
