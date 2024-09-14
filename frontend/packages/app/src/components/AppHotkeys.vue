<script setup lang="ts">
const commandStore = useCommandsStore();
const hotkeyStore = useHotKeysStore();

const query = ref("");
const allShortcuts = computed(() => {
  return Array.from(hotkeyStore.hotKeyToCommand.entries())
    .map(([key, value]) => {
      return {
        key,
        command: commandStore.getCommand(value),
      };
    })
    .filter((shortcut) => shortcut.command);
});

const filteredShortcuts = computed(() => {
  const search = query.value.toLowerCase().trim();

  if (!search) {
    return allShortcuts.value;
  }

  return allShortcuts.value.filter((shortcut) => {
    return (
      shortcut.key.toLowerCase().includes(search) ||
      shortcut.command.name?.toLowerCase()?.includes(search) ||
      shortcut.command.description?.toLowerCase()?.includes(search)
    );
  });
});

const element = ref<HTMLElement>();
const hotkeysStore = useHotKeysStore();

onClickOutside(element, () => {
  hotkeysStore.showHotKeys = false;
});
</script>
<template>
  <Transition>
    <div
      v-if="hotkeysStore.showHotKeys"
      class="app-hotkeys-pallete w-full max-w-768px translate-x--50% left-50% pa-4"
      @keydown.esc="hotkeysStore.showHotKeys = false"
    >
      <AppPanel ref="element" class="flex flex-col">
        <h1 class="text-6">Atalhos de teclado</h1>
        <UiTextField
          v-model="query"
          type="search"
          autofocus
          class="w-full mt-4"
          placeholder="Pesquisar atalhos..."
        />
        <div class="overflow-y-auto flex-1 max-h-100">
          <table>
            <thead>
              <tr>
                <th class="text-left w-full pa-2">Comando</th>
                <th class="pa-2">Atalho</th>
              </tr>
            </thead>
            <tr
              v-for="{ key, command } of filteredShortcuts"
              :key="key"
              class="hover:bg--surface-muted"
            >
              <td class="pa-2 rounded-l-md">
                <p>{{ command.name }}</p>
                <p class="text-3 fg--muted">{{ command.description }}</p>
              </td>
              <td class="text-nowrap pa-2 rounded-r-md">
                <UiKbd class="text-4 py-2">{{ key }}</UiKbd>
              </td>
            </tr>
          </table>
        </div>
      </AppPanel>
    </div>
  </Transition>
</template>
<style lang="scss">
.app-hotkeys-pallete {
  & > .app-panel {
    box-shadow: 0 0 0 150vmax rgba(0, 0, 0, 0.5);
  }

  &.v-enter-active,
  &.v-leave-active {
    transition: all 0.3s;
  }

  &.v-enter-from,
  &.v-leave-to {
    opacity: 0;
    transform: translate(-50%, -100%);
  }
}
</style>
