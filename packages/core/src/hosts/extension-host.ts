import { existsSync } from 'node:fs';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { args } from '../args';
import { BUILTIN_EXTENSIONS_DIR, EXTENSIONS_DIR } from '../const';
import type { Disposable, ExtensionMetadata } from '../types';
import EventHost, { createAppEvent } from './event-host';
import { CommandHost, TabsHost, ToolHost, ViewHost } from './index';
import LogHost from './log-host';

/**
 * Informações públicas de uma extensão.
 */
export interface PublicExtension {
  meta: ExtensionMetadata
  exports: Record<string, unknown>
}

/**
 * Instância de uma extensão inicializada.
 */
export interface ExtensionInstance {
  /** Metadados da extensão. */
  meta: ExtensionMetadata

  /** Diretório da extensão. */
  dir: string

  /** Exportações da extensão. */
  exports: Record<string, unknown>

  /** Subscrições da extensão. */
  subscriptions: Set<Disposable>

  /** Arquivo de inicialização da extensão. */
  load(): Promise<{
    activate(): any
    deactivate(): Promise<void> | void
  }>
}

const extensionMap = new Map<string, ExtensionInstance>();

async function loadExtensionDir(dir: string): Promise<ExtensionInstance | undefined> {
  const metaFile = join(dir, 'package.json');

  if (!existsSync(metaFile)) {
    LogHost.error(`Extension ${dir} does not have a meta.json file`);
    return;
  }

  const meta = JSON.parse(await readFile(metaFile, 'utf8'));

  if (!meta.main) {
    LogHost.error(`Extension ${dir} does not have a main field in its meta.json file`);
    return;
  }

  const mainFile = join(dir, meta.main.replace(/(\.\.\/)+/gim, ''));

  if (!existsSync(mainFile)) {
    LogHost.warn(`Extension ${dir} does not have a main file`);
    return;
  }

  try {
    const {
      activate,
      deactivate,
    } = await require(mainFile);

    return createExtensionInstance({
      meta,
      dir,
      activate,
      deactivate,
    });
  } catch (error) {
    LogHost.error(`Error loading extension ${dir}`, error);
  }
}

export interface CreateExtensionInstanceOptions {
  meta: ExtensionMetadata
  dir: string
  activate?(context: any): Promise<any>
  deactivate?(context: any): Promise<void>
}

function createExtensionInstance({
  meta, dir, activate, deactivate,
}: CreateExtensionInstanceOptions): ExtensionInstance {
  const context = {
    get subscriptions() {
      return instance.subscriptions;
    },
    get exports() {
      return instance.exports;
    },
  };

  const instance: ExtensionInstance = {
    meta,
    dir,
    exports: {},
    async load() {
      return {
        activate() {
          return activate?.(context) ?? {};
        },
        deactivate() {
          return deactivate?.(context);
        },
      };
    },
    subscriptions: new Set<Disposable>(),
  };

  return instance;
}

async function* readExtensions(): AsyncGenerator<ExtensionInstance> {
  // Load Built-in Extensions
  for (const dir of await readdir(BUILTIN_EXTENSIONS_DIR)) {
    const extension = await loadExtensionDir(join(BUILTIN_EXTENSIONS_DIR, dir));

    if (extension) {
      yield extension;
    }
  }

  await mkdir(EXTENSIONS_DIR, { recursive: true });
  
  // Load User Extensions
  for (const dir of await readdir(EXTENSIONS_DIR)) {
    const extension = await loadExtensionDir(join(EXTENSIONS_DIR, dir));

    global.console.log('Loading extension', extension?.meta.id, extension?.dir)

    if (extension) {
      yield extension;
    }
  }

  // Load CLI Extensions
  for (const dir of args.loadExtension) {
    const extension = await loadExtensionDir(dir);

    if (extension) {
      yield extension;
    }
  }
}

/**
 * Inicializa todas as extensões de acordo com o arquivo de extensões.
 */
