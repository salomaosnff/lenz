<script setup lang="ts">
import gsap from "gsap";

const commandStore = useCommandsStore();
const hotkeyStore = useHotKeysStore();

const query = ref("");
const allCommands = computed(() => {
  return Array.from(Object.values(commandStore.commands))
    .filter((command) => command.name)
    .map((command) => {
      return {
        key: hotkeyStore.commandToHotKey.get(command.id),
        command,
        frequency: commandStore.getFrequency(command.id),
      };
    })
    .sort((a, b) => {
      let scoreA = a.frequency;
      let scoreB = b.frequency;

      if (a.command.description) {
        scoreA *= 10;
      }

      if (b.command.description) {
        scoreB *= 10;
      }

      if (a.command.icon) {
        scoreA *= 11;
      }

      if (b.command.icon) {
        scoreB *= 11;
      }

      if (a.key) {
        scoreA *= 11;
      }

      if (b.key) {
        scoreB *= 11;
      }

      return scoreB - scoreA;
    });
});

const filteredCommands = computed(() => {
  const search = query.value.toLowerCase().trim();

  if (!search) {
    return allCommands.value;
  }

  return allCommands.value.filter((entry) => {
    return (
      entry.command &&
      (entry.command.name?.toLowerCase()?.includes(search) ||
        entry.command.description?.toLowerCase()?.includes(search))
    );
  });
});

const element = ref<HTMLElement>();

onClickOutside(element, () => {
  commandStore.showCommands = false;
});

const selectedIndex = ref(-1);
const results = ref<HTMLElement[]>();

watchEffect(() => {
  if (!results.value) {
    return;
  }

  if (selectedIndex.value < 0) {
    selectedIndex.value = results.value.length - 1;
    return;
  }

  if (selectedIndex.value >= results.value.length) {
    selectedIndex.value = 0;
  }

  if (selectedIndex.value >= 0 && results.value) {
    results.value[selectedIndex.value]?.scrollIntoView({
      block: "nearest",
    });
  }
});

function onBeforeEnter(el: any) {
  el.style.opacity = "0";
  el.style.height = "0";
  el.style.transform = "translateX(0rem)"
}

function onEnter(el: any, done: any) {
  gsap.to(el, {
    opacity: 1,
    height: "auto",
    transform: "translateX(0rem)",
    // delay: el.dataset.index * 0.0125,
    onComplete: done,
  });
}

function onLeave(el: any, done: any) {
  gsap.to(el, {
    opacity: 0,
    height: "0",
    transform: "translateX(-4rem)",
    // delay: el.dataset.index * 0.0125,
    onComplete: done,
  });
}
</script>
<template>
  <Transition>
    <div
      v-if="commandStore.showCommands"
      class="app-hotkeys-pallete w-full max-w-768px translate-x--50% left-50% pa-4"
      @keydown.esc="commandStore.showCommands = false"
      @keydown.arrow-down="selectedIndex++"
      @keydown.arrow-up="selectedIndex--"
      @keydown.enter="
        selectedIndex > 0 &&
          ((commandStore.showCommands = false),
          commandStore.executeCommand(
            filteredCommands[selectedIndex].command.id
          ))
      "
    >
      <AppPanel ref="element" class="flex flex-col overflow-clip">
        <h1 class="text-6">Paleta de comandos</h1>
        <UiTextField
          v-model="query"
          type="search"
          autofocus
          class="w-full mt-4"
          placeholder="Pesquisar comandos..."
          @focus="selectedIndex = -1"
        />
        <TransitionGroup
          tag="ul"
          :css="false"
          class="overflow-y-auto flex-1 max-h-100 pr-2"
          @before-enter="onBeforeEnter"
          @enter="onEnter"
          @leave="onLeave"
        >
          <li
            v-for="({ key, command }, index) of filteredCommands"
            :key="command.id"
            ref="results"
            :data-index="index"
            class="overflow-hidden mb-1"
            @click="
              commandStore.executeCommand(command.id),
                (commandStore.showCommands = false)
            "
          >
            <div
              class="flex gap-2 rounded-md pa-2 cursor-pointer hover:bg--surface-muted items-center w-full"
              :class="{ 'bg--surface-muted': selectedIndex === index }"
            >
              <UiIcon
                :path="command.icon ?? ''"
                class="block !w-8 !h-8 self-start mt-0.5"
              />
              <div class="flex-1">
                <p>
                  {{ command.name }}
                </p>
                <p class="text-3 fg--muted">{{ command.description }}</p>
              </div>
              <UiKbd v-if="key" class="text-3 py-1 ml-2">{{ key }}</UiKbd>
            </div>
          </li>
        </TransitionGroup>
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
