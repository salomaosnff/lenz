/**
 * Uma função que descarta recursos alocados
 * @internal
 */
export type LenzDisposer = () => void;

/**
 * Representa a seleção de um elemento
 */
export interface ElementSelection {
  /**
   * O seletor CSS que pode ser usado para encontrar o elemento
   */
  selector: string;

  /**
   * O elemento selecionado
   */
  element: HTMLElement;

  /**
   * O retângulo que circunda o elemento relativo à viewport
   */
  box: DOMRect;
}