export async function start() {
  for await (const extension of readExtensions()) {
    extensionMap.set(extension.meta.id, extension);
  }
  await activateExtensions();
}

/**
 * Ativa todas as extensões por ordem de dependência.
 */
async function activateExtensions() {
  async function dfs(id: string, visited = new Set<string>()) {
    if (visited.has(id)) {
      return;
    }

    visited.add(id);

    const extension = extensionMap.get(id);

    if (!extension) {
      LogHost.warn(`Extension ${id} not found`);
      return;
    }

    const { dependencies = [] } = extension.meta;

    for (const depId of dependencies) {
      await dfs(depId, visited);
    }

    await activateExtension(extension);
  }

  const visited = new Set<string>();

  for (const id of extensionMap.keys()) {
    await dfs(id, visited);
  }
}

/**
 * Ativa uma extensão.
 * @param extension Extensão que será ativada.
 * @returns Uma promessa que será resolvida quando a extensão for ativada.
 */
async function activateExtension(extension: ExtensionInstance) {
  const {
    commands = [],
    tools = [],
    tabs = [],
    views = [],
    // contextMenu = [],
    // keybindings = [],
  } = extension.meta.contributes ?? {};


  for (const command of commands) {
    CommandHost.prepareCommand(extension.meta.id, command);
  }

  for (const tool of tools) {
    ToolHost.prepareTool(extension.meta.id, tool);
  }

  for (const tab of tabs) {
    TabsHost.prepareTab(extension.meta.id, tab);
  }

  for (const view of views) {
    ViewHost.prepareView(extension.meta.id, view);
  }

  extension.exports = await extension.load().then(ext => ext.activate());
  EventHost.emit(createAppEvent('extensions:extension:activated'), extension.meta.id);
  LogHost.log(`[ExtensionHost] Extension ${extension.meta.id} activated`);
}

/**
 * Desativa uma extensão.
 * @param extension Extensão que será desativada.
 * @returns Uma promessa que será resolvida quando a extensão for desativada.
 */
async function disposeExtension(extension: ExtensionInstance) {
  await extension.load().then(ext => ext.deactivate());

  for (const subscription of extension.subscriptions) {
    subscription.dispose();
  }

  extension.subscriptions.clear();
  extension.exports = {};

  EventHost.emit(createAppEvent('extensions:extension:deactivated'), extension.meta.id);
  LogHost.debug(`[ExtensionHost] Extension ${extension.meta.id} deactivated`);
}

/**
 * Para todas as extensões.
 */
export async function stop() {
  for (const extension of extensionMap.values()) {
    await disposeExtension(extension);
  }

  extensionMap.clear();

  EventHost.emit(createAppEvent('extensions:extensions:stopped'));
  LogHost.debug('All extensions stopped');
}

/**
 * Retorna a instância de uma extensão pelo seu identificador.
 * @param id Identificador da extensão.
 * @returns A instância da extensão.
 * @returns `undefined` se a extensão não existir.
 */
export function getExtensionInstance(id: string) {
  return extensionMap.get(id);
}

/**
 * Retorna uma extensão pelo seu identificador.
 * @param id Identificador da extensão.
 * @returns A extensão.
 */
export function getExtension(id: string): PublicExtension | undefined {
  const extension = getExtensionInstance(id);

  if (!extension) {
    return;
  }

  return {
    meta: extension.meta,
    exports: extension.exports,
  };
}

/**
 * Retorna o diretório de uma extensão pelo seu identificador.
 * @param id Identificador da extensão.
 * @returns O diretório da extensão.
 * @returns `undefined` se a extensão não existir.
 */
export function getExtensionDir(id: string) {
  return getExtensionInstance(id)?.dir;
}

/**
 * Host de extensões do editor.
 *
 * Este módulo é responsável por carregar e gerenciar as extensões do editor.
 */
export default {
  start,
  stop,
  getExtensionInstance,
  getExtension,
};
