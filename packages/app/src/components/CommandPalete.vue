<script setup lang="ts">
import { useCommandsStore } from '@/store/commands';
import { useMagicKeys, whenever } from '@vueuse/core';
import { computed, ref, watchEffect } from 'vue';
import AppIcon from './AppIcon.vue';

const commandsStore = useCommandsStore();
const search = ref('');
const items = computed(() => {
  if (!search.value) {
    return commandsStore.commands.filter((command) => command.meta.title);
  }

  return commandsStore.commands.filter((command) => command.meta.title?.toLowerCase().includes(search.value.toLowerCase().trim()));
});

const inputRef = ref<HTMLInputElement>();

const isVisible = ref(false);

const {
  Ctrl_P, Escape, 
} = useMagicKeys();

whenever(Ctrl_P, () => {
  search.value = '';
  isVisible.value = true;
});

whenever(() => isVisible.value && Escape.value, () => {
  isVisible.value = false;
  search.value = '';
});

watchEffect(() => inputRef.value?.focus());

</script>
<template>
  <Transition>
    <div
      v-if="isVisible"
      class="command-palette px-2 py-4 fixed inset-0 flex items-start justify-center z-10"
      @click="isVisible = false"
    >
      <div
        class="w-full max-w-120"
        @click.stop
      >
        <input
          ref="inputRef"
          v-model="search"
          placeholder="Digite um comando..."
          class="floating outline-none py-2 px-4 w-full block rounded-2 mb-1 fg--foreground"
        >
        <ul
          v-if="items.length"
          class="fg--foreground floating rounded-2 shadow-2 overflow-auto max-h-80"
        >
          <TransitionGroup>
            <li
              v-for="item in items"
              :key="item.meta.id"
              class="command-palette__item py-2 px-4 cursor-pointer hover:bg--surface flex gap-1 items-center"
              @click="commandsStore.execute(item.meta.id), isVisible = false"
            >
              <AppIcon
                v-if="item.meta.icon"
                :icon="item.meta.icon"
                class="w-7 h-7 inline-block mr-2"
                fill="white"
              />
              <div class="flex-1">
                <p>{{ item.meta.title }}</p>
                <p
                  v-if="item.meta.description"
                  class="opacity-50 text-3"
                >
                  {{ item.extension.meta.name ?? item.extension.meta.id }}: {{ item.meta.description }}
                </p>
              </div>
            </li>
          </TransitionGroup>
        </ul>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss">
.command-palette {  
  background: #0000007f;
  height: calc(100% + 2rem);

  &.v-enter-active,
  &.v-leave-active {
    transition: all 0.25s;
  }

  &.v-enter-from,
  &.v-leave-to {
    opacity: 0;
    transform: translateY(-1rem);
  }

  &__item {
    &.v-enter-active,
    &.v-leave-active,
    &.v-move {
      transition: all 0.25s;
    }

    &.v-leave-active {
      position: absolute;
    }

    &.v-enter-from,
    &.v-leave-to {
      opacity: 0;
    }

    & + & {
      border-top: 1px solid var(--color-surface);
    }
  }
}
</style>