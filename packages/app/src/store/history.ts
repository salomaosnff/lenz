import { defineStore } from "pinia";
import { reactive } from "vue";

import { History } from 'lenz:history';

export const useHistoryStore = defineStore("history", () => {
  const histories = reactive(new Map<string, History<unknown>>());

  function save<T>(filepath: string, data: T) {
    ensureHistory(filepath, data).push(data);
    return data;
  }

  function undo<T>(filepath: string): T | undefined {
    const history = histories.get(filepath) as History<T>;
    return history?.undo();
  }

  function redo<T>(filepath: string): T | undefined {
    const history = histories.get(filepath) as History<T>;

    return history?.redo();
  }

  function drop(filepath: string) {
    histories.delete(filepath);
  }

  function get<T>(filepath: string): T | undefined {
    const history = histories.get(filepath);

    return history?.current.data as T;
  }

  function ensureHistory<T>(
    filepath: string,
    initialData: T
  ): History<T> {
    const history = histories.get(filepath);

    if (history) {
      return history as History<T>;
    }

    const newHistory = new History(initialData);

    histories.set(filepath, newHistory);

    return newHistory;
  }

  return {
    ensureHistory,
    get,
    save,
    undo,
    redo,
    drop,
  };
});
