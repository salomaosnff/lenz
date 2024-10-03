/**
 * Módulo para gerenciamento de históricos
 * @module lenz:history
*/
/**
 * Obtém o histórico de um estado ou cria um novo
 * @param key Identificador do estado
 * @param initialData Dados iniciais
 * @returns
 */
export declare function ensureHistory(key: string, initialData: string): any;
/**
 * Salva um novo estado
 * @param key Identificador do estado
 * @param data Dados a serem salvos
 * @returns
 */
export declare function save(key: string, data: string): any;
/**
 * Volta para o estado anterior
 * @param key
 * @returns
 */
export declare function undo(key: string): any;
/**
 * Refaz o próximo estado
 * @param key
 * @returns
 */
export declare function redo(key: string): any;
/**
 * Exclui todo o histórico deste estado
 * @param key
 * @returns
 */
export declare function drop(key: string): any;
/**
 * Obtém o estado atual
 * @param key
 * @returns
 */
export declare function read(key: string): any;
/**
 * Retorna se é possível voltar ao estado atual
 * @param key
 * @returns
 */
export declare function canUndo(key: string): any;
/**
 * Retorna se é possível refazer refazer o próximo estado
 * @param key
 * @returns
 */
export declare function canRedo(key: string): any;
