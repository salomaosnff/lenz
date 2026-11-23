import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { forgetHistory, historyOf } from "./history";

export interface EditorTab {
  /** Unique id; also the file path. */
  id: string;
  name: string;
  content: string;
  /** Last saved content, used to compute the dirty state. */
  saved: string;
  /** Editor the user picked for this file; falls back to the first that applies. */
  editorId: string | null;
  /** Icon of the tab; files use the text icon. */
  icon?: string;
  /** Opens only with `editorId`, whatever the name: for pages that are not files. */
  locked?: boolean;
}

export interface OpenOptions {
  name?: string;
  icon?: string;
  editorId?: string;
  locked?: boolean;
}

const basename = (path: string) => path.split("/").pop() ?? path;

export const useEditorStore = defineStore("editor", () => {
  const tabs = ref<EditorTab[]>([]);
  const activeId = ref<string | null>(null);

  const activeTab = computed(() => tabs.value.find((t) => t.id === activeId.value));

  function isDirty(tab: EditorTab) {
    return tab.content !== tab.saved;
  }

  function open(path: string, content = `// ${path}\n`, options: OpenOptions = {}) {
    if (!tabs.value.some((t) => t.id === path)) {
      tabs.value.push({
        id: path,
        name: options.name ?? basename(path),
        content,
        saved: content,
        editorId: options.editorId ?? null,
        icon: options.icon,
        locked: options.locked,
      });
      // The history begins here, with the file as it was opened, even before an editor shows it.
      historyOf(tabs.value[tabs.value.length - 1]!);
    }
    activeId.value = path;
  }

  function setEditor(id: string, editorId: string) {
    const tab = tabs.value.find((t) => t.id === id);
    if (tab) tab.editorId = editorId;
  }

  function activate(id: string) {
    activeId.value = id;
  }

  function close(id: string) {
    const index = tabs.value.findIndex((t) => t.id === id);
    if (index === -1) return;
    forgetHistory(id);
    tabs.value.splice(index, 1);
    if (activeId.value === id) {
      // Same as VSCode: prefer the tab that took the closed one's place, else the previous.
      activeId.value = (tabs.value[index] ?? tabs.value[index - 1])?.id ?? null;
    }
  }

  function closeOthers(id: string) {
    tabs.value.filter((t) => t.id !== id).forEach((t) => forgetHistory(t.id));
    tabs.value = tabs.value.filter((t) => t.id === id);
    activeId.value = tabs.value[0]?.id ?? null;
  }

  function closeAll() {
    tabs.value.forEach((t) => forgetHistory(t.id));
    tabs.value = [];
    activeId.value = null;
  }

  function save(id: string | null = activeId.value) {
    const tab = tabs.value.find((t) => t.id === id);
    if (tab) tab.saved = tab.content;
  }

  function saveAll() {
    tabs.value.forEach((t) => (t.saved = t.content));
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= tabs.value.length) return;
    const [tab] = tabs.value.splice(from, 1);
    if (tab) tabs.value.splice(to, 0, tab);
  }

  /** Cycles through tabs; `step` is 1 (next) or -1 (previous). */
  function cycle(step: 1 | -1) {
    if (tabs.value.length < 2) return;
    const index = tabs.value.findIndex((t) => t.id === activeId.value);
    const next = (index + step + tabs.value.length) % tabs.value.length;
    activeId.value = tabs.value[next]!.id;
  }

  return {
    tabs,
    activeId,
    activeTab,
    isDirty,
    open,
    activate,
    setEditor,
    close,
    closeOthers,
    closeAll,
    save,
    saveAll,
    move,
    cycle,
  };
});
