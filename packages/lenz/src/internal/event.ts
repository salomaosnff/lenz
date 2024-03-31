import EventEmitter from "events";
import { Disposable } from "../types";

export interface EventMap {

}

/**
 * O host de eventos é responsável por emitir e ouvir eventos do editor.
 */
export class EventHost {
    #emitter = new EventEmitter<EventMap>()

    /**
     * Emite um evento
     * @param event Nome do evento
     * @param args Argumentos do evento
     */
    emit<K extends keyof EventMap>(event: K, ...args: EventMap[K]) {
        this.#emitter.emit(event, ...args)
    }

    /**
     * Registra um ouvinte de eventos
     * @param event Nome do evento
     * @param listener Ouvinte do evento
     */
    on<K extends keyof EventMap>(event: K, listener: (...args: EventMap[K]) => void): Disposable {
        this.#emitter.on(event, listener as any)

        return {
            dispose: () => this.#emitter.off(event, listener as any)
        }
    }

    /**
     * Remove um ouvinte de eventos
     * @param event Nome do evento
     * @param listener Ouvinte do evento
     */
    off<K extends keyof EventMap>(event: K, listener: (...args: EventMap[K]) => void) {
        this.#emitter.off(event, listener as any)
    }

    /**
     * Remove todos os ouvintes de eventos
     */
    removeAllListeners(event: keyof EventMap) {
        this.#emitter.removeAllListeners(event)
    }
}

export const events = new EventHost()