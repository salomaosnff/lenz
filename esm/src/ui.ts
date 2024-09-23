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
}

/**
 * Canal de comunicação
 */
export type Channel<T> = [SenderChannel<T>, ReceiverChannel<T>];

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

  function isClosed() {
    return closed;
  }

  function close() {
    if (closed) {
      throw new Error("Channel is already closed");
    }
    closed = true;
    listeners.clear();
  }

  const transmitter: SenderChannel<T> = {
    close,
    isClosed,
    send(data) {
      if (isClosed()) {
        throw new Error("Cannot send data on a closed channel");
      }
      listeners.forEach((listener) => listener(data));
    },
  };

  const receiver: ReceiverChannel<T> = {
    close,
    isClosed,
    async next(abortSignal?: AbortSignal) {
      return new Promise((resolve, reject) => {
        nextTick(() => {
          if (isClosed()) {
            return reject(new Error("Cannot wait next on a closed channel"));
          }

          let disposeAbortSignal: LenzDisposer | undefined;

          const dispose = receiver.addListener((data) => {
            disposeAbortSignal?.();
            dispose();
            resolve(data);
          });

          if (abortSignal) {
            const listener = () => {
              dispose();
              reject(new Error("Channel next operation was aborted"));
            };

            abortSignal.addEventListener("abort", listener, { once: true });
            disposeAbortSignal = () =>
              abortSignal.removeEventListener("abort", listener);
          }
        });
      });
    },
    async *listen(abortSignal) {
      if (isClosed()) {
        throw new Error("Cannot listen on a closed channel");
      }

      while (!isClosed()) {
        yield receiver.next(abortSignal);
      }
    },
    addListener(listener) {
      if (isClosed()) {
        throw new Error("Cannot add listener to a closed channel");
      }

      listeners.add(listener);

      return () => listeners.delete(listener);
    },
  };

  return [transmitter, receiver];
}

/**
 * Hook para aguardar a inicialização da janela de interface
 * @param cb Função a ser executada quando a janela de interface estiver pronta
 */
export function onUiInit(cb: Function) {
  if (window.__LENZ_UI_INIT) {
    return cb(window.__LENZ_UI_INIT);
  }

  window.addEventListener("lenz:ui:init" as any, ({ detail }: CustomEvent) => cb(detail), {
    once: true,
  });
}
