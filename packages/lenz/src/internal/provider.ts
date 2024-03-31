import EventEmitter from "events";
import { AsyncOrSync, Disposable, ProviderMeta, ToolMeta } from "../types";

/**
 * Valor padrão para provedores que não foram implementados
 */
export const VoidProvider = Symbol("VoidProvider")

export interface ProviderItem<T = unknown> {
    /** Meta informações do provedor */
    meta: ProviderMeta

    /** Valor do provedor */
    value: T
    
    /** Identificador da extensão que registrou o provedor */
    extensionId: string
}

/**
 * Representa um host de provedores
 * Um host de provedores é onde os provedores ficam "hospedados".
 * O host de provedores é responsável por preparar, registrar e obter valores de provedores.
 */
export class ProviderHost extends EventEmitter<{
    prepare: [tool: ProviderItem],
    register: [tool: ProviderItem],
    unregister: [tool: ProviderItem],
    update: [tools: ProviderItem]
}> {
    #providerMap = new Map<string, ProviderItem>()

    /**
     * Mapa de provedores registrados
     */
    get providerMap() {
        return new Map(this.#providerMap)
    }

    /**
     * Prepara um provedor para ser registrado
     * @param extensionId Extensão que registrou o provedor
     * @param meta Metadados do provedor
     * @returns Descartável para remover o provedor
     */
    prepare(extensionId: string, meta: ProviderMeta): Disposable {
        const item: ProviderItem = {
            meta,
            extensionId,
            value: VoidProvider,
        }

        this.#providerMap.set(meta.id, item)

        this.emit('prepare', item)
        this.emit("update", item)

        return {
            dispose: () => this.unregister(meta.id)
        }
    }

    /**
     * Obtém as informações de um provedor
     * @param providerId Identificador do provedor
     * @returns Informações do provedor
     */
    getProvider(providerId: string): ProviderItem {
        const item = this.#providerMap.get(providerId)

        if (!item) {
            throw new Error(`Provider "${providerId}" not found`)
        }

        return item
    }

    /**
     * Registra um provedor no host informando o valor
     * @param providerId Identificador do provedor
     * @param value Valor do provedor
     * @returns Descartável para remover o provedor
     */
    register(providerId: string, value: unknown): Disposable {
        const item = this.getProvider(providerId)

        if (item.value !== VoidProvider) {
            throw new Error(`Provider "${providerId}" already registered`)
        }

        item.value = value

        this.emit("register", item)
        this.emit("update", item)

        return {
            dispose: () => this.unregister(providerId)
        }
    }

    /**
     * Remove um provedor do host
     * @param providerId Identificador do provedor
     */
    unregister(providerId: string): void {
        const item = this.getProvider(providerId)

        item.value = VoidProvider

        this.#providerMap.delete(providerId)

        this.emit("unregister", item)
        this.emit("update", item)
    }

    /**
     * Obtém o valor de um provedor
     * @param providerId Identificador do provedor
     * @returns Valor do provedor
     */
    get<T = unknown>(providerId: string): T {
        const item = this.getProvider(providerId)

        if (item.value === VoidProvider) {
            throw new Error(`Provider "${providerId}" not implemented`)
        }

        return item.value as T
    }
}

export const providers = new ProviderHost()