/* eslint-disable @typescript-eslint/no-explicit-any */
import { onBeforeUnmount } from 'vue';

const stackMap = new Map<symbol, () => void>();
const stack: any[] = [];

export function useOverlayStack(onDispose: () => void) {
  const id = Symbol(Math.random().toString(36).substring(2));

  function push() {
    if (!stackMap.has(id)) {
      stackMap.set(id, onDispose);
      stack.push(id);
    }
  }

  function pop() {
    const lastIndex = stack.length - 1;
    const lastId = stack[lastIndex];
    if (lastId === id) {
      const dispose = stackMap.get(id);
      stackMap.delete(id);
      dispose?.();
      stack.splice(lastIndex, 1);
    }
  }

  function dispose() {
    stackMap.delete(id);
    const index = stack.indexOf(id);
    if (index >= 0) {
      stack.splice(index, 1);
    }
  }

  onBeforeUnmount(dispose);

  return {
    push,
    pop,
    dispose,
  };
}