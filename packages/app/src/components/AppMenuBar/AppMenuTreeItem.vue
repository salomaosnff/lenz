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
  dispose(): void;
};

if (props.icon) {
  menubar.countIcons.value++;
}
</script>
<template>
  <UiMenuItem
    :icon
    @click="
      menubar.dispose(),
        props.command && commandStore.executeCommand(props.command)
    "
  >
    <p>{{ title }}</p>
    <template v-if="hotKey" #right>
      <UiKbd>{{ hotKey }}</UiKbd>
    </template>
  </UiMenuItem>
</template>
