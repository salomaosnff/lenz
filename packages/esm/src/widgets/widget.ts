import { LenzDisposer } from "../types.js";

/**
 * Um widget que pode ser adicionado a um elemento
 * @param parent O elemento pai
 * @returns Uma função que descarta recursos alocados
 */
export type Widget = (parent: HTMLElement) => LenzDisposer | undefined;