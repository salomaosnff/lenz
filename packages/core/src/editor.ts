import type { NotInitialized } from './const';
import type { Command, Keybinding, Tab, ToolbarItem, View } from './types';

/** Representa uma contribuição de uma extensão */
export interface ExtensionContribution<T> {
  /** Identificador da extensão que está contribuindo */
  extensionId: string

  /** Metadados da contribuição */
  meta: T
}

/**
 * Representa um comando registrado por uma extensão
 */
export interface EditorStateCommand extends ExtensionContribution<Command> {
  /** Função que será executada quando o comando for disparado */
  handler: typeof NotInitialized | ((...args: any[]) => void)
}

/**
 * Item da barra de atividades do editor.
 */
export interface EditorStateTool extends ExtensionContribution<ToolbarItem> {
  /** Ordem de prioridade do item na barra de atividades */
  priority: number

  /** Itens filhos do item da barra de atividades */
  children: EditorStateTool[]

  /** Função que será executada quando o item da barra de atividades for clicado */
  handler: ((...args: any[]) => void) | typeof NotInitialized
}

/**
 * Item da barra de atividades do editor.
 */
export interface EditorStateTab extends ExtensionContribution<Tab> {
  /** Visões da barra de atividades */
  views: EditorStateView[]
}

/**
 * Visão do editor.
 */
export interface EditorStateView extends ExtensionContribution<View> {
  /** Se a visão está ativa */
  isActive: boolean
}

/**
 * Atalho de teclado.
 */
export interface EditorStateKeybinding extends ExtensionContribution<Keybinding> { }

/**
 * Item do menu de contexto.
 */
export interface EditorStateContextMenuItem extends ExtensionContribution<Command> {
  /** Itens filhos do item do menu de contexto */
  children: EditorStateContextMenuItem[]
}

/**
 * Estado do editor quando ele é inicializado.
 */
export interface EditorState {
  /** Commandos do editor */
  commands: Map<string, EditorStateCommand>

  /** Itens da barra de atividades */
  toolbar: EditorStateTool[]

  /** Visões do editor */
  views: EditorStateView[]

  /** Itens da barra de atividades */
  activityBar: EditorStateTab[]

  /** Item da barra de atividades ativo */
  activeToolbarItem: EditorStateTool | null

  /** Atalhos de teclado */
  keybindings: Map<string, EditorStateKeybinding>

  /** Menu de contexto */
  contextMenu: EditorStateContextMenuItem[]
}
