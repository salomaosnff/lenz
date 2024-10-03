/**
 * Módulo para manipulação de arquivos que estão sendo editados no editor
 * @module lenz:file
 */
/**
 * Retorna o arquivo atualmente aberto no editor
 * @returns
 */
export declare function getCurrentFile(): any;
/**
 * Abre um arquivo para edição no editor
 * @param filepath Caminho do arquivo a ser aberto
 */
export declare function open(filepath: string): Promise<void>;
/**
 * Escreve conteúdo no arquivo atual
 * @param content Conteúdo a ser escrito ou uma função que retorna o conteúdo
 * @param writeHistory Se deve escrever no histórico de edições
 */
export declare function write(content: string | ((lastContent: string) => string | Promise<string>), writeHistory?: boolean): Promise<void>;
/**
 * Salva o arquivo atual
 */
export declare function save(): Promise<void>;
