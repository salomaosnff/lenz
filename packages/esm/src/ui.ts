/**
 * Módulo para generenciar janelas de interação com o usuário
 * @module lenz:ui
 */

import { ensureInitialized } from "./util.js";
import type { LenzDisposer } from "./types.js";
import { Widget } from "./widgets/widget.js";

declare global {
  interface Window {
    /** Dados de inicialização da janela */
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
   * o conteúdo HTML será carregado utilizando a função `fetch()`, serão injetados estilos de tema na janela como variáveis CSS e o conteúdo será exibido em um iframe
   */
  content: Widget

  /** Largura da janela */
  width?: number;

  /** Altura da janela */
  height?: number;

  /**
   * Define se serão injetados estilos de tema na janela como variáveis CSS
   */
  themed?: boolean;

  /**
   * Posição horizontal da janela
   */
  x?: number;

  /** Posição vertical da janela */
  y?: number;

  /**
   * Define se a janela pode ser redimensionada pelo usuário
   */
  resizable?: boolean;

  /** Remove a borda da janela */
  frame?: boolean;

  /** Bloqueia a interação com o editor enquanto a janela estiver aberta */
  modal?: boolean;

  /** Define se a janela pode ser fechada pelo usuário */
  closable?: boolean;

  /** Define se a janela pode ser movida pelo usuário */
  movable?: boolean;

  /** Define se a janela pode ser encolhida pelo usuário */
  collapsible?: boolean;

  /** Define se a janela possui sombra */
  shadow?: boolean;

  /** Define se a janela possui transparência */
  transparent?: boolean;

  /** Função chamada quando a janela é fechada */
  onClose?(): void;
}

/**
 * Cria uma nova janela de interface
 * @param options Opções da janela
 * @returns Uma instância da janela criada
 */
export function createWindow(options: WindowOptions) {
  return ensureInitialized().windows().createWindow(options);
}

/**
 * Retorna os dados passados para a janea de interface
 * @returns
 */
export function getData<T>(): T {
  if (!("__LENZ_UI_INIT" in window)) {
    throw new Error("Editor not initialized yet");
  }

  return window.__LENZ_UI_INIT;
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


/**
 * Hook para aguardar a destruição da janela de interface
 * @param cb 
 */
export function onUiDestroy(cb: Function) {
  
}