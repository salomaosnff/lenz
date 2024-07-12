import type * as mdi from '@mdi/js';

/**
 * Representa um valor que pode estar envolto em uma promessa.
 */
export type AsyncOrSync<T> = Promise<T> | T

/**
 * Representa um objeto que possui uma operação de descarte.
 */
export interface Disposable {
  /** Descarta o objeto */
  dispose(): void
}

/**
 * Comando do editor.
 */
export interface Command {
  /** Identificador do comando */
  id: string

  /** Ícone do comando */
  icon?: Icon

  /**
   * Título que será mostrado na paleta de comandos
   *
   * **OBSERVAÇÃO:**
   * Um comando sem título não deverá ser exibido na paleta de comandos,
   * mas poderá ser chamado programaticamente internamente ou por outras extensões.
   */
  title?: string

  /** Descrição do comando */
  description?: string
}

/**
 * Item do menu de contexto.
 */
export interface ContextMenuItem {
  /** Identificador do item do menu de contexto */
  id: string

  /** Título que será mostrado no menu de contexto */
  title: string

  /** Identificador do item pai para criar um submenu */
  parentId?: string
}

/**
 * Atalho de teclado.
 */
export interface Keybinding {
  /** Combinação de teclas */
  keys: string[]

  /** Comando(s) associado(s) ao atalho */
  command: string | string[]
}

/**
 * Ícone nativo do editor.
 * TODO: Listar ícones nativos do editor.
 */
export type NativeIcon = keyof typeof mdi

/**
 * Ícone SVG.
 */
export interface SvgIcon {
  /** Tipo do ícone */
  source: 'svg'

  /** Conteúdo do ícone SVG */
  path: string
}

/**
 * Ícone do Material Design Icons.
 */
export interface MdiIcon {
  /** Tipo do ícone */
  source: 'mdi'

  /** Nome do ícone */
  name: keyof typeof mdi extends `mdi${infer T}` ? T : never
}

/**
 * Ícone do editor.
 */
export type Icon = NativeIcon | SvgIcon | MdiIcon

/**
 * Item da barra de ferramentas.
 */
export interface ToolbarItem {
  /** Identificador do item da barra de ferramentas */
  id: string

  /** Ordem de prioridade do item na barra de ferramentas */
  priority?: number

  /** Título que será mostrado na barra de ferramentas */
  title: string

  /** Descrição do item da barra de ferramentas */
  description?: string

  /** Ícone que será mostrado na barra de ferramentas */
  icon: Icon

  /** Disparar um comando quando o item for ativado */
  command?: string | string[]

  /** Identificador do item pai para criar um subitem */
  parentId?: string
}

/**
 * Barra de atividades.
 */
export interface Tab {
  /** Identificador da aba */
  id: string

  /** Título que será mostrado no topo da aba */
  title: string

  /** Ordem de prioridade da aba */
  priority?: number

  /** Descrição da aba */
  description?: string

  /** Ícone que será mostrado no topo da aba */
  icon: Icon

  /** Disparar um comando quando o item for ativado */
  command?: string | string[]
}

/**
 * Visão do editor.
 */
export interface View {
  /** Identificador da visão */
  id: string

  /** Título que será mostrado no topo da visão */
  title: string

  /** Descrição da visão */
  description?: string

  /** Aba onde será exibida a visão */
  tab: string

  /** Disparar um comando quando a visão for ativada */
  command?: string | string[]
}

/**
 * Contribuições que uma extensão pode fazer no editor.
 */
export interface Contributions {
  /** Lista de APIs que esta extensão implementa */
  implements: string[]

  /** Comandos da extensão */
  commands?: Command[]

  /** Itens do menu de contexto */
  contextMenu?: ContextMenuItem[]

  /** Atalhos de teclado */
  keybindings?: Keybinding[]

  /** Barra de ferramentas */
  tools?: ToolbarItem[]

  /** Barra de atividades */
  tabs?: Tab[]

  /** Painéis do editor */
  views?: View[]

  /** Implementações de APIs */
  apis?: string[]
}

/**
 * Representa os metadados da extensão.
 */
export interface ExtensionMetadata {
  /** Identificador da extensão (deve ser único) */
  id: string

  /** Nome da extensão */
  name: string

  /** Versão da extensão */
  version: string

  /** Descrição da extensão */
  description: string

  /** Contribuições da extensão */
  contributes: Contributions

  /** Dependências da extensão */
  dependencies?: string[]
}