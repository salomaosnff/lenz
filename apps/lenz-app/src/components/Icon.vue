<script setup lang="ts">
import { computed } from "vue";
import { Icon } from "@iconify/vue/dist/offline";
import { iconsReady } from "@/icons";

const props = defineProps<{
  /** `prefix:name`, e.g. `lucide:file-text`. Without a prefix, `lucide:` is assumed. */
  name: string;
}>();

const icon = computed(() => (props.name.includes(":") ? props.name : `lucide:${props.name}`));

// The icon set is registered offline (see src/icons.ts), so nothing is fetched. Until it is
// there the icon has nothing to draw and renders no element, which the `class` given to this
// component could not be passed on to (Vue warns): a blank box takes its place.
</script>

<template>
  <Icon v-if="iconsReady" :icon="icon" />
  <span v-else class="inline-block" aria-hidden="true" />
</template>
