<script setup lang="ts">
import { useMenuBarStore } from "../../store/menubar";
import AppMenuTree from "./AppMenuTree.vue";

const menuBarStore = useMenuBarStore();

</script>
<template>
  <UiMenuBar class="app-menubar">
    <template v-for="item in menuBarStore.menuItems">
      <AppMenuTree
        v-if="(!item.type || item.type === 'item') && item.children?.length"
        :key="item.title"
        :title="item.title"
        :items="item.children"
      />
    </template>
  </UiMenuBar>
</template>