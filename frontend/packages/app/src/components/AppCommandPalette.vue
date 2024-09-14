<script setup lang="ts">
const commandsStore = useCommandsStore();
const search = ref("");

window.addEventListener("keydown", (event) => {
  const isInputActive = document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA";

  if (event.key === "F1") {
    event.preventDefault();
    event.stopImmediatePropagation();
    
    if (!isInputActive) {
      commandsStore.showCommands = !commandsStore.showCommands;
    }
  }
});

const commandPalette = ref<HTMLElement>();

onClickOutside(commandPalette, () => {
  commandsStore.showCommands = false;
});

const filteredCommands = computed(() => {
  const query = search.value.toLowerCase();

  return Object.values(commandsStore.commands).filter(
    (command) =>
      command.name.toLowerCase().includes(query) ||
      command.description.toLowerCase().includes(query)
  );
});
</script>
<template>
  <Transition>
    <AppPanel
      v-if="commandsStore.showCommands"
      ref="commandPalette"
      class="app-command-palette bg--surface rounded-md flex flex-col gap-2 z-1"
    >
      <UiTextField
        :ref="(input: any) => input?.focus()"
        v-model="search"
        label="Paleta de comandos"
        hide-messages
        autofocus
        placeholder="Pesquisar comandos..."
        @keyup.esc="commandsStore.showCommands = false"
      />
      <ul class="max-h-100 overflow-y-scroll pr-2">
        <template v-for="command in filteredCommands" :key="command.id">
          <UiMenuItemSeparator />
          <li
            class="app-cmd-palette__item pa-2 hover:bg--surface-muted cursor-pointer flex gap-3 items-start rounded-md"
            @click="commandsStore.executeCommand(command.id), (commandsStore.showCommands = false)"
          >
            <UiIcon :path="command.icon ?? ''" class="!w-6 !h-6" />
            <div>
              <p>{{ command.name }}</p>
              <p class="text-3 fg--muted">{{ command.description }}</p>
            </div>
          </li>
        </template>
      </ul>
    </AppPanel>
  </Transition>
</template>
<style lang="scss">
.app-command-palette {
  box-shadow: 0 0 0 150vmax rgba(0, 0, 0, 0.5);

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
