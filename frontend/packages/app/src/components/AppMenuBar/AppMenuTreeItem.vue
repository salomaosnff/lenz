<script setup lang="ts">

const props = defineProps<{
    title: string;
    command?: string
}>()
const hotkeyStore = useHotKeysStore();
const commandStore = useCommandsStore();
const hotKey = computed(() => props.command ? hotkeyStore.getHotKey(props.command) : null)
</script>
<template>
  <UiMenuItem @click="props.command && commandStore.executeCommand(props.command)">
    <p>{{ title }}</p>
    <template v-if="hotKey" #right>
      <UiKbd>{{ hotKey }}</UiKbd>
    </template>
  </UiMenuItem>
</template>
