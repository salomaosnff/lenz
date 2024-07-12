import { invoke } from "@tauri-apps/api/core";
import { emitTo } from "@tauri-apps/api/event";
import * as dialogApi from "./dialog/index.js";
import * as splash from "./splash.js";
import * as tools from "./tools.js";
import events from "./events.js";
import { Disposable, ExtensionMetadata } from "./types/index.js";

export interface ExtensionSearchItem {
  manifest: ExtensionMetadata;
  script_path: string;
}

export function search(): Promise<ExtensionSearchItem[]> {
  return invoke("extensions_search");
}

const describeTask = (...tasks: string[]) => {
  return emitTo("splash", "update", {
    tasks,
  });
};

const extensionMap = new Map<
  string,
  {
    exports: Record<string, any>;
    manifest: ExtensionMetadata;
    subscriptions: Set<Disposable>;
    deactivate?: () => any;
  }
>();

export async function init() {
  const extensions = await search();

  for (const extension of extensions) {
    await activate(extension);
  }

  console.log("All extensions activated");
  await splash.hide();
}

export async function activate(extension: ExtensionSearchItem) {
  try {
    events.emit("extensions:init", extension.manifest.id);
    console.log(`Initializing extension ${extension.manifest.id}...`);

    describeTask(`Initializing ${extension.manifest.name}...`);
    const task = describeTask.bind(null, extension.manifest.name);

    const exports = {};
    const subscriptions = new Set<Disposable>();

    // Prepare Tools
    for (const tool of extension.manifest.contributes.tools) {
      await tools.prepare(tool, extension.manifest.id)
    }

    const { activate, deactivate } = await import(
      /* @vite-ignore */ `user:/${extension.script_path}`
    );

    Object.assign(
      exports,
      (await activate?.({
        subscriptions,
        task,
      })) ?? {}
    );

    extensionMap.set(extension.manifest.id, {
      manifest: extension.manifest,
      subscriptions,
      exports,
      deactivate,
    });

    events.emit("extensions:activate", extension.manifest.id);

    console.log(`Extension ${extension.manifest.id} activated`);
  } catch (err: any) {
    events.emit("extensions:error", err, extension.manifest.id);

    await dialogApi.show(
      // print the error message and the stack trace
      `${JSON.stringify({
        name: err.name,
        message: err.message,
        stack: err.stack,
        source: err.sourceURL,
        line: err.line,
      }, null, 2)}`,
      {
        title: `Falha na ativação da extensão "${extension.manifest.name}"`,
        kind: "error",
      }
    );
  }
}

export async function deactivate(extensionId: string) {
  const extension = extensionMap.get(extensionId);

  if (!extension) {
    return;
  }

  await extension.deactivate?.();

  extension.subscriptions.forEach((disposer) => disposer.dispose());
  extension.subscriptions.clear();
  extensionMap.delete(extensionId);
}

export function get(extensionId: string) {
  const extension = extensionMap.get(extensionId);

  if (!extension) {
    return null
  }

  return {
    exports: extension.exports,
    manifest: extension.manifest,
  }
}
