/**
 * Funções para invocar comandos no agente
 * @module lenz:invoke
 */
/**
 * Erro de execução de comando
 */
export declare class InvokeError extends Error {
    constructor(message: string);
}
/**
 * Invoca um comando no servidor de forma assíncrona
 * @param command Comando a ser invocado
 * @param args Argumentos do comando
 * @returns Promise com o resultado da execução
 */
export declare function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>;
/**
 * Invoca um comando no servidor de forma síncrona
 * @param command Comando a ser invocado
 * @param args Argumentos do comando
 * @returns Resultado da execução
 */
export declare function invokeSync(command: string, args?: Record<string, unknown>): string | Promise<string> | Record<string, unknown> | Promise<Record<string, unknown> | null> | ArrayBuffer | Promise<ArrayBuffer> | null | undefined;
