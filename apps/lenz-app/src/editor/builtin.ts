import { registerEditorProvider } from "../providers";
import ExtensionPage from "../extensions/ExtensionPage.vue";
import { EXTENSION_PAGE_PREFIX } from "../extensions/page";
import KeybindingsPage from "../keybindings/KeybindingsPage.vue";
import TextEditor from "./TextEditor.vue";

/** The editor every file can be opened with. */
export function registerBuiltinEditors() {
  registerEditorProvider({
    id: "lenz.text",
    label: "Texto",
    icon: "lucide:file-text",
    selector: ["*"],
    resolveEditor: ({ document }) => ({
      type: "vue-component",
      component: TextEditor,
      props: { document },
    }),
  });
  registerEditorProvider({
    id: "lenz.keybindings",
    label: "Atalhos de teclado",
    icon: "lucide:keyboard",
    selector: [],
    resolveEditor: () => ({ type: "vue-component", component: KeybindingsPage }),
  });
  // The page of an extension. It is not chosen by file name: the tab asks for it by id.
  registerEditorProvider({
    id: "lenz.extension",
    label: "Extensão",
    icon: "lucide:blocks",
    selector: [],
    resolveEditor: ({ document }) => ({
      type: "vue-component",
      component: ExtensionPage,
      props: { extensionId: document.path.slice(EXTENSION_PAGE_PREFIX.length) },
    }),
  });
}
