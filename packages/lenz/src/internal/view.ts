import EventEmitter from "events";
import { ExtensionItem, extensions } from ".";
import { Disposable, PanelMeta, ViewMeta } from "../types";

export interface ViewController {
    /** Exibe a visão */
    show?(): void

    /** Oculta a visão */
    hide?(): void

    /** Descarta a visão */
    dispose?(): void

    /** Cria a visão */
    create?(element: HTMLElement): void
}

export const VoidViewController: ViewController = {
    show() { console.warn("View show not implemented") },
    hide() { console.warn("View hide not implemented") },
    create() { console.warn("View create not implemented") },
}

export interface ViewHostItem {
    /** Meta informações da view */
    meta: ViewMeta

    /** Extensão que registrou a view */
    extension: ExtensionItem

    /** Controlador da view */
    controller: ViewController

    /** Identificador do painel onde a view está exibida */
    panelId: string

    /** Se a view está visível */
    isVisible: boolean
}

/**
 * Representa um host de visões
 * Um host de visões é onde as visões ficam "hospedadas".
 * O host de visões é responsável por preparar, registrar, exibir e ocultar visões.
 */
export class ViewHost extends EventEmitter<{
    prepare: [view: ViewHostItem],
    register: [view: ViewHostItem],
    unregister: [view: ViewHostItem],
    update: [view: ViewHostItem]
    updatePanel: [panel: PanelMeta]
    updateVisibility: [view: ViewHostItem, isVisible: boolean]
    show: [view: ViewHostItem]
    hide: [view: ViewHostItem]
}> {
    #viewMap = new Map<string, ViewHostItem>()
    #panelMap = new Map<string, PanelMeta>([
        { id: 'main', name: 'Main', group: 'main' },
        {
            id: 'properties',
            name: 'Propriedades',
            icon: 'Tune',
            group: 'right'
        } as PanelMeta
    ].map(p => [p.id, p]))

    /**
     * Mapa de visões registradas
     */
    get viewMap() {
        return new Map(this.#viewMap)
    }

    /**
     * Mapa de painéis
     */
    get panelMap() {
        return new Map(this.#panelMap)
    }

    /**
     * Prepara uma visão para ser registrada
     * @param extensionId Extensão que registrou a visão
     * @param meta Metadados da visão
     * @returns Descartável para remover a visão
     */
    prepare(extensionId: string, panelId: string, meta: ViewMeta): Disposable {
        const item: ViewHostItem = {
            meta,
            extension: extensions.getExtension(extensionId),
            controller: VoidViewController,
            isVisible: false,
            panelId,
        }

        this.#viewMap.set(meta.id, item)

        this.emit('prepare', item)
        this.emit("update", item)

        return {
            dispose: () => this.unregister(meta.id)
        }
    }

    /**
     * Registra um painel
     */
    registerPanel(panel: PanelMeta): Disposable {
        if (this.#panelMap.has(panel.id)) {
            throw new Error(`Panel "${panel.id}" already registered`)
        }

        this.#panelMap.set(panel.id, panel)

        this.emit("updatePanel", panel)

        return {
            dispose: () => {
                this.#panelMap.delete(panel.id)
                this.emit("updatePanel", panel)
            }
        }
    }

    /**
     * Registra uma visão definindo seu controlador
     * @param viewId Identificador da visão
     * @param controller Controlador da visão
     * @returns Descartável para remover a visão
     */
    register(viewId: string, controller: ViewController): Disposable {
        const item = this.getView(viewId)

        if (item.controller !== VoidViewController) {
            throw new Error(`View "${viewId}" already registered`)
        }

        item.controller = controller

        this.emit("register", item)
        this.emit("update", item)

        return {
            dispose: () => this.unregister(viewId)
        }
    }

    /**
     * Remove uma visão do host
     * @param viewId Identificador da visão
     */
    unregister(viewId: string): void {
        const item = this.getView(viewId)

        item.controller = VoidViewController

        this.#viewMap.delete(viewId)

        this.emit("unregister", item)
        this.emit("update", item)
    }

    /**
     * Exibe uma visão
     * @param viewId Identificador da visão
     */
    show(viewId: string): void {
        const item = this.getView(viewId)

        if (item.isVisible) {
            return
        }

        item.isVisible = true

        item.controller.show?.()

        this.emit("show", item)
        this.emit("updateVisibility", item, true)
        this.emit("update", item)
    }

    /**
     * Oculta uma visão
     * @param viewId Identificador da visão
     */
    hide(viewId: string): void {
        const item = this.getView(viewId)

        if (!item.isVisible) {
            return
        }

        item.isVisible = false

        item.controller.hide?.()

        this.emit("hide", item)
        this.emit("updateVisibility", item, false)
        this.emit("update", item)
    }

    /**
     * Tenta exibir uma visão, se ela estiver oculta, ou ocultá-la, se ela estiver visível
     * @param viewId Identificador da visão
     */
    toggle(viewId: string): void {
        const item = this.getView(viewId)

        return item.isVisible ? this.hide(viewId) : this.show(viewId)
    }

    /**
     * Inicializa a visão
     */
    init(viewId: string, element: HTMLElement): void {
        const item = this.getView(viewId)

        item.controller.create?.(element)

        this.emit("update", item)
    }

    /**
     * Obtém as informações de uma visão
     * @param viewId Identificador da visão
     * @returns Informações da visão
     * @throws Se a visão não for encontrada
     */
    getView(viewId: string): ViewHostItem {
        const item = this.#viewMap.get(viewId)

        if (!item) {
            throw new Error(`View "${viewId}" not found`)
        }

        return item
    }

    /**
     * Obtém um painel e suas visões
     * @param panelId Identificador do painel
     * @returns Painel e visões
     * @throws Se o painel não for encontrado
     */
    getPanel(panelId: string) {
        const item = this.#panelMap.get(panelId)

        if (!item) {
            throw new Error(`Panel "${panelId}" not found`)
        }

        return {
            meta: item,
            views: Array.from(this.#viewMap.values()).filter(view => view.panelId === panelId)
        }
    }
}

export const views = new ViewHost()