import { useInternal } from '@/composables/lenz';
import type { CommandRegistryItem } from 'lenz/internal';
import { defineStore } from 'pinia';
import { computed, customRef } from 'vue';

const lenz = useInternal();

export const useCommandsStore = defineStore('commands', () => {
  const commandMap = customRef((track, trigger) => {
    let value = lenz.commands.commandMap;

    lenz.commands.on('update', () => {
      value = lenz.commands.commandMap;
      trigger();
    });

    return {
      get() {
        track();
        return value;
      },
      set() {
        console.warn('commandMap is readonly');
      },
    };
  });

  const commands = computed(() => {
    function calculateScore(item: CommandRegistryItem) {
      let score = 1;

      if (item.meta.title) {
        score *= 2;
      }

      if (item.meta.description) {
        score *= 3;
      }

      if (item.meta.icon) {
        score *= 4;
      }

      return score;
    }

    return Array.from(commandMap.value.values()).sort((a, b) => calculateScore(b) - calculateScore(a));
  });

  return {
    commands,
    execute: (commandId: string, ...args: any[]) => lenz.commands.execute(commandId, ...args),
  };
});