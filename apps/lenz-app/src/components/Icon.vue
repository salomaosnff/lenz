<script setup lang="ts">
import { computed } from "vue";
import { Icon } from "@iconify/vue/dist/offline";
import { iconsReady } from "@/icons";

const props = defineProps<{
  /** `prefix:name`, e.g. `lucide:file-text`. Without a prefix, `lucide:` is assumed. */
  name: string;
}>();

const icon = computed(() => (props.name.includes(":") ? props.name : `lucide:${props.name}`));
</script>

<template>
  <!-- The icon set is registered offline (see src/icons.ts), so nothing is fetched. -->
  <Icon :key="String(iconsReady)" :icon="icon" />
</template>
