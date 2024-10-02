/**
 * Módulo para generenciar janelas de interação com o usuário
 * @module lenz:ui
 */

import { ensureInitialized } from "./util.js";
import type { LenzDisposer } from "./types.js";

declare global {
  interface Window {
    __LENZ_UI_INIT?: any;
  }
}

/**
 * Opções da janela de interface
 */
export interface WindowOptions {
  /** Título da janela */
  title?: string;

  /**
   * Conteúdo da janela
   * Pode ser uma string contendo HTML ou uma URL que será carregada em um iframe controlado pela janela
   */
  content?: string | URL;

  /**
   * URL base para carregar o conteúdo da janela
   * @default "about:srcdoc"
   */
  base?: URL;

  /** Largura da janela */
  width?: number;

  /** Altura da janela */
  height?: number;

  /**
   * Define se serão injetados estilos de tema na janela como variáveis CSS
   */
  themed?: boolean;

  /**
   * Dados adicionais que podem ser acessados pelo conteúdo da janela
   */
  data?: Record<string, unknown>;

  /**
   * Posição inicial da janela
   */
  position?: { x: number; y: number };

  /**
   * Define se a janela pode ser redimensionada pelo usuário
   */
  resizable?: boolean;

  /** Remove as bordas da janela */
  borderless?: boolean;

  /** Bloqueia a interação com o editor enquanto a janela estiver aberta */
  modal?: boolean;

  /** Define se a janela pode ser fechada pelo usuário */
  closable?: boolean;

  /** Define se a janela pode ser movida pelo usuário */
  movable?: boolean;
}

/**
 * Cria uma nova janela de interface
 * @param options Opções da janela
 * @returns Uma instância da janela criada
 */
export function createWindow(options: WindowOptions) {
  return ensureInitialized().windows().createWindow(options);
}

async function nextTick(cb: Function) {
  return new Promise((resolve) => {
    const task = () => resolve(cb?.());

    if ("setImmediate" in window && typeof window.setImmediate === "function") {
      return window.setImmediate(task);
    }

    return window.setTimeout(task, 0);
  });
}

/**
 * Retorna os dados passados para a janea de interface
 * @returns
 */
export function getData() {
  if (!("__LENZ_UI_INIT" in window)) {
    throw new Error("Editor not initialized yet");
  }

  return window.__LENZ_UI_INIT;
}

/**
 * Canal de transmissão de dados
 */
export interface SenderChannel<T> {
  /** Fecha o canal */
  close(): void;

  /** Retorna se o canal está fechado */
  isClosed(): boolean;

  /** Envia dados pelo canal */
  send(data: T): void;

  /**
   * Aguarda o fechamento do canal
   */
  waitClose(): Promise<void>;
}

/**
 * Canal de recebimento de dados
 */
export interface ReceiverChannel<T> {
  /** Fecha o canal */
  close(): void;

  /** Retorna se o canal está fechado */
  isClosed(): boolean;

  /** Adiciona um listener para receber dados */
  addListener(listener: (data: T) => void): () => void;

  /**
   * Aguada pelo próximo dado
   * @param signal AbortSignal para cancelar a operação
   */
  next(signal?: AbortSignal): Promise<T>;

  /**
   * Retorna um iterador assíncrono para escutar os dados
   * @param signal AbortSignal para cancelar a operação
   */
  listen(signal?: AbortSignal): AsyncIterableIterator<T>;

  /**
   * Aguarda o fechamento do canal
   */
  waitClose(): Promise<void>;
}

/**
 * Canal de comunicação
 */
export type Channel<T> = [SenderChannel<T>, ReceiverChannel<T>];

export class ChannelClosedError extends Error {
  constructor() {
    super("Channel is closed");
  }
}

/**
 * Cria um novo canal de comunicação entre a extensão e a janela de interface
 * @returns Canal de comunicação que pode ser usado para enviar e receber dados entre a extensão e a janela de interface
 *
 * @example
 * ```ts
 * const [tx, rx] = createChannel<string>();
 *
 * rx.addListener((data) => {
 *  console.log("Received:", data);
 * });
 *
 * tx.send("Hello, world!");
 */
