<script setup lang="ts">
const props = defineProps<{
  title: string;
  command?: string;
  icon?: string;
}>();

const hotkeyStore = useHotKeysStore();
const commandStore = useCommandsStore();
const hotKey = computed(() =>
  props.command ? hotkeyStore.getHotKey(props.command) : null
);

const menubar = inject("menu-group") as {
  currentItem: Ref<string | undefined>;
  countIcons: Ref<number>;
  hasIcons: ComputedRef<boolean>;
};

if (props.icon) {
  menubar.countIcons.value++;
}
</script>
<template>
  <UiMenuItem
    :icon
    @click="props.command && commandStore.executeCommand(props.command), menubar.currentItem.value = undefined"
  >
    <p>{{ title }}</p>
    <template v-if="hotKey" #right>
      <UiKbd>{{ hotKey }}</UiKbd>
    </template>
  </UiMenuItem>
</template>
