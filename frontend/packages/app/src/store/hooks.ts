import { defineStore } from "pinia";

export const useHooksStore = defineStore("hooks", () => {
  const hooks = reactive<
    Record<
      string,
      {
        before: Set<(...args: any[]) => any>;
        after: Set<(...args: any[]) => any>;
      }
    >
  >({});

  async function callHooks<T>(event: string, cb: (...args: any[]) => T | Promise<T>, ...args: any[]): Promise<T> {
    const hook = hooks[event];

    if (!hook) {
      return cb(...args);
    }

    for (const before of hook.before) {
      if (((await before(...args)) ?? true) === false) {
        return null as any;
      }
    }

    const result = await cb(...args);

    for (const after of hook.after) {
      const afterResult = await after(result, ...args);

      if (afterResult !== undefined) {
        return afterResult;
      }
    }

    return result;
  }

  async function onBefore(event: string, cb: (...args: any[]) => any) {
    hooks[event] ??= { before: new Set(), after: new Set() };
    hooks[event].before.add(cb);

    return () => {
      if (!hooks[event]?.before) return;

      hooks[event].before.delete(cb);

      if (!hooks[event].before.size && !hooks[event].after?.size) {
        delete hooks[event];
      }
    };
  }

  async function onAfter(event: string, cb: (...args: any[]) => any) {
    hooks[event] ??= { before: new Set(), after: new Set() };
    hooks[event].after.add(cb);

    return () => {
      if (!hooks[event]?.after) return;

      hooks[event].after.delete(cb);

      if (!hooks[event].before.size && !hooks[event].after?.size) {
        delete hooks[event];
      }
    };
  }

  return {
    hooks,
    callHooks,
    onBefore,
    onAfter,
  };
});
