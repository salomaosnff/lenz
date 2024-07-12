import { Disposable, ToolbarItem } from "./types/index.js";
import { listen, emit, once } from "@tauri-apps/api/event";

type Listener<T extends any[]> = (...args: T) => void;

const VOID = () => {};

class EventEmitter<T extends Record<string, any[]>> {
  on<K extends keyof T & string>(
    event: K,
    listener: Listener<T[K]>
  ): Disposable {
    let disposer: () => void = VOID;

    listen(event, event => listener(...event.payload as T[K])).then((dispose) => {
      disposer = () => {
        dispose();
        disposer = VOID;
      }
    });

    return {
      dispose: disposer,
    };
  }

  once<K extends keyof T & string>(
    event: K,
    listener: Listener<T[K]>
  ): Disposable {
    let disposer: () => void = VOID;

    once(event, event => listener(...event.payload as T[K])).then((dispose) => {
      disposer = () => {
        dispose();
        disposer = VOID;
      }
    });

    return {
      dispose: disposer,
    };
  }

  emit<K extends keyof T & string>(event: K, ...args: T[K]): void {
    emit(event, args);
  }
}

export default new EventEmitter<{
  //Extensions
  "extensions:init": [extensionId: string];
  "extensions:activate": [extensionId: string];
  "extensions:error": [error: any, extensionId: string];
  // Tools
  "tools:prepare": [tool: ToolbarItem];
  "tools:register": [tool: ToolbarItem];
  "tools:remove": [toolId: string];
  "tools:activate": [toolId: string];
}>();
