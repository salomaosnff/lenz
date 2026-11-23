import { watch } from "vue";
import type { EditorDocument } from "lenz-sdk";
import { historyOf } from "./history";
import type { EditorTab } from "./store";

const documents = new WeakMap<EditorTab, EditorDocument>();

/**
 * The live document of a tab, shared by all of its editors. Getters read the
 * store, so Vue components using them re-render on edits.
 */
export function documentFor(tab: EditorTab): EditorDocument {
  let document = documents.get(tab);
  if (!document) {
    const history = historyOf(tab);
    document = {
      get path() {
        return tab.id;
      },
      get name() {
        return tab.name;
      },
      get content() {
        return tab.content;
      },
      get isDirty() {
        return tab.content !== tab.saved;
      },
      setContent(content, options) {
        tab.content = content;
        history.record(content, options);
      },
      history,
      onDidChangeContent: (listener) => ({
        dispose: watch(() => tab.content, listener),
      }),
    };
    documents.set(tab, document);
  }
  return document;
}
