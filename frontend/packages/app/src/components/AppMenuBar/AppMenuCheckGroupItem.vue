<script setup lang="ts">
import { MenuItemCheckbox, MenuItemRadioGroupItem } from "../../store/menubar";

const props = defineProps<{
  item: MenuItemCheckbox | MenuItemRadioGroupItem;
  radio: boolean;
  onUpdate: (value: any) => void;
  getValue: () => any
}>();

const hotkeyStore = useHotKeysStore();
const commandStore = useCommandsStore();
const hotKey = computed(() =>
  props.item.command ? hotkeyStore.getHotKey(props.item.command) : null
);
</script>
<template>
  <UiMenuItem
    :check="getValue()"
    :checked-value="item.checkedValue"
    :unchecked-value="(item as MenuItemCheckbox).uncheckedValue"
    :check-modifiers="{ radio: radio as true }"
    @update:check="onUpdate"
    @click.stop="item.command && commandStore.executeCommand(item.command)"
  >
    <p>{{ item.title }}</p>
    <template v-if="hotKey" #right>
      <UiKbd>{{ hotKey }}</UiKbd>
    </template>
  </UiMenuItem>
</template>
