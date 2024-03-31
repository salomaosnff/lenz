export type * from './meta'

/**
 * Representa um recurso descartável
 */
export interface Disposable {
    /**
     * Descarta o recurso
     */
    dispose(): void
}

/**
 * Representa um valor que pode ser síncrono ou assíncrono
 */
export type AsyncOrSync<T> = T | Promise<T>

declare global {
    const nw: typeof import('nw.gui')
}