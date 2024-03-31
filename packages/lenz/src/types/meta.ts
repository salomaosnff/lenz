import type * as icons from '@mdi/js'

/**
 * Ícone nativo do editor
 */
export type NativeIconMeta = keyof typeof icons extends `mdi${infer T}` ? T : never

/**
 * Ícone SVG
 */
export interface SvgIconMeta {
    /** Tipo do ícone */
    type: "svg"

    /**
     * Caminho SVG do ícone
     * @example "M0 0h24v24H0z"
     */
    path: string
}

/**
 * Representa um ícone
 */
export type IconMeta = NativeIconMeta | SvgIconMeta

/**
 * Representa um comando que pode ser executado no editor
 * @example { "id": "example.command", "title": "Example Command" }
 * @example { "id": "example.command", "title": "Example Command", "icon": "mdiAccount" }
 */
export interface CommandMeta {
    /**
     * Identificador único do comando
     * É recomendado que siga o padrão `extension.commandId` para evitar conflitos
     * @example "example.command"
     * @example "cool-extension.command"
     */
    id: string

    /**
     * Título do comando que será mostrado na paleta de comandos
     * Caso não seja fornecido, o comando não será mostrado na paleta de comandos mas ainda pode ser executado por meio de atalhos de teclado ou programaticamente
     * @example "Example Command"
     * @example "Cool Command"
     */
    title?: string

    /**
     * Descrição do comando que será mostrado na paleta de comandos
     * @example "This is an example command"
     * @example "This is a cool command"
     */
    description?: string

    /**
     * Ícone do comando que será mostrado na paleta de comandos
     * No momento, são utilizados os ícones da biblioteca `@mdi/js`, sem o prefixo `mdi`
     * @example "Home"
     * @example "Account"
     */
    icon?: SvgIconMeta | NativeIconMeta
}

export interface ViewMeta {
    /**
     * Identificador único da view
     * É recomendado que siga o padrão `extension.viewId` para evitar conflitos
     * @example "example.view"
     * @example "cool-extension.view"
     */
    id: string

    /**
     * Nome amigável da view
     * @example "Example View"
     * @example "Cool View"
     */
    name: string

    /**
     * Ícone da view que será mostrado no painel
     * @example "Home"
     * @example { "type": "svg", "path": "M0 0h24v24H0z" }
     */
    icon?: IconMeta
}

export interface PanelMeta {
    /**
     * Identificador único do painel
     * É recomendado que siga o padrão `extension.panelId` para evitar conflitos
     * @example "example.panel"
     * @example "cool-extension.panel"
     */
    id: string

    /**
     * Nome amigável do painel
     * @example "Example Panel"
     * @example "Cool Panel"
     */
    name: string

    /**
     * Ícone do painel que será mostrado na barra lateral
     * @example "Home"
     * @example { "type": "svg", "path": "M0 0h24v24H0z" }
     */
    icon?: IconMeta
}

export interface ToolMeta {
    /**
     * Identificador único da ferramenta
     * É recomendado que siga o padrão `extension.toolId` para evitar conflitos
     * @example "example.tool"
     * @example "cool-extension.tool"
     */
    id: string

    /**
     * Nome amigável da ferramenta
     * @example "Example Tool"
     * @example "Cool Tool"
     */
    name: string

    /**
     * Descrição da ferramenta
     * @example "This is an example tool"
     * @example "This is a cool tool"
     */
    description?: string

    /**
     * Ícone da ferramenta que será mostrado na barra de ferramentas
     * @example "Home"
     * @example { "type": "svg", "path": "M0 0h24v24H0z" }
     */
    icon: IconMeta

    /**
     * Prioridade da ferramenta
     * Ferramentas com prioridade maior serão mostradas primeiro
     * @example 0
     * @example 100
     * @default 0
     */
    priority: number

    /**
     * Identificador da ferramenta pai
     * @example "example.tool"
     */
    parent?: string
}

/**
 * Representa um provedor de recursos
 * Um provedor é um conjunto de recursos que podem ser utilizados por outras extensões
 * @example { "id": "example.provider", "name": "Example Provider" }
 * @example { "id": "cool-extension.provider", "name": "Cool Provider" }
 */
export interface ProviderMeta {
    /**
     * Identificador único do provedor
     */
    id: string

    /**
     * Nome amigável do provedor
     */
    name?: string
    [k: string]: unknown
}

/**
 * Representa uma extensão do editor
 */
export interface ExtensionMeta {
    /**
     * Identificador único da extensão
     * Deve seguir o padrão `publisher.name`
     * Somento letras minúsculas e pontos e hífens são permitidos.
     * @example "john.example"
     * @example "bob.cool-extension"
     */
    id: string

    /**
     * Nome amigável da extensão
     * Nome que será mostrado na interface do editor
     * @example "Example Extension"
     * @example "Cool Extension"
     */
    name: string

    /**
     * Descrição da extensão
     * Descrição que será mostrada na interface do editor
     * @example "This is an example extension"
     * @example "This is a cool extension"
     */
    description: string

    /**
     * Versão da extensão no formato semântico
     * @example "1.0.0"
     * @example "1.2.3-alpha"
     */
    version: string

    /**
     * Nome do publisher da extensão
     * @example "john"
     * @example "bob"
     */
    publisher: string

    /**
     * Providers que a extensão depende e que devem ser providos por outras extensões ativas no editor
     * @example ["git.clone", "git.commit"]
     */
    inject?: string[]

    /**
     * Id de extensões que a extensão depende e que devem estar ativas no editor
     * @example ["john.example", "bob.cool-extension"]
     */
    depends?: string[]

    /**
     * Recursos que a extensão contribui para o editor
     * @example { "commands": [{ "id": "example.command", "title": "Example Command" }] }
     * @example { "views": { "properties": [{ "id": "example.view", "name": "Example View" }] } }
     */
    contributes?: {
        /**
         * Comandos que a extensão disponibiliza
         * @example [{ "id": "example.command", "title": "Example Command" }]
         * @example [{ "id": "example.command", "title": "Example Command", "icon": "mdiExample" }]
         */
        commands?: CommandMeta[]
        /**
         * Views que serão mostradas em cada painel
         * @example { "properties": [{ "id": "example.view", "name": "Example View" }] }
         * @example { "info": [{ "id": "example.view", "name": "Example View", "icon": "Example" }]
         */
        views?: Record<string, ViewMeta[]>

        /**
         * Painéis adicionais que serão mostrados na barra lateral
         * @example [{ "id": "example.panel", "name": "Example Panel", "icon": "Example" }]
         * @example [{ "id": "example.panel", "name": "Example Panel", "icon": { "type": "svg", "path": "M0 0h24v24H0z" } }]
         */
        panels?: PanelMeta[]

        /**
         * Ferramentas que serão mostradas na barra de ferramentas
         */
        tools?: ToolMeta[]

        /**
         * Recursos que esta extensão implementa e que podem ser utilizados por outras extensões
         * @example ["git.clone", "git.commit"]
         * @example ["example.api"]
         */
        providers?: ProviderMeta[]

        /**
         * Traduções da extensão
         * @example { "en": { "example": "Example" }, "pt-BR": { "example": "Exemplo" } }
         */
        l10n?: {
            /**
             * Arquivo .yml com as traduções deste idioma
             */
            [k: string]: string
        }
    }
}

