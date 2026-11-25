import {
  parseManifest,
  type Disposable,
  type Extension,
  type ExtensionContext,
  type ExtensionManifest,
} from "lenz-sdk";
import { setExtensionWaiter as setToolWaiter } from "../agent-tools/extension-tools";
import { setExtensionWaiter } from "../commands";
import { createExtensionContext } from "./context";
import { registerContributions } from "./contributions";
import { disabledIds, externalExtensions, extensionRecords, updateRecord } from "./registry";

interface ActiveExtension {
  extension: Extension<unknown>;
  context: ExtensionContext;
  exports: unknown;
  /** The extensions it needs, from its manifest and from its code. */
  dependencies: string[];
}

const active = new Map<string, ActiveExtension>();

/** How long an extension waits for a dependency that never gets loaded (or forms a cycle). */
const DEPENDENCY_TIMEOUT = 10_000;

interface Activation {
  promise: Promise<void>;
  resolve(): void;
  reject(error: unknown): void;
}
const activations = new Map<string, Activation>();

/** Created on demand, so a dependent can wait for an extension that has not started loading. */
function activationOf(id: string): Activation {
  let activation = activations.get(id);
  if (!activation) {
    const deferred = {} as Activation;
    deferred.promise = new Promise<void>((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });
    deferred.promise.catch(() => {}); // only dependents care; avoid unhandled rejections
    activations.set(id, (activation = deferred));
  }
  return activation;
}

async function waitFor(id: string, dependency: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(
            `Dependency "${dependency}" of "${id}" was not activated (missing or circular).`,
          ),
        ),
      DEPENDENCY_TIMEOUT,
    );
  });
  try {
    await Promise.race([activationOf(dependency).promise, timeout]);
  } catch (error) {
    throw error instanceof Error && error.message.includes("was not activated")
      ? error
      : new Error(`Dependency "${dependency}" of "${id}" failed to activate.`, { cause: error });
  } finally {
    clearTimeout(timer);
  }
}

// A plain import() is rewritten by Vite (it appends `?import`, which it refuses for files in
// /public). Going through Function keeps it a native import, which is what an external script is.
const nativeImport = new Function("url", "return import(url)") as (url: string) => Promise<{
  default?: Extension<unknown>;
}>;

/** Reads and checks the `package.json` of an extension folder. */
export async function fetchManifest(baseUrl: string, fresh = false): Promise<ExtensionManifest> {
  const url = new URL("package.json", baseUrl).href;
  const response = await fetch(url, fresh ? { cache: "no-cache" } : undefined);
  if (!response.ok) throw new Error(`Could not read ${url} (${response.status}).`);
  return parseManifest(await response.json());
}

/** What an extension's `package.json` declared, to take away when it unloads. */
const contributions = new Map<string, Disposable[]>();

/**
 * Loads an extension from its folder: reads its `package.json`, registers what it contributes, then
 * imports the file `main` points to and activates it, after its dependencies. The module's `vue`
 * import is resolved by the import map in index.html to the host's Vue.
 */
export async function loadExtension(
  id: string,
  folderUrl: string,
  options: { builtin?: boolean; fresh?: boolean } = {},
) {
  if (active.has(id)) return;
  const base = new URL(folderUrl.endsWith("/") ? folderUrl : `${folderUrl}/`, location.href).href;
  const activation = activationOf(id);
  const builtin = options.builtin ?? builtinIds.includes(id);
  updateRecord(id, { folderUrl: base, builtin, status: "loading", error: undefined });
  try {
    const manifest = await fetchManifest(base, options.fresh);
    if (manifest.name !== id) {
      throw new Error(`The folder of "${id}" has a package.json named "${manifest.name}".`);
    }
    updateRecord(id, { folderUrl: base, manifest });
    contributions.set(id, registerContributions(manifest));

    // A reload must not get the module the browser already holds.
    const main = new URL(manifest.main, base);
    if (options.fresh) main.searchParams.set("v", String(Date.now()));
    const extension = (await nativeImport(main.href)).default;
    if (typeof extension?.activate !== "function") {
      throw new Error(`Extension "${id}" has no default export with an activate() function.`);
    }
    const dependencies = [
      ...new Set([...(manifest.extensionDependencies ?? []), ...(extension.dependencies ?? [])]),
    ];
    await Promise.all(dependencies.map((dependency) => waitFor(id, dependency)));

    const context = createExtensionContext(
      id,
      (other) => active.get(other)?.exports,
      dependencies,
      manifest.contributes,
    );
    const entry: ActiveExtension = { extension, context, exports: undefined, dependencies };
    active.set(id, entry);
    entry.exports = await extension.activate(context);
    updateRecord(id, { folderUrl: base, status: "active" });
    activation.resolve();
  } catch (error) {
    active.delete(id);
    updateRecord(id, {
      folderUrl: base,
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    });
    // What it declared would only fail when used: take it away with the extension.
    contributions
      .get(id)
      ?.reverse()
      .forEach((d) => d.dispose());
    contributions.delete(id);
    activation.reject(error);
    throw error;
  }
}

/**
 * Deactivates an extension, after the ones that depend on it, and takes away what it declared.
 * Returns the ids that were deactivated, the dependents first and `id` last.
 */
export async function unloadExtension(id: string): Promise<string[]> {
  const entry = active.get(id);
  if (!entry) {
    activations.delete(id);
    return [];
  }
  const unloaded: string[] = [];
  for (const [otherId, other] of active) {
    if (other.dependencies.includes(id)) unloaded.push(...(await unloadExtension(otherId)));
  }
  active.delete(id);
  activations.delete(id);
  await entry.extension.deactivate?.();
  entry.context.subscriptions.splice(0).forEach((d) => d.dispose());
  contributions
    .get(id)
    ?.reverse()
    .forEach((d) => d.dispose());
  contributions.delete(id);
  const record = extensionRecords.get(id);
  if (record)
    updateRecord(id, { folderUrl: record.folderUrl, status: "inactive", error: undefined });
  return [...unloaded, id];
}

export const isActive = (id: string) => active.has(id);

// A command or a tool declared by a manifest waits here for its extension to be active.
setExtensionWaiter((id) => activationOf(id).promise);
setToolWaiter((id) => activationOf(id).promise);

/** Extensions shipped with the app: the folders the build puts in /extensions/. */
export const builtinIds = [
  "html-visual-editor",
  "html-style-editor",
  "html-table-builder",
  "html-select-builder",
  "history-player",
];

const folderOfBuiltin = (id: string) => new URL(`/extensions/${id}/`, location.href).href;

/** Records an extension that is not going to run (turned off), so it still shows up in the list. */
async function register(id: string, folderUrl: string, builtin: boolean) {
  updateRecord(id, { folderUrl, builtin, status: "inactive" });
  try {
    updateRecord(id, { folderUrl, manifest: await fetchManifest(folderUrl) });
  } catch (error) {
    updateRecord(id, {
      folderUrl,
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Starts the built-in extensions and the ones the user loaded before, except the ones turned off. */
export async function loadInstalledExtensions() {
  const disabled = disabledIds();
  const installed = [
    ...builtinIds.map((id) => ({ id, url: folderOfBuiltin(id), builtin: true })),
    ...externalExtensions().map(({ id, url }) => ({ id, url, builtin: false })),
  ];
  await Promise.all(
    installed.map(({ id, url, builtin }) =>
      disabled.includes(id)
        ? register(id, url, builtin)
        : loadExtension(id, url, { builtin }).catch((error) =>
            console.error(`[lenz] failed to load extension "${id}"`, error),
          ),
    ),
  );
}
