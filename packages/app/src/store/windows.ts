import { WindowOptions } from "lenz:ui";
import _uniqueId from "lodash-es/uniqueId";
import { defineStore } from "pinia";
import { reactive } from "vue";

export interface WindowInstance {
  id: string;
  options: WindowOptions &
    Required<Omit<WindowOptions, "base" | "content" | "x" | "y">>;
  disposers: Set<() => void>;

  setPosition(x: number, y: number): void;
  setSize(width: number, height: number): void;
  center(): void;
  close(): void;
}

export const useWindowStore = defineStore("window", () => {
  const windowsMap = reactive(new Map<string, WindowInstance>());

  function createWindow(options: WindowOptions): WindowInstance {
    const id = _uniqueId("window-");
    const { onClose, ...rest } = options;
    const disposers = new Set<() => void>();
    const normalizedOptions = reactive({
      title: "Window",
      borderless: false,
      data: {},
      width: 320,
      height: 320,
      closable: true,
      modal: false,
      movable: true,
      resizable: true,
      shadow: true,
      collapsible: true,
      transparent: false,
      frame: true,
      themed: true,
      async onClose() {
        for (const disposer of disposers) {
          disposer();
        }
        disposers.clear();
        await onClose?.();
        windowsMap.delete(id);
      },
      ...rest,
    });

    function setSize(width: number, height: number) {
      normalizedOptions.width = width;
      normalizedOptions.height = height;
    }

    function setPosition(x: number, y: number) {
      normalizedOptions.x = x;
      normalizedOptions.y = y;
    }

    function center() {
      const { innerWidth, innerHeight } = window;
      const { width, height } = normalizedOptions;

      setPosition((innerWidth - width) / 2, (innerHeight - height) / 2);
    }

    async function close() {
      const window = windowsMap.get(id);

      if (window) {
        await window.options.onClose();
      }

      windowsMap.delete(id);
    }

    const instance: WindowInstance = {
      id,
      options: normalizedOptions,
      disposers,
      center,
      close,
      setPosition,
      setSize,
    };

    if (!normalizedOptions.x || !normalizedOptions.y) {
      instance.center();
    }

    const SHIFT_AMOUNT = 24;

    normalizedOptions.x ??= 0;
    normalizedOptions.y ??= 0;

    for (const window of windowsMap.values()) {
      const x = window.options.x ?? 0;
      const y = window.options.y ?? 0;

      if (
        normalizedOptions.x >= x &&
        normalizedOptions.x <= x + window.options.width
      ) {
        normalizedOptions.x += SHIFT_AMOUNT;
      }

      if (
        normalizedOptions.y >= y &&
        normalizedOptions.y <= y + window.options.height
      ) {
        normalizedOptions.y += SHIFT_AMOUNT;
      }
    }

    windowsMap.set(id, instance);

    return instance;
  }

  return {
    createWindow,
    windowsMap,
  };
});
