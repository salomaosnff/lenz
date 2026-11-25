import { shallowReactive } from "vue";
import type {
  Contributes,
  Disposable,
  Event,
  ExtensionContext,
  ExtensionWindow,
  WindowOptions,
} from "lenz-sdk";
import { implementTool } from "../agent-tools/extension-tools";
import { executeCommand, registerCommand } from "../commands";
import { setContextKey } from "../context";
import { useEditorStore } from "../editor/store";
import {
  historyOf,
  onDidChangeAnyHistory,
  onDidCloseHistory,
  onDidOpenHistory,
} from "../editor/history";
import { registerEditorProvider, registerViewProvider } from "../providers";
import { createNotificationsApi } from "../notifications";
import { createPromptsApi } from "../prompts";
import { openPageTab, PAGE_EDITOR_PREFIX } from "./page";
import { declaredBy } from "./declared";
import { extensionWindows, type ExtensionWindowEntry } from "./windows";

function createEmitter() {
  const listeners = new Set<() => void>();
  const event: Event = (listener) => {
    listeners.add(listener);
    return { dispose: () => void listeners.delete(listener) };
  };
  return { event, fire: () => [...listeners].forEach((l) => l()) };
}

function createWindow(extensionId: string, options: WindowOptions): ExtensionWindow {
  const key = `${extensionId}:${options.id}`;
  if (extensionWindows.has(key)) {
    throw new Error(`Window "${options.id}" already exists in extension "${extensionId}".`);
  }
  const closed = createEmitter();

  const entry: ExtensionWindowEntry = shallowReactive({
    key,
    title: options.title,
    content: options.content,
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    open: options.open ?? true,
    close() {
      if (!entry.open) return;
      entry.open = false;
      closed.fire();
    },
  });
  extensionWindows.set(key, entry);

  return {
    id: options.id,
    get isOpen() {
      return entry.open;
    },
    open: () => void (entry.open = true),
    close: () => entry.close(),
    onDidClose: closed.event,
    dispose() {
      entry.close();
      extensionWindows.delete(key);
    },
  };
}

/** The API surface one extension sees, scoped by its id. */
export function createExtensionContext(
  extensionId: string,
  getExports: (id: string) => unknown,
  dependencies: readonly string[] = [],
  contributes?: Contributes,
): ExtensionContext {
  // An extension can only register what its package.json declares.
  const declared = declaredBy(extensionId, contributes);
  const subscriptions: Disposable[] = [];
  const ownKeys = new Set<string>();
  subscriptions.push({ dispose: () => ownKeys.forEach((key) => setContextKey(key, undefined)) });
  // Messages still on screen when the extension goes cannot be answered any more.
  const notifications = createNotificationsApi(extensionId);
  subscriptions.push({ dispose: notifications.dismissAll });
  const prompts = createPromptsApi(extensionId);
  subscriptions.push({ dispose: prompts.dismiss });

  return {
    extensionId,
    subscriptions,
    commands: {
      registerCommand({ id, run }) {
        declared.command(id);
        // Only the id and what it does: the details are the manifest's, whatever else was passed.
        return registerCommand({ id, run });
      },
      executeCommand,
    },
    tools: {
      registerTool({ name, execute }) {
        declared.tool(name);
        return implementTool(name, execute);
      },
    },
    history: {
      get: (path) => {
        const tab = useEditorStore().tabs.find((t) => t.id === path);
        return tab ? historyOf(tab) : undefined;
      },
      list: () => useEditorStore().tabs.map(historyOf),
      onDidChange: onDidChangeAnyHistory,
      onDidOpen: onDidOpenHistory,
      onDidClose: onDidCloseHistory,
    },
    extensions: {
      getExports: <T>(id: string) => {
        if (!dependencies.includes(id)) {
          throw new Error(
            `"${extensionId}" must list "${id}" in its dependencies to use its exports.`,
          );
        }
        return getExports(id) as T;
      },
    },
    contextKeys: {
      set(key, value) {
        ownKeys.add(key);
        setContextKey(key, value);
      },
      unset(key) {
        ownKeys.delete(key);
        setContextKey(key, undefined);
      },
    },
    views: {
      registerViewProvider(provider) {
        declared.view(provider.viewId);
        return registerViewProvider(provider);
      },
    },
    editors: {
      registerEditorProvider({ id, resolveEditor }) {
        // Label, icon, selector and priority come from the manifest.
        return registerEditorProvider({ ...declared.editor(id), resolveEditor });
      },
    },
    pages: {
      registerPageProvider({ id, resolvePage }) {
        const page = declared.page(id);
        // A page is an editor that applies to no file name, so only its own tab shows it.
        return registerEditorProvider({
          id: `${PAGE_EDITOR_PREFIX}${id}`,
          label: page.title,
          icon: page.icon,
          selector: [],
          resolveEditor: () => resolvePage(),
        });
      },
      open(id) {
        openPageTab(id, declared.page(id));
      },
    },
    windows: { createWindow: (options) => createWindow(extensionId, options) },
    notifications: notifications.api,
    prompts: prompts.api,
  };
}
