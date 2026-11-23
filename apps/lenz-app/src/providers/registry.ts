import { shallowReactive } from "vue";
import type { Disposable, EditorProvider, ViewProvider } from "./types";

const viewProviders = shallowReactive(new Map<string, ViewProvider>());

/** Registers the provider for `provider.viewId`. Dispose to unregister. */
export function registerViewProvider(provider: ViewProvider): Disposable {
  if (viewProviders.has(provider.viewId)) {
    throw new Error(`A ViewProvider is already registered for view "${provider.viewId}".`);
  }
  viewProviders.set(provider.viewId, provider);
  return {
    dispose() {
      // Ignore if it was already replaced after a dispose.
      if (viewProviders.get(provider.viewId) === provider) viewProviders.delete(provider.viewId);
    },
  };
}

/** Reactive: components calling this re-evaluate when providers come and go. */
export function getViewProvider(viewId: string): ViewProvider | undefined {
  return viewProviders.get(viewId);
}

const editorProviders = shallowReactive(new Map<string, EditorProvider>());

/** Registers an editor. Ids are unique. Dispose to unregister. */
export function registerEditorProvider(provider: EditorProvider): Disposable {
  if (editorProviders.has(provider.id)) {
    throw new Error(`An EditorProvider is already registered with id "${provider.id}".`);
  }
  editorProviders.set(provider.id, provider);
  return {
    dispose() {
      if (editorProviders.get(provider.id) === provider) editorProviders.delete(provider.id);
    },
  };
}

export const getEditorProvider = (id: string) => editorProviders.get(id);

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function matchesSelector(selector: readonly string[], fileName: string) {
  return selector.some((pattern) => {
    const source = pattern.split("*").map(escapeRegExp).join(".*");
    return new RegExp(`^${source}$`, "i").test(fileName);
  });
}

/**
 * The editors that apply to a file: `default` ones first, then `option` ones,
 * each group in registration order. The first is what the file opens with.
 * Reactive: re-evaluates when editors are registered or removed.
 */
export function getEditorProvidersFor(fileName: string): EditorProvider[] {
  const matching = [...editorProviders.values()].filter((p) =>
    matchesSelector(p.selector, fileName),
  );
  const isDefault = (p: EditorProvider) => p.priority === "default";
  return [...matching.filter(isDefault), ...matching.filter((p) => !isDefault(p))];
}