export function createChannel<T>(): Channel<T> {
  let closed = false;

  const listeners = new Set<Function>();
  const closeListeners = new Set<Function>();

  function isClosed() {
    return closed;
  }

  function close() {
    if (closed) {
      throw new ChannelClosedError();
    }

    closed = true;

    listeners.clear();
    closeListeners.forEach((listener) => listener());
    closeListeners.clear();
  }

  async function waitClose() {
    if (isClosed()) {
      return;
    }

    return new Promise<void>((resolve) => {
      closeListeners.add(resolve);
    });
  }

  const transmitter: SenderChannel<T> = {
    close,
    waitClose,
    isClosed,
    send(data) {
      if (isClosed()) {
        throw new ChannelClosedError();
      }
      listeners.forEach((listener) => listener(data));
    },
  };

  const receiver: ReceiverChannel<T> = {
    close,
    isClosed,
    waitClose,
    async next(abortSignal?: AbortSignal) {
      return new Promise((resolve, reject) => {
        nextTick(() => {
          if (isClosed()) {
            return reject(new ChannelClosedError());
          }

          let disposeAbortSignal: LenzDisposer | undefined;

          const dispose = receiver.addListener((data) => {
            disposeAbortSignal?.();
            dispose();
            closeListeners.delete(closeListener);
            resolve(data);
          });

          const closeListener = () => {
            disposeAbortSignal?.();
            dispose();
            reject(new ChannelClosedError());
          };

          closeListeners.add(closeListener);

          if (abortSignal) {
            const listener = () => {
              dispose();
              reject(new ChannelClosedError());
            };

            abortSignal.addEventListener("abort", listener, { once: true });
            disposeAbortSignal = () =>
              abortSignal.removeEventListener("abort", listener);
          }
        });
      });
    },
    async *listen(abortSignal) {
      while (!isClosed()) {
        try {
          yield receiver.next(abortSignal);
        } catch (error) {
          if (error instanceof ChannelClosedError) {
            break;
          }

          throw error;
        }
      }
    },
    addListener(listener) {
      if (isClosed()) {
        throw new ChannelClosedError();
      }

      listeners.add(listener);

      return () => listeners.delete(listener);
    },
  };

  return [transmitter, receiver];
}

export interface LenzRef<T> {
  value: T;
  waitClose(): Promise<void>;
  addListener(listener: (value: T) => void): LenzDisposer;
  next(signal?: AbortSignal): Promise<T>;
  listen(signal?: AbortSignal): AsyncIterableIterator<T>;
  destroy(): void;
  clone(): LenzRef<T>;
}

export function createCustomRef<T>({
  get,
  set,
}: {
  get: () => T;
  set: (value: T) => void;
}): LenzRef<T> {
  const [tx, rx] = createChannel<T>();

  const ref = {
    get value() {
      return get();
    },
    set value(value: T) {
      set(value);

      if (!tx.isClosed()) {
        tx.send(value);
      }
    },
    addListener(listener: (data: T) => void) {
      return rx.addListener(listener);
    },
    listen(signal?: AbortSignal) {
      return rx.listen(signal);
    },
    next(signal?:AbortSignal) {
      return rx.next(signal);
    },
    destroy() {
      if (!tx.isClosed()) {
        tx.close();
      }
    },
    waitClose() {
      return rx.waitClose();
    },
    clone() {
      const child = createCustomRef({
        get: () => ref.value,
        set(value) {
          if (value !== ref.value) {
            ref.value = value;
          }
        },
      });

      rx.waitClose().then(() => child.destroy());

      ref.addListener((value: T) => {
        child.value = value;
      });

      return child;
    },
  };

  return ref
}

export function createRef<T>(): LenzRef<T | undefined>
export function createRef<T>(initialValue: T): LenzRef<T>
export function createRef<T>(initialValue?: T): LenzRef<T | undefined> {
  return createCustomRef({
    get: () => initialValue,
    set: (value) => (initialValue = value),
  })
}

/**
 * Hook para aguardar a inicialização da janela de interface
 * @param cb Função a ser executada quando a janela de interface estiver pronta
 */
export function onUiInit(cb: Function) {
  if (window.__LENZ_UI_INIT) {
    return cb(window.__LENZ_UI_INIT);
  }

  window.addEventListener(
    "lenz:ui:init" as any,
    ({ detail }: CustomEvent) => cb(detail),
    {
      once: true,
    }
  );
}
