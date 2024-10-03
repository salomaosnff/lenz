declare global {
    export interface Window {
        /** Store do Editor */
        __LENZ_STORE__?: any;
    }
}
/**
 * Garante que o editor foi inicializado
 * @returns Store do editor
 */
export declare function ensureInitialized(): Window['__LENZ_STORE__'];
