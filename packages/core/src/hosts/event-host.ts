import type { Disposable } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppEventListener = (...args: any[]) => void

const eventMap = new Map<string, Set<AppEventListener>>();

/**
 * Emite um evento no escopo da aplicação.
 */
export function on(event: string, listener: AppEventListener): Disposable {
  const listeners = eventMap.get(event) ?? new Set();

  listeners.add(listener);
  eventMap.set(event, listeners);

  return {
    dispose() {
      listeners.delete(listener);

      if (listeners.size === 0) {
        eventMap.delete(event);
      }
    },
  };
}

/**
 * Emite um evento no escopo da aplicação apenas uma vez.
 */
export function once(event: string, listener: AppEventListener): Disposable {
  const disposable = on(event, (...args) => {
    disposable.dispose();
    listener(...args);
  });

  return disposable;
}

/**
 * Emite um evento no escopo da aplicação.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function emit(event: string, ...args: any[]) {
  const listeners = eventMap.get(event);

  if (!listeners) {
    return;
  }

  for (const listener of listeners) {
    listener(...args);
  }
}

/**
 * Remove todos os ouvintes de um evento.
 *
 * Caso o nome do evento não seja fornecido, todos os ouvintes de todos os eventos serão removidos.
 * @param event Nome do evento.
 */
export function removeAllListeners(event?: string) {
  if (event) {
    eventMap.delete(event);
  }
 else {
    eventMap.clear();
  }
}

/**
 * Cria o nome de um evento da aplicação.
 * @param name Nome do evento.
 * @returns O nome do evento da aplicação.
 * @example
 * ```ts
 * const event = createAppEvent('foo')
 * console.log(event) // @app/foo
 * ```
 */
export function createAppEvent(name: string) {
  return `@app/${name}`;
}

/**
 * Host de eventos da aplicação.
 */
export default {
  on,
  once,
  emit,
  removeAllListeners,
};
