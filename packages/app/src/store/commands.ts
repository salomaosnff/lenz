import type { Command, Disposable, ExtensionMetadata } from '@editor/core';
import { defineStore } from 'pinia';
import { computed, onBeforeUnmount, reactive } from 'vue';

const {
  EventHost,
  CommandHost,
} = require('@editor/core');

export interface CommandItem extends Command {
  extension: ExtensionMetadata
}

export const useCommandsStore = defineStore('commands', () => {
  const disposers = new Set<Disposable>();
  const commandMap = reactive(new Map()) as Map<string, CommandItem>;
  const commands = computed(() => {
    function calculateScore(item: CommandItem) {
      let score = 1;

      if (item.title) {
        score *= 2;
      }

      if (item.description) {
        score *= 3;
      }

      if (item.icon) {
        score *= 4;
      }

      return score;
    }

    return Array.from(commandMap.values()).sort((a, b) => calculateScore(b) - calculateScore(a));
  });

  disposers.add(
    EventHost.on('@app/commands:init', (command) => {
      commandMap.set(command.id, command);
    }),
  );

  disposers.add(
    EventHost.on('@app/commands:remove', (id) => {
      commandMap.delete(id);
    }),
  );

  onBeforeUnmount(() => {
    for (const disposer of disposers) {
      disposer.dispose();
    }
  });

  return {
    commands,
    execute: CommandHost.execute,
  };
});