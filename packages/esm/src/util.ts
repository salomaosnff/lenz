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
export function ensureInitialized(): Window['__LENZ_STORE__'] {
  if (!window.__LENZ_STORE__) {
    throw new Error("O editor ainda não foi inicializado");
  }

  return window.__LENZ_STORE__;
}
