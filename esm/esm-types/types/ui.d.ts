/**
 * Módulo para generenciar janelas de interação com o usuário
 * @module lenz:ui
 */
import type { LenzDisposer } from "./types.js";
declare global {
    interface Window {
        /** Dados de inicialização da janela */
        __LENZ_UI_INIT?: any;
    }
}
/**
 * Opções da janela de interface
 */
export interface WindowOptions {
    /** Título da janela */
    title?: string;
    /**
     * Conteúdo da janela
     * Pode ser uma string contendo HTML ou uma URL que será carregada em um iframe controlado pela janela
     * o conteúdo HTML será carregado utilizando a função `fetch()`, serão injetados estilos de tema na janela como variáveis CSS e o conteúdo será exibido em um iframe
     */
    content?: string | URL;
    /**
     * URL base para carregar o conteúdo da janela
     * @default "about:srcdoc"
     */
    base?: URL;
    /** Largura da janela */
    width?: number;
    /** Altura da janela */
    height?: number;
    /**
     * Define se serão injetados estilos de tema na janela como variáveis CSS
     */
    themed?: boolean;
    /**
     * Dados a serem transferidos para a janela
     */
    data?: Record<string, unknown>;
    /**
     * Posição inicial da janela
     */
    position?: {
        x: number;
        y: number;
    };
    /**
     * Define se a janela pode ser redimensionada pelo usuário
     */
    resizable?: boolean;
    /** Remove a borda da janela */
    frame?: boolean;
    /** Bloqueia a interação com o editor enquanto a janela estiver aberta */
    modal?: boolean;
    /** Define se a janela pode ser fechada pelo usuário */
    closable?: boolean;
    /** Define se a janela pode ser movida pelo usuário */
    movable?: boolean;
}
/**
 * Cria uma nova janela de interface
 * @param options Opções da janela
 * @returns Uma instância da janela criada
 */
export declare function createWindow(options: WindowOptions): any;
/**
 * Retorna os dados passados para a janea de interface
 * @returns
 */
export declare function getData(): any;
/**
 * Canal de transmissão de dados
 */
export interface SenderChannel<T> {
    /** Fecha o canal */
    close(): void;
    /** Retorna se o canal está fechado */
    isClosed(): boolean;
    /** Envia dados pelo canal */
    send(data: T): void;
    /**
     * Aguarda o fechamento do canal
     */
    waitClose(): Promise<void>;
}
/**
 * Canal de recebimento de dados
 */
export interface ReceiverChannel<T> {
    /** Fecha o canal */
    close(): void;
    /** Retorna se o canal está fechado */
    isClosed(): boolean;
    /** Adiciona um listener para receber dados */
    addListener(listener: (data: T) => void): () => void;
    /**
     * Aguada pelo próximo dado
     * @param signal AbortSignal para cancelar a operação
     */
    next(signal?: AbortSignal): Promise<T>;
    /**
     * Retorna um iterador assíncrono para escutar os dados
     * @param signal AbortSignal para cancelar a operação
     */
    listen(signal?: AbortSignal): AsyncIterableIterator<T>;
    /**
     * Aguarda o fechamento do canal
     */
    waitClose(): Promise<void>;
}
/**
 * Canal de comunicação
 */
export type Channel<T> = [SenderChannel<T>, ReceiverChannel<T>];
export declare class ChannelClosedError extends Error {
    constructor();
}
/**
 * Cria um novo canal de comunicação entre a extensão e a janela de interface
 * @returns Canal de comunicação que pode ser usado para enviar e receber dados entre a extensão e a janela de interface
 *
 * @example
 * ```ts
 * const [tx, rx] = createChannel<string>();
 *
 * rx.addListener((data) => {
 *  console.log("Received:", data);
 * });
 *
 * tx.send("Hello, world!");
 */
export declare function createChannel<T>(): Channel<T>;
/**
 * Referência reativa para um valor
 */
export interface LenzRef<T> {
    /** Valor atual da referência */
    value: T;
    /** Aguarda o fechamento do canal */
    waitClose(): Promise<void>;
    /** Adiciona um listener para receber dados */
    addListener(listener: (value: T) => void): LenzDisposer;
    /** Aguarda pelo próximo dado */
    next(signal?: AbortSignal): Promise<T>;
    /** Retorna um iterador assíncrono para escutar os dados */
    listen(signal?: AbortSignal): AsyncIterableIterator<T>;
    /** Fecha o canal */
    destroy(): void;
    /** Cria uma cópia da referência */
    clone(): LenzRef<T>;
}
/**
 * Cria uma referência reativa
 * @param factory Função para criar a referência
 * @returns Referência reativa
 */
export declare function createCustomRef<T>({ get, set, }: {
    /** Função para obter o valor da referência */
    get: () => T;
    /** Função para definir o valor da referência */
    set: (value: T) => void;
}): LenzRef<T>;
/** Cria uma referência reativa vazia */
export declare function createRef<T>(): LenzRef<T | undefined>;
/** Cria uma referência reativa com um valor inicial */
export declare function createRef<T>(initialValue: T): LenzRef<T>;
/**
 * Hook para aguardar a inicialização da janela de interface
 * @param cb Função a ser executada quando a janela de interface estiver pronta
 */
export declare function onUiInit(cb: Function): any;
