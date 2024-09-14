<script setup lang="ts">
import { MenuItem } from "../../store/menubar";
import AppMenuTreeItem from "./AppMenuTreeItem.vue";

defineProps<{
  title: string;
  items: MenuItem[];
}>();
</script>
<template>
  <UiMenuGroup>
    <template #title>{{ title }}</template>
    <template
      v-for="(item, i) of items"
      :key="item.type === 'item' ? item.title : `item-${i}`"
    >
      <UiMenuItemSeparator v-if="item.type === 'separator'" />
      <template
        v-else-if="
          item.type === 'checkbox-group' || item.type === 'radio-group'
        "
      >
        <p v-if="item.title" class="fg--muted uppercase text-3 mb-1">{{ item.title }}</p>
        <AppMenuCheckGroupItem
          v-for="check in item.items"
          :key="check.title"
          :item="check"
          :radio="item.type === 'radio-group'"
          :get-value="item.getValue ?? (() => null)"
          :on-update="item.onUpdated ?? (() => {})"
        />
      </template>
      <AppMenuTree
        v-else-if="item.children?.length"
        :title="item.title"
        :items="item.children"
      />
      <AppMenuTreeItem v-else :title="item.title" :command="item.command" />
    </template>
  </UiMenuGroup>
</template>
