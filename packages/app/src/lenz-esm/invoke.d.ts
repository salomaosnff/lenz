declare module 'lenz:invoke' {
    type FormValue = string | number | boolean | null | File | FileList | Blob
    type InvokeArgs = Record<string, FormValue | Array<FormValue>>
    
    /**
     * Executa um comando no servidor.
     * @param command Comando a ser executado.
     * @param args Argumentos do comando.
     * @returns Promise com o resultado da execução do comando.
     * @throws Caso o comando não seja encontrado.
     * @example Somando dois números:
     * ```typescript
     * import { invoke } from 'lenz:invoke';
     * 
     * const result = await invoke<number>('sum', { a: 1, b: 2 });
     * 
     * console.log(result); // 3
     * ```
     * @example Enviando um arquivo:
     * ```typescript
     * import { invoke } from 'lenz:invoke';
     * 
     * const result = await invoke<string>('write', { files: [new File(['Hello'], 'hello.txt')] });
     * 
     * console.log(result); // 'hello.txt'
     * ```
     */
    export function invoke<T>(command: string, args?: InvokeArgs): Promise<T>;

    /**
     * Executa um comando no servidor de forma síncrona.
     * @param command Comando a ser executado.
     * @param args Argumentos do comando.
     * @returns Resultado da execução do comando.
     * @throws Caso o comando não seja encontrado.
     * 
     * @example Somando dois números:
     * ```typescript
     * import { invokeSync } from 'lenz:invoke';
     * 
     * const result = invokeSync<number>('sum', { a: 1, b: 2 });
     * 
     * console.log(result); // 3
     * ```
     * @example Enviando um arquivo:
     * ```typescript
     * import { invokeSync } from 'lenz:invoke';
     * 
     * const result = invokeSync<string>('write', { files: [new File(['Hello'], 'hello.txt')] });
     * 
     * console.log(result); // 'hello.txt'
     * ```
     */
    export function invokeSync<T>(command: string, args?: InvokeArgs): T;
}

