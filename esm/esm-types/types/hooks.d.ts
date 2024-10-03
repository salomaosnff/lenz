/**
 * Módulo para gerenciar hooks de eventos
 * @module lenz:hooks
 */
/**
 * Executa um callback antes de um evento ser disparado
 * @param event Evento a ser monitorado
 * @param callback Função a ser executada
 * @returns Disposer
 */
export declare function onBefore(event: string, callback: Function): any;
/**
 * Executa um callback depois de um evento ser disparado
 * @param event Evento a ser monitorado
 * @param callback Função a ser executada
 * @returns Disposer
 */
export declare function onAfter(event: string, callback: Function): any;
