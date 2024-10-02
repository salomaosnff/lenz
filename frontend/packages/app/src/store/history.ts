import { isEqual } from "lodash-es";
import { defineStore } from "pinia";
import { reactive } from "vue";

export class SnapShot<T> {
  constructor(
    public data: T,
    public previous: SnapShot<T> | null = null,
    public next: SnapShot<T> | null = null
  ) {}
}

export class History<T> {
  oldest: SnapShot<T>;
  current: SnapShot<T>;
  count: number = 1;

  constructor(
    public data: T,
    public capacity = 100
  ) {
    this.oldest = new SnapShot(data);
    this.current = this.oldest;
  }

  get canUndo() {
    return !!this.current.previous;
  }

  get canRedo() {
    return !!this.current.next;
  }

  undo() {
    if (this.current.previous) {
      this.current = this.current.previous;
      this.count--;
    }

    return this.current.data;
  }

  redo() {
    if (this.current.next) {
      this.current = this.current.next;
      this.count++;
    }

    return this.current.data;
  }

  push(data: T) {
    if (isEqual(data, this.current.data)) {
      return data;
    }
    
    const newSnapShot = new SnapShot(data, this.current);

    this.current.next = newSnapShot;
    this.current = newSnapShot;

    this.count++;

    while (this.count > this.capacity) {
      this.oldest = this.oldest.next!;
      this.oldest.previous = null;
      this.count--;
    }

    return data;
  }

  clear() {
    const current = this.current;

    current.previous = null;
    current.next = null;

    this.current = current;
    this.oldest = current;
    this.count = 1;
  }
}

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
